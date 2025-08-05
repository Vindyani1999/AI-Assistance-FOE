from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.deepseek_llm import DeepSeekLLM
from src.database import get_db
from src.availability_logic import check_availability, add_booking, check_available_slotes
from src.entity_extraction import extract_entities
import json
import re

router = APIRouter()

class QuestionRequest(BaseModel):
    session_id: str
    question: str

# Required parameters per action
REQUIRED_FIELDS = {
    "check_availability": ["room_name", "date", "start_time", "end_time"],
    "add_booking": ["room_name", "date", "start_time", "end_time"],
    "alternatives": ["date", "start_time", "end_time"],
    "cancel_booking": ["booking_id"],
}

# Fallback prompts for missing parameters
FALLBACK_QUESTIONS = {
    "room_name": "Which room would you like to book?",
    "date": "What date would you like to book it for? Please use YYYY-MM-DD format.",
    "start_time": "What start time do you want? Please use HH:MM format.",
    "end_time": "What end time do you want? Please use HH:MM format.",
    "booking_id": "Please provide the booking ID to cancel.",
}

# In-memory session store
session_store = {}

def get_missing_params(params: dict, required_fields: list[str]) -> list[str]:
    return [f for f in required_fields if f not in params or not params[f]]

@router.post("/ask_llm/")
async def ask_llm(request: QuestionRequest, db=Depends(get_db)):
    session_id = request.session_id
    question = request.question
    session = session_store.get(session_id, {
    "action": None,
    "params": {},
    "last_asked": None,
    "missing_fields": []
})
    # If we were waiting for a missing parameter
    if session["last_asked"]:
        last_param = session["last_asked"]
        session["params"][last_param] = question
        session["missing_fields"] = [f for f in session["missing_fields"] if f != last_param]
        session["last_asked"] = None
        session_store[session_id] = session
    else:
        # No pending question – Call LLM to get intent and parameters
        llm = DeepSeekLLM()
        prompt = f"""
You are an intelligent assistant that helps manage room bookings.

From the following user request:
\"{question}\"

Extract the **action** and its corresponding **parameters** in **strict JSON format**.

Supported actions:
- "check_availability"
- "add_booking"
- "cancel_booking"
- "alternatives"

If the request is not related to any of these actions, return:
{{ "action": "unsupported", "parameters": {{}} }}

Required JSON structure:
{{
  "action": "check_availability" | "add_booking" | "cancel_booking" | "alternatives",
  "parameters": {{
    "room_name": "...",
    "date": "yyyy-mm-dd",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "booking_id": "..."  # Only needed for cancel_booking
  }}
}}

Respond in **only JSON format**, without explanations.
"""

        try:
            llm_response = llm._call(prompt)
            print("Raw LLM response:", llm_response)
            cleaned_response = re.sub(r"^```json|```$", "", llm_response.strip(), flags=re.MULTILINE).strip()
            print("Cleaned LLM response:", cleaned_response)
            parsed = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"Error parsing LLM output: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"LLM call failed: {str(e)}")

        if "action" not in parsed or "parameters" not in parsed:
            return {
                "status": "llm_response_invalid",
                "message": "LLM did not return a valid action or parameters.",
                "llm_response": cleaned_response
            }

        action = parsed["action"]
        params = parsed["parameters"]

        if action == "unsupported":
            return {
                "status": "unsupported_action",
                "message": "I'm here to help with room bookings only. Try asking something like 'Book LT1 tomorrow at 10am'."
            }

        # Entity extraction for any missing parameters
        extracted = extract_entities(question)
        for key, value in extracted.items():
            if key not in params or not params[key]:
                params[key] = value

        session["action"] = action
        session["params"] = params
        session["last_asked"] = None
        session_store[session_id] = session

    # Check for missing parameters
    required_fields = REQUIRED_FIELDS.get(session["action"], [])
    missing_fields = get_missing_params(session["params"], required_fields)
    session["missing_fields"] = missing_fields

    if missing_fields:
        next_missing = missing_fields[0]
        session["last_asked"] = next_missing
        session_store[session_id] = session
        return {
            "status": "missing_parameters",
            "missing_parameter": next_missing,
            "message": FALLBACK_QUESTIONS.get(next_missing, f"Please provide {next_missing}."),
    }

# Re-check after filling a missing field
    missing_fields = get_missing_params(session["params"], required_fields)
    if missing_fields:
        next_missing = missing_fields[0]
        session["last_asked"] = next_missing
        session["missing_fields"] = missing_fields
        session_store[session_id] = session
        return {
            "status": "missing_parameters",
            "missing_parameter": next_missing,
            "message": FALLBACK_QUESTIONS.get(next_missing, f"Please provide {next_missing}."),
    }

    # All parameters are available — proceed with action
    action = session["action"]
    params = session["params"]

    if action == "check_availability":
        return check_availability(
            room_name=params["room_name"],
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            db=db,
        )
    elif action == "add_booking":
        # Check availability first
        availability = check_availability(
            room_name=params["room_name"],
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            db=db,
        )
        if availability["status"] != "available":
            return {
                "status": "unavailable",
                "message": f"{params['room_name']} is NOT available on {params['date']} from {params['start_time']} to {params['end_time']}."
            }

        # Proceed with booking
        return add_booking(
            room_name=params["room_name"],
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            created_by=params.get("created_by", "system"),
            db=db,
        )
    elif action == "alternatives":
        return check_available_slotes(
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            db=db,
        )
    elif action == "cancel_booking":
        # You can add actual logic to delete booking from DB
        return {"status": "success", "message": f"Booking {params['booking_id']} cancelled."}

    return {"status": "error", "message": "Unhandled action."}
