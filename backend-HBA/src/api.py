from fastapi import FastAPI, APIRouter, HTTPException, Depends
from pydantic import BaseModel
from src.database import get_db
from src.deepseek_llm import DeepSeekLLM
from src.entity_extraction import extract_entities
from src.recurrence.recurrence_service import handle_recurring_booking
from src.recurrence.recurrence_prompt import RECURRENCE_PROMPT
from src.recurrence.recurrence_parser import extract_recurrence
from src.recurrence.recurrence_utils import build_rrule_from_extracted
import json
import re
from datetime import datetime
from src.availability_logic import check_availability, add_booking, check_available_slotes,book_recommendation_directly, cancel_booking,update_booking
from typing import Dict, Any, Optional, List


app = FastAPI()
router = APIRouter()

class QuestionRequest(BaseModel):
    session_id: str
    question: str
    
class RecommendationBookingRequest(BaseModel):
    session_id: str
    recommendation: Dict[str, Any]
    created_by: str


# Required parameters per action
REQUIRED_FIELDS = {
    "check_availability": ["room_name", "date", "start_time", "end_time"],
    "add_booking": ["room_name", "date", "module_code", "start_time", "end_time"],
    "add_recurring_booking": ["room_name", "start_date", "end_date", "start_time", "end_time", "module_code", "recurrence_rule"],
    "alternatives": ["date", "start_time", "end_time"],
    "cancel_booking": ["room_name", "date", "start_time", "end_time"],
    "update_booking": ["original_room_name", "original_date", "original_start_time", "original_end_time"] 
}

FALLBACK_QUESTIONS = {
    "room_name": "Which room would you like to book?",
    "module_code": "What is the module code?",
    "date": "What date would you like to book it for? Please use YYYY-MM-DD format.",
    "start_date": "What is the start date? Please use YYYY-MM-DD format.",
    "end_date": "What is the end date? Please use YYYY-MM-DD format?",
    "start_time": "What start time do you want? Please use HH:MM format.",
    "end_time": "What end time do you want? Please use HH:MM format.",
    "recurrence_rule": "Please specify the recurrence (e.g. every Monday).",
    "booking_id": "Please provide the booking ID to cancel.",
    "original_room_name": "Which room's booking do you want to update?",
    "original_date": "What date was the original booking for?",
    "original_start_time": "What was the original start time?",
    "original_end_time": "What was the original end time?",
}

# In-memory session store
session_store = {}

def get_missing_params(params: dict, required_fields: list[str]) -> list[str]:
    return [f for f in required_fields if f not in params or not params[f]]

def validate_time_format(time_str: str) -> bool:
    try:
        datetime.strptime(time_str, "%H:%M")
        return True
    except ValueError:
        return False

@router.post("/ask_llm/")
async def ask_llm(request: QuestionRequest, db=Depends(get_db)):
    session_id = request.session_id
    question = request.question.strip()
    session = session_store.get(session_id, {
        "action": None,
        "params": {},
        "last_asked": None,
        "missing_fields": []
    })

    # If waiting for missing param answer
    if session["last_asked"]:
        last_param = session["last_asked"]
        session["params"][last_param] = question
        session["missing_fields"] = [f for f in session["missing_fields"] if f != last_param]
        session["last_asked"] = None
        session_store[session_id] = session
    else:
        # First, try to detect recurrence
        recurrence_data = extract_recurrence(question)

        if recurrence_data.get("is_recurring"):
            # Build RRULE string
            try:
                recurrence_rule = build_rrule_from_extracted(recurrence_data)
            except Exception as e:
                raise HTTPException(status_code=400, detail=f"Error building recurrence rule: {str(e)}")

            # Build params for recurring booking action
            params = {
                "action": "add_recurring_booking",
                "parameters": {
                    "room_name": recurrence_data.get("room_name"),
                    "module_code": recurrence_data.get("module_code"),
                    "start_date": recurrence_data.get("start_date"),
                    "end_date": recurrence_data.get("end_date"),
                    "start_time": recurrence_data.get("start_time"),
                    "end_time": recurrence_data.get("end_time"),
                    "recurrence_rule": recurrence_rule,
                    "created_by": "system",
                }
            }
            print(f"[Recurrence Parser] params final:\n{params}")
            # Try to extract room_name using entity extraction fallback
            extracted = extract_entities(question)
            if "room_name" in extracted:
                params["parameters"]["room_name"] = extracted["room_name"]

            session["action"] = params["action"]
            session["params"] = params["parameters"]
            session["last_asked"] = None
            session_store[session_id] = session
        else:
            # Use standard LLM prompt for action extraction
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
- "update_booking" 

If the request is not related to any of these actions, return:
{{ "action": "unsupported", "parameters": {{}} }}

Required JSON structure:
{{
  "action": "check_availability" | "add_booking" | "cancel_booking" | "alternatives",
  "parameters": {{
    "room_name": "...",
    "module_code": "...",
    "date": "yyyy-mm-dd",
    "start_time": "HH:MM",
    "end_time": "HH:MM",
    "booking_id": "..."  # Only needed for cancel_booking
  }}
  
   "action": "update_booking",
  "parameters": {{
    "original_room_name": "...",
    "original_date": "yyyy-mm-dd", 
    "original_start_time": "HH:MM",
    "original_end_time": "HH:MM",
    "new_room_name": "..." (optional),
    "new_date": "yyyy-mm-dd" (optional),
    "new_start_time": "HH:MM" (optional), 
    "new_end_time": "HH:MM" (optional)
  }}
}}

Respond in **only JSON format**, without explanations.
"""
            try:
                llm_response = llm._call(prompt)
                cleaned_response = re.sub(r"^```json|```$", "", llm_response.strip(), flags=re.MULTILINE).strip()
                parsed = json.loads(cleaned_response)
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"LLM call/parse error: {str(e)}")

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
                    "message": "I'm here to help with room bookings only."
                }

            # Entity extraction fallback for missing params
            extracted = extract_entities(question)
            for key, value in extracted.items():
                if key not in params or not params[key]:
                    params[key] = value

            session["action"] = action
            session["params"] = params
            session["last_asked"] = None
            session_store[session_id] = session

    # Check for missing required fields
    required_fields = REQUIRED_FIELDS.get(session["action"], [])
    missing_fields = get_missing_params(session["params"], required_fields)
    session["missing_fields"] = missing_fields

    # Validate time formats if present
    for time_field in ["start_time", "end_time"]:
        if time_field in session["params"] and session["params"][time_field]:
            if not validate_time_format(session["params"][time_field]):
                return {
                    "status": "invalid_time_format",
                    "message": f"{time_field} must be in HH:MM format.",
                }

    if missing_fields:
        next_missing = missing_fields[0]
        session["last_asked"] = next_missing
        session_store[session_id] = session
        return {
            "status": "missing_parameters",
            "missing_parameter": next_missing,
            "message": FALLBACK_QUESTIONS.get(next_missing, f"Please provide {next_missing}."),
        }

    # All parameters collected, process action
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
        # availability = check_availability(
        #     room_name=params["room_name"],
        #     date=params["date"],
        #     start_time=params["start_time"],
        #     end_time=params["end_time"],
        #     db=db,
        # )
        # if availability["status"] != "available":
        #     return {
        #         "status": "unavailable",
        #         "message": f"{params['room_name']} is NOT available on {params['date']} from {params['start_time']} to {params['end_time']}."
        #     }
        # return add_booking(
    # # First check availability
    #     availability = check_availability(
    #     room_name=params["room_name"],
    #     date=params["date"],
    #     start_time=params["start_time"],
    #     end_time=params["end_time"],
    #     db=db,
    # )
    #     print("Availability response:", availability)

    #     if availability["status"] != "available":
    #         return {
    #         "status": "unavailable",
    #         "message": f"{params['room_name']} is NOT available on {params['date']} from {params['start_time']} to {params['end_time']}."
    #     }

    # # Then add booking if available
    #     return add_booking(
    #         room_name=params["room_name"],
    #         date=params["date"],
    #         start_time=params["start_time"],
    #         end_time=params["end_time"],
    #         created_by=params.get("created_by", "system"),
    #         db=db,
    #     )
        result = add_booking(
            room_name=params["room_name"],
            date=params["date"],
            name=params["module_code"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            created_by=params.get("created_by", "system"),
            db=db,
        )
        return result
    
    elif action == "add_recurring_booking":
        # unavailable_dates = []
        # for occurrence in rule.between(start_date_dt, end_date_dt, inc=True):
        #     date_str = occurrence.strftime("%Y-%m-%d")
        #     availability = check_availability(
        #         room_name=params["room_name"],
        #         date=date_str,
        #         start_time=params["start_time"],
        #         end_time=params["end_time"],
        #         db=db,
        #     )
        #     if availability["status"] != "available":
        #         unavailable_dates.append(date_str)

        # if unavailable_dates:
        #     return {
        #         "status": "unavailable",
        #         "message": f"{params['room_name']} is NOT available on the following dates: {', '.join(unavailable_dates)}."
        #     }

        # All available - create bookings
        result = await handle_recurring_booking(params, db)
        return result
    elif action == "alternatives":
        return check_available_slotes(
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            db=db,
        )
    elif action == "cancel_booking":
        return cancel_booking(
            room_name=params["room_name"],
            date=params["date"],
            start_time=params["start_time"],
            end_time=params["end_time"],
            db=db,
        )
        
    elif action == "update_booking":
        return update_booking(
            original_room_name=params["original_room_name"],
            original_date=params["original_date"],
            original_start_time=params["original_start_time"],
            original_end_time=params["original_end_time"],
            new_room_name=params.get("new_room_name"),
            new_date=params.get("new_date"),
            new_start_time=params.get("new_start_time"),
            new_end_time=params.get("new_end_time"),
            modified_by=params.get("modified_by", "system"),
            db=db,
        )
    return {"status": "error", "message": "Unhandled action."}



@router.post("/book_recommendation/")
async def book_recommendation(request: RecommendationBookingRequest, db=Depends(get_db)):
    try:
        result = book_recommendation_directly(
            recommendation=request.recommendation,
            created_by=request.created_by,
            db=db
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to book recommendation: {e}")

app.include_router(router)