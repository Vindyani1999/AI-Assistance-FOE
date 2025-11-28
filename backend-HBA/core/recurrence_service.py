from datetime import datetime, timedelta
from dateutil.rrule import rrulestr
from typing import Dict, List, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
import json
import re

from services.llm.deepseek_llm import DeepSeekLLM
from core.booking_service import BookingService
from utils.logger import get_logger
from services.email.booking_notifier import get_booking_notifier
from config.email_config import get_email_settings
from config.database_config import SessionLocal
import asyncio

logger = get_logger(__name__)


class RecurrenceService:
    
    RECURRENCE_PROMPT = """
You are an intelligent assistant that extracts recurrence patterns from booking requests.

From the following user request:
"{user_input}"

Detect if it contains a recurring booking pattern.
If yes, output the rule in strict JSON:
{{
  "is_recurring": true,
  "frequency": "daily" | "weekly" | "monthly",
  "days_of_week": ["Monday", "Wednesday"],
  "start_time": "HH:MM",
  "room_name": "<room_name>",
  "module_code": "<module_code>",
  "end_time": "HH:MM",
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD"
}}

If no recurrence is found, return:
{{
  "is_recurring": false
}}

Respond in JSON only.
"""
    
    def __init__(self, llm):
        self.llm = llm
    
    def extract_recurrence(self, user_input: str) -> Dict[str, Any]:
        logger.debug(f"Extracting recurrence from: {user_input}")
        
        small_talk = {"hi", "hello", "hey", "thanks", "thank you"}
        if user_input.lower().strip() in small_talk:
            logger.debug("Detected small talk, skipping LLM call")
            return {"is_recurring": False, "reason": "small_talk"}
        
        llm = DeepSeekLLM()
        prompt = self.RECURRENCE_PROMPT.format(user_input=user_input)
        
        try:
            raw = self.llm._call(prompt)
            cleaned = re.sub(r"^```json|```$", "", raw.strip(), flags=re.MULTILINE).strip()
            parsed = json.loads(cleaned)
            logger.debug(f"Parsed recurrence data: {parsed}")
            return parsed
        except json.JSONDecodeError:
            logger.warning("Failed to parse JSON from LLM response")
            return {"is_recurring": False, "reason": "json_error"}
        except Exception as e:
            logger.error(f"LLM call failed: {e}")
            return {"is_recurring": False, "reason": "llm_unavailable"}
    
    def build_rrule_from_extracted(self, data: Dict[str, Any]) -> str:
        freq_map = {"daily": "DAILY", "weekly": "WEEKLY", "monthly": "MONTHLY"}
        freq = freq_map.get(data.get("frequency"))
        
        if not freq:
            raise ValueError("Invalid frequency")
        
        byday = ""
        if freq == "WEEKLY" and "days_of_week" in data:
            day_map = {
                "Monday": "MO",
                "Tuesday": "TU",
                "Wednesday": "WE",
                "Thursday": "TH",
                "Friday": "FR",
                "Saturday": "SA",
                "Sunday": "SU",
            }
            days = [day_map[d] for d in data["days_of_week"] if d in day_map]
            if days:
                byday = ";BYDAY=" + ",".join(days)
        
        rrule = f"FREQ={freq}{byday}"
        logger.info(f"Built RRULE: {rrule}")
        return rrule
        
    async def handle_recurring_booking(
        self, 
        params: Dict[str, Any], 
        db: Session, 
        background_tasks: Optional[BackgroundTasks] = None
    ) -> Dict[str, Any]:
        
        room_name = params.get("room_name")
        module_code = params.get("module_code")
        start_date = params.get("start_date")
        end_date = params.get("end_date")
        start_time = params.get("start_time")
        end_time = params.get("end_time")
        recurrence_rule = params.get("recurrence_rule")
        created_by = params.get("created_by", "system")
        
        if not all([room_name, start_date, end_date, start_time, end_time, recurrence_rule]):
            raise HTTPException(
                status_code=400, 
                detail="Missing parameters for recurring booking"
            )
        
        try:
            start_date_dt = datetime.strptime(start_date, "%Y-%m-%d")
            end_date_dt = datetime.strptime(end_date, "%Y-%m-%d")
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid date format: {str(e)}"
            )
        
        current_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        if start_date_dt < current_date:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Past date not allowed",
                    "message": "Cannot create recurring booking starting from a past date.",
                    "requested_start_date": start_date,
                    "current_date": current_date.strftime("%Y-%m-%d")
                }
            )
        
        try:
            rule = rrulestr(recurrence_rule, dtstart=start_date_dt)
        except Exception as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid recurrence rule: {str(e)}"
            )
        
        bookings_created = []
        booked_dates = []
        skipped_past_dates = []
        
        booking_service = BookingService(db)
        
        
        for occurrence in rule.between(start_date_dt, end_date_dt, inc=True):
            date_str = occurrence.strftime("%Y-%m-%d")
            
            try:
                availability = booking_service.check_availability(
                    room_name=room_name,
                    date=date_str,
                    start_time=start_time,
                    end_time=end_time
                )
                
                if availability["status"] != "available":
                    logger.warning(f"⚠️ Room unavailable for {date_str}: {availability.get('message', 'Unknown reason')}")
                    return {
                        "status": "unavailable",
                        "message": f"{room_name} is NOT available on {date_str} from {start_time} to {end_time}.",
                        "failed_date": date_str,
                        "reason": availability.get("message", "Room unavailable")
                    }
            except Exception as e:
                logger.error(f"❌ Availability check failed for {date_str}: {e}")
                return {
                    "status": "error",
                    "message": f"Failed to check availability for {date_str}: {str(e)}",
                    "failed_date": date_str
                }
            
            try:
                booking = booking_service.add_booking(
                    room_name=room_name,
                    name=module_code,
                    date=date_str,
                    start_time=start_time,
                    end_time=end_time,
                    created_by=created_by,
                    background_tasks=None  
                )
                
                if booking.get("status") == "success":
                    bookings_created.append(booking)
                    booked_dates.append(date_str)
                else:
                    return {
                        "status": "booking_failed",
                        "message": f"Failed to create booking for {date_str}",
                        "failed_date": date_str,
                        "reason": booking.get("message", "Unknown error")
                    }
            except Exception as e:
                logger.error(f"❌ Booking creation failed for {date_str}: {e}")
                return {
                    "status": "error",
                    "message": f"Error creating booking for {date_str}: {str(e)}",
                    "failed_date": date_str
                }
        
        response = {
            "status": "success",
            "message": f"Created {len(bookings_created)} recurring bookings.",
            "bookings": bookings_created,
            "total_bookings": len(bookings_created),
            "skipped_count": len(skipped_past_dates)
        }
        
        if skipped_past_dates:
            response["skipped_dates"] = skipped_past_dates
        
        if background_tasks and len(bookings_created) > 0:
            email_settings = get_email_settings()
            
            if email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                try:
                    start_dt = datetime.strptime(start_time, "%H:%M")
                    end_dt = datetime.strptime(end_time, "%H:%M")
                    duration_minutes = (end_dt.hour * 60 + end_dt.minute) - (start_dt.hour * 60 + start_dt.minute)
                    hours = duration_minutes // 60
                    minutes = duration_minutes % 60
                    duration = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
                    total_duration_hours = round((duration_minutes * len(bookings_created)) / 60, 1)
                except Exception as e:
                    logger.warning(f"Failed to calculate duration: {e}")
                    duration = "N/A"
                    total_duration_hours = "N/A"
                
                
                recurrence_pattern = self._format_recurrence_pattern(recurrence_rule)
                
                def send_recurring_email_task():
                    try:
                        bg_db = SessionLocal()
                        
                        try:
                            notifier = get_booking_notifier()
                            
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            try:
                                result = loop.run_until_complete(
                                    notifier.notify_recurring_booking_created(
                                        room_name=room_name,
                                        module_code=module_code,
                                        start_date=start_date,
                                        end_date=end_date,
                                        start_time=start_time,
                                        end_time=end_time,
                                        recurrence_pattern=recurrence_pattern,
                                        booking_dates=booked_dates,
                                        total_bookings=len(bookings_created),
                                        skipped_count=len(skipped_past_dates),
                                        recipient_email=created_by,
                                        db=bg_db
                                    )
                                )
                                
                                
                                if result.get("status") == "sent":
                                    logger.info(
                                        f"✅✅ RECURRING BOOKING EMAIL SENT to {created_by}"
                                    )
                                else:
                                    logger.warning(
                                        f"⚠️ Recurring booking email not sent: {result}"
                                    )
                            
                            finally:
                                loop.close()
                        
                        except Exception as e:
                            logger.error(
                                f"❌ Recurring booking email error: {e}", 
                                exc_info=True
                            )
                        
                        finally:
                            bg_db.close()
                            logger.info("✅ Background DB session closed")
                    
                    except Exception as e:
                        logger.error(
                            f"❌ Recurring booking email task failed: {e}", 
                            exc_info=True
                        )
                
                background_tasks.add_task(send_recurring_email_task)
                logger.info("✅ Recurring booking email task queued")
                response["email_queued"] = True
        
        return response

    def _format_recurrence_pattern(self, rrule: str) -> str:
        try:
            if "FREQ=DAILY" in rrule:
                return "Every day"
            elif "FREQ=WEEKLY" in rrule:
                if "BYDAY=" in rrule:
                    days_match = re.search(r"BYDAY=([A-Z,]+)", rrule)
                    if days_match:
                        days_abbr = days_match.group(1).split(",")
                        day_map = {
                            "MO": "Monday", "TU": "Tuesday", "WE": "Wednesday",
                            "TH": "Thursday", "FR": "Friday", "SA": "Saturday", "SU": "Sunday"
                        }
                        days = [day_map.get(d, d) for d in days_abbr]
                        if len(days) == 1:
                            return f"Every {days[0]}"
                        else:
                            return f"Every {', '.join(days[:-1])} and {days[-1]}"
                return "Every week"
            elif "FREQ=MONTHLY" in rrule:
                return "Every month"
            else:
                return "Custom recurrence"
        except Exception as e:
            logger.error(f"Error formatting recurrence pattern: {e}")
            return "Recurring booking"