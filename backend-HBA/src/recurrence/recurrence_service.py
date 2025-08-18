from datetime import datetime, timedelta
from dateutil.rrule import rrulestr
from src.availability_logic import check_availability, add_booking
from fastapi import HTTPException

async def handle_recurring_booking(params: dict, db):
    """
    Handles creating recurring bookings based on recurrence_rule.

    Example recurrence_rule: "FREQ=WEEKLY;BYDAY=MO"
    Or natural language like "every Monday" (You can map this to RRULE string).
    """

    room_name = params.get("room_name")
    module_code = params.get("module_code")
    start_date = params.get("start_date")
    end_date = params.get("end_date")
    start_time = params.get("start_time")
    end_time = params.get("end_time")
    recurrence_rule = params.get("recurrence_rule")

    # Validate basic params
    if not all([room_name, start_date, end_date, start_time, end_time, recurrence_rule]):
        raise HTTPException(status_code=400, detail="Missing parameters for recurring booking")

    # Convert to datetime objects
    try:
        start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {str(e)}")

    # Parse recurrence rule — for demo, support simple weekly by day
    # Example: "every Monday" → RRULE:FREQ=WEEKLY;BYDAY=MO
    # For simplicity, you could pre-parse or map natural language to RRULE string.

    # For demo, let's assume recurrence_rule is already an RRULE string.
    try:
        rule = rrulestr(recurrence_rule, dtstart=start_date_dt)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid recurrence rule: {str(e)}")

    bookings_created = []
    for occurrence in rule.between(start_date_dt, end_date_dt, inc=True):
        date_str = occurrence.strftime("%Y-%m-%d")

        # Check availability for this occurrence
        availability = check_availability(
            room_name=room_name,
            date=date_str,
            start_time=start_time,
            end_time=end_time,
            db=db,
        )

        if availability["status"] != "available":
            return {
                "status": "unavailable",
                "message": f"{room_name} is NOT available on {date_str} from {start_time} to {end_time}."
            }

        # Add booking
        booking = add_booking(
            room_name=room_name,
            name=module_code,
            date=date_str,
            start_time=start_time,
            end_time=end_time,
            created_by=params.get("created_by", "system"),
            db=db,
        )
        bookings_created.append(booking)

    return {
        "status": "success",
        "message": f"Created {len(bookings_created)} recurring bookings.",
        "bookings": bookings_created,
    }
