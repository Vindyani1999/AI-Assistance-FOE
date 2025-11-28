from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, BackgroundTasks
import time
import asyncio
from models.booking import MRBSEntry
from models.room import MRBSRoom
from models.user import MRBSUser, MRBSModule
from core.validation_service import ValidationService
from utils.logger import get_logger
from services.recommendations.core.hybridRecommendations import hybridRecommendationsEngine as HybridRecommendationEngine
from config.recommendation_config import RecommendationConfig 
from services.email.booking_notifier import get_booking_notifier
from config.email_config import get_email_settings

logger = get_logger(__name__)

config = RecommendationConfig()
email_settings = get_email_settings()

class BookingService:
    
    def __init__(self, db: Session, recommendation_engine=None):
        self.db = db
        self.recommendation_engine = recommendation_engine 
        self.validator = ValidationService()
        self.booking_notifier = get_booking_notifier()
        
        try:
            self.recommendation_engine = HybridRecommendationEngine(config=config)
            logger.info("Recommendation engine initialized successfully")
        except Exception as e:
            logger.warning(f"Recommendation engine initialization failed: {e}")
            self.recommendation_engine = None
    
    def check_availability(self, room_name: str, date: str, start_time: str, 
                      end_time: str) -> Dict[str, Any]:
        logger.info(f"Checking availability: {room_name} on {date} {start_time}-{end_time}")
        
        room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == room_name).first()
        
        if not room:
            recommendations = self._get_recommendations(room_name, date, start_time, end_time)
            return {
                "status": "room_not_found",
                "message": f"Room '{room_name}' not found.",
                "recommendations": recommendations
            }
        
        start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
        end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
        
        start_ts = int(time.mktime(start_dt.timetuple()))
        end_ts = int(time.mktime(end_dt.timetuple()))
        
        conflicting = self.db.query(MRBSEntry).filter(
            MRBSEntry.room_id == room.id,
            MRBSEntry.start_time < end_ts,
            MRBSEntry.end_time > start_ts,
        ).first()
        
        if conflicting:
            recommendations = self._get_recommendations(room_name, date, start_time, end_time)
            return {
                "status": "unavailable",
                "message": f"{room_name} is already booked for that time. Here are some available alternatives:",
                "recommendations": recommendations  
            }
        
        return {
            "status": "available",
            "message": f"{room_name} is available from {start_time} to {end_time} on {date}."
        }
    
    
    def add_booking(self, room_name: str, name: str, date: str, start_time: str, 
                   end_time: str, created_by: str, background_tasks: Optional[BackgroundTasks] = None) -> Dict[str, Any]:
        
        try:
            self.validator.validate_future_datetime(date, start_time, "book")
        
            room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == room_name).first()
        
            if not room:
                recommendations = self._get_recommendations(room_name, date, start_time, end_time)
                raise HTTPException(
                    status_code=404,
                    detail={
                        "error": "Room not found",
                        "message": f"Room '{room_name}' not found.",
                        "recommendations": recommendations
                    }
                )

            start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
        
            start_ts = int(time.mktime(start_dt.timetuple()))
            end_ts = int(time.mktime(end_dt.timetuple()))
        
            if end_ts <= start_ts:
                raise HTTPException(status_code=400, detail="End time must be after start time")
            
            conflict = self.db.query(MRBSEntry).filter(
                MRBSEntry.room_id == room.id,
                MRBSEntry.start_time < end_ts,
                MRBSEntry.end_time > start_ts,
            ).first()
            
            if conflict:
                recommendations = self._get_recommendations(room_name, date, start_time, end_time)
                return {
                    "status": "unavailable",
                    "message": f"Room '{room_name}' is already booked. Here are alternatives:",
                    "recommendations": recommendations
                }
            
            current_datetime = datetime.now()
            
            new_booking = MRBSEntry(
                start_time=start_ts,
                end_time=end_ts,
                entry_type=0,
                repeat_id=None,
                room_id=room.id,
                timestamp=current_datetime,
                create_by=created_by,
                modified_by=created_by,
                name=name,
                type='E',
                description=f"Booked by {created_by}",
                status=0,
                reminded=None,
                info_time=None,
                info_user=None,
                info_text=None,
                ical_uid=f"{room_name}_{start_ts}_{end_ts}",
                ical_sequence=0,
                ical_recur_id=None
            )
            
            self.db.add(new_booking)
            self.db.commit()
            self.db.refresh(new_booking)
            
            booking_id = new_booking.id
            
            if not email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                logger.warning("⚠️ Email notifications are DISABLED in settings")
            
            if background_tasks is None:
                logger.warning("⚠️ BackgroundTasks not provided to add_booking method")
            
            if background_tasks and email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                
                booking_dict = {
                    "id": booking_id,
                    "start_time": start_ts,
                    "end_time": end_ts,
                    "name": name,
                    "create_by": created_by,
                    "modified_by": created_by,
                    "description": f"Booked by {created_by}",
                    "timestamp": current_datetime,
                    "type": 'E',
                    "status": 0,
                    "room_id": room.id
                }
                
                room_dict = {
                    "id": room.id,
                    "room_name": room.room_name,
                    "capacity": room.capacity,
                    "description": room.description,
                    "area_id": room.area_id
                }
                
                
                def send_email_task():
                    
                    try:
                        from config.database_config import SessionLocal
                        
                        bg_db = SessionLocal()
                        logger.info("✅ New DB session created for background task")
                        
                        try:
                            class MockBooking:
                                def __init__(self, data):
                                    for key, value in data.items():
                                        setattr(self, key, value)
                            
                            class MockRoom:
                                def __init__(self, data):
                                    for key, value in data.items():
                                        setattr(self, key, value)
                            
                            mock_booking = MockBooking(booking_dict)
                            mock_room = MockRoom(room_dict)
                            
                            
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            try:
                                result = loop.run_until_complete(
                                    self.booking_notifier.notify_booking_created(
                                        booking=mock_booking,
                                        room=mock_room,
                                        recipient_email=created_by,
                                        db=bg_db
                                    )
                                )
                                
                                logger.info(f"✅ Email send result: {result}")
                                
                                if result.get("status") == "sent":
                                    logger.info(f"✅✅ EMAIL SENT SUCCESSFULLY to {created_by}")
                                else:
                                    logger.warning(f"⚠️ Email not sent: {result}")
                                    
                            finally:
                                loop.close()
                                logger.info("🔄 Event loop closed")
                            
                        except Exception as e:
                            logger.error(f"❌ Error in email task inner block: {e}", exc_info=True)
                            
                        finally:
                            bg_db.close()
                            logger.info("✅ Background DB session closed")
                            
                    except Exception as e:
                        logger.error(f"❌ Error in email task outer block: {e}", exc_info=True)
                
                background_tasks.add_task(send_email_task)
                logger.info("✅ Email task added to background queue")
            else:
                if not background_tasks:
                    logger.warning("⚠️ Cannot send email: BackgroundTasks not available")
                if not email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                    logger.warning("⚠️ Cannot send email: Email notifications disabled")
                
            return {
                "status": "success",
                "message": "Booking created successfully",
                "booking_id": booking_id,
                "room": room_name,
                "date": date,
                "start_time": start_time,
                "end_time": end_time,
                "created_by": created_by,
                "email_queued": background_tasks is not None and email_settings.ENABLE_EMAIL_NOTIFICATIONS
            }
        
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Booking creation failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Unexpected error: {e}")   
    
    def update_booking(self, original_room_name: str, original_date: str, original_start_time: str, 
                    original_end_time: str, new_room_name: str = None, new_date: str = None,
                    new_start_time: str = None, new_end_time: str = None, 
                    modified_by: str = "system", background_tasks: Optional[BackgroundTasks] = None):
        try:
            room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == original_room_name).first()
            if not room:
                return {"status": "room_not_found", "message": f"Room '{original_room_name}' not found."}
            
            start_dt = datetime.strptime(f"{original_date} {original_start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{original_date} {original_end_time}", "%Y-%m-%d %H:%M")
            start_ts, end_ts = int(time.mktime(start_dt.timetuple())), int(time.mktime(end_dt.timetuple()))
            
            booking = self.db.query(MRBSEntry).filter(
                MRBSEntry.room_id == room.id,
                MRBSEntry.start_time == start_ts,
                MRBSEntry.end_time == end_ts
            ).first()
            
            if not booking:
                return {"status": "booking_not_found", 
                    "message": f"No booking found for {original_room_name} on {original_date} from {original_start_time} to {original_end_time}."}
            
            if booking.create_by != modified_by:
                raise HTTPException(
                    status_code=403, 
                    detail=f"Access denied. Only the booking creator ({booking.create_by}) can update this booking."
                )
            
            original_data = {
            "room_name": original_room_name,
            "date": original_date,
            "start_time": original_start_time,
            "end_time": original_end_time,
            "room_id": room.id
        }
            
            final_room_name = new_room_name or original_room_name
            final_date = new_date or original_date
            final_start_time = new_start_time or original_start_time
            final_end_time = new_end_time or original_end_time
            
            final_room_id = room.id
            final_room = room
            
            if new_room_name and new_room_name != original_room_name:
                new_room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == new_room_name).first()
                if not new_room:
                    return {"status": "new_room_not_found", "message": f"New room '{new_room_name}' not found."}
                final_room_id = new_room.id
                final_room = new_room
            
            final_start_dt = datetime.strptime(f"{final_date} {final_start_time}", "%Y-%m-%d %H:%M")
            final_end_dt = datetime.strptime(f"{final_date} {final_end_time}", "%Y-%m-%d %H:%M")
            final_start_ts, final_end_ts = int(time.mktime(final_start_dt.timetuple())), int(time.mktime(final_end_dt.timetuple()))
            
            if final_end_ts <= final_start_ts:
                return {"status": "invalid_time", "message": "End time must be after start time."}
            
            if (final_room_id != room.id or final_start_ts != start_ts or final_end_ts != end_ts):
                conflict = self.db.query(MRBSEntry).filter(
                    MRBSEntry.room_id == final_room_id,
                    MRBSEntry.start_time < final_end_ts,
                    MRBSEntry.end_time > final_start_ts,
                    MRBSEntry.id != booking.id
                ).first()
                
                if conflict:
                    return {"status": "unavailable", "message": "The new time slot is not available."}
            
            changes = {}
        
            if final_room_name != original_room_name:
                changes["room"] = f"{original_room_name} → {final_room_name}"
            
            if final_date != original_date:
                changes["date"] = f"{original_date} → {final_date}"
            
            if final_start_time != original_start_time:
                changes["start_time"] = f"{original_start_time} → {final_start_time}"
            
            if final_end_time != original_end_time:
                changes["end_time"] = f"{original_end_time} → {final_end_time}"
            

            booking.room_id = final_room_id
            booking.start_time = final_start_ts
            booking.end_time = final_end_ts
            booking.modified_by = modified_by
            booking.timestamp = datetime.now()
            
            self.db.commit()
            self.db.refresh(booking)
            

            if background_tasks and email_settings.ENABLE_EMAIL_NOTIFICATIONS and changes:
                
                booking_dict = {
                    "id": booking.id,
                    "start_time": final_start_ts,
                    "end_time": final_end_ts,
                    "name": booking.name,
                    "create_by": booking.create_by,
                    "modified_by": modified_by,
                    "description": booking.description,
                    "timestamp": booking.timestamp,
                    "type": booking.type,
                    "status": booking.status,
                    "room_id": final_room_id
                }
                
                room_dict = {
                    "id": final_room.id,
                    "room_name": final_room.room_name,
                    "capacity": final_room.capacity,
                    "description": final_room.description,
                    "area_id": final_room.area_id
                }
                
                changes_copy = changes.copy()
                old_data_copy = original_data.copy()
                
                def send_update_email_task():
                    
                    try:
                        from config.database_config import SessionLocal
                        
                        bg_db = SessionLocal()
                        
                        try:
                            class MockBooking:
                                def __init__(self, data):
                                    for key, value in data.items():
                                        setattr(self, key, value)
                            
                            class MockRoom:
                                def __init__(self, data):
                                    for key, value in data.items():
                                        setattr(self, key, value)
                            
                            mock_booking = MockBooking(booking_dict)
                            mock_room = MockRoom(room_dict)
                            
                            
                            loop = asyncio.new_event_loop()
                            asyncio.set_event_loop(loop)
                            
                            try:
                                result = loop.run_until_complete(
                                    self.booking_notifier.notify_booking_updated(
                                        booking=mock_booking,
                                        room=mock_room,
                                        recipient_email=modified_by,
                                        db=bg_db,
                                        changes=changes_copy,
                                        old_data=old_data_copy
                                    )
                                )
                                
                                if result.get("status") == "sent":
                                    logger.info(f"✅✅ UPDATE EMAIL SENT to {modified_by}")
                                else:
                                    logger.warning(f"⚠️ Update email not sent: {result}")
                            
                            finally:
                                loop.close()
                        
                        except Exception as e:
                            logger.error(f"❌ Update email error: {e}", exc_info=True)
                        
                        finally:
                            bg_db.close()
                            logger.info("✅ Background DB session closed")
                    
                    except Exception as e:
                        logger.error(f"❌ Update email task failed: {e}", exc_info=True)
                
                background_tasks.add_task(send_update_email_task)
                logger.info("✅ Update email task queued")
            
            return {
                "status": "success",
                "message": "Booking updated successfully",
                "booking_id": booking.id,
                "original": {"room": original_room_name, "date": original_date, "start_time": original_start_time, "end_time": original_end_time},
                "updated": {"room": final_room_name, "date": final_date, "start_time": final_start_time, "end_time": final_end_time},
                "changes": changes,
                "modified_by": modified_by,
                "email_queued": background_tasks is not None and email_settings.ENABLE_EMAIL_NOTIFICATIONS and bool(changes)
            }
            
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            raise HTTPException(status_code=500, detail=f"Error updating booking: {e}")

    
    def delete_booking(self, booking_id: int, background_tasks: Optional[BackgroundTasks] = None) -> Dict[str, Any]:
        try:
            logger.info(f"Deleting booking: ID {booking_id}")
            
            booking = self.db.query(MRBSEntry).filter(MRBSEntry.id == booking_id).first()
            if not booking:
                raise HTTPException(status_code=404, detail="Booking not found")
            
            room = self.db.query(MRBSRoom).filter(MRBSRoom.id == booking.room_id).first()
            
            booking_data = {
                "booking_id": booking.id,
                "room_name": room.room_name if room else "Unknown",
                "module_code": getattr(booking, 'module_code', booking.name),  # FIXED: Handle missing attribute
                "date": datetime.fromtimestamp(booking.start_time).strftime("%Y-%m-%d"),
                "start_time": datetime.fromtimestamp(booking.start_time).strftime("%H:%M"),
                "end_time": datetime.fromtimestamp(booking.end_time).strftime("%H:%M"),
                "created_by": booking.create_by
            }
            
            recipient_email = booking.create_by
            
            self.db.delete(booking)
            self.db.commit()
            
            logger.info(f"Booking deleted successfully: ID {booking_id}")
            
            if background_tasks and email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                
                def send_delete_email_sync():
                    try:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        
                        loop.run_until_complete(
                            self.booking_notifier.notify_booking_deleted(
                                booking_data=booking_data,
                                recipient_email=recipient_email,
                                db=self.db
                            )
                        )
                        
                        loop.close()
                        logger.info(f"✅ Delete email sent to {recipient_email}")
                        
                    except Exception as e:
                        logger.error(f"❌ Failed to send delete email: {e}", exc_info=True)
                
                background_tasks.add_task(send_delete_email_sync)
            
            return {"status": "success", "message": "Booking deleted successfully"}
        
        except HTTPException:
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Delete booking failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")
        
            
    def cancel_booking(self, room_name: str, date: str, start_time: str, 
                      end_time: str, user_email: str, background_tasks: Optional[BackgroundTasks] = None) -> Dict[str, Any]:
        
        try:
            room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == room_name).first()
            
            if not room:
                return {
                    "status": "room_not_found",
                    "message": f"Room '{room_name}' not found."
                }
            
            start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
            start_ts = int(time.mktime(start_dt.timetuple()))
            end_ts = int(time.mktime(end_dt.timetuple()))
            
            booking = self.db.query(MRBSEntry).filter(
                MRBSEntry.room_id == room.id,
                MRBSEntry.start_time == start_ts,
                MRBSEntry.end_time == end_ts
            ).first()
            
            if not booking:
                return {
                    "status": "no_booking_found",
                    "message": f"No booking found for {room_name} on {date} from {start_time} to {end_time}."
                }
            
            if booking.create_by != user_email:
                raise HTTPException(
                    status_code=403,
                    detail=f"Access denied. Only the booking creator ({booking.create_by}) can cancel this booking."
                )
            
            booking_data = {
                "booking_id": booking.id,
                "room_name": room_name,
                "module_code": getattr(booking, 'module_code', booking.name),  # FIXED: Handle missing attribute
                "date": date,
                "start_time": start_time,
                "end_time": end_time,
                "created_by": user_email
            }
            
            self.db.delete(booking)
            self.db.commit()
            
            logger.info(f"Booking canceled successfully: ID {booking.id}")
            
            if background_tasks and email_settings.ENABLE_EMAIL_NOTIFICATIONS:
                
                def send_cancel_email_sync():
                    try:
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        
                        loop.run_until_complete(
                            self.booking_notifier.notify_booking_deleted(
                                booking_data=booking_data,
                                recipient_email=user_email,
                                db=self.db
                            )
                        )
                        
                        loop.close()
                        logger.info(f"✅ Cancel email sent to {user_email}")
                        
                    except Exception as e:
                        logger.error(f"❌ Failed to send cancel email: {e}", exc_info=True)
                
                background_tasks.add_task(send_cancel_email_sync)
            
            return {
                "status": "success",
                "message": f"Successfully cancelled booking for {room_name} on {date}.",
                "cancelled_booking_id": booking.id
            }
        except HTTPException:
            raise
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date/time format: {e}")
        except Exception as e:
            self.db.rollback()
            logger.error(f"❌ Cancel booking failed: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error cancelling booking: {str(e)}")

    
    def get_available_slots(self, room_name: str, date: str) -> Dict[str, Any]:
        
        self.validator.validate_future_datetime(date, "00:00", "check available slots")
        
        room = self.db.query(MRBSRoom).filter(MRBSRoom.room_name == room_name).first()
        
        if not room:
            raise HTTPException(status_code=404, detail=f"Room '{room_name}' not found.")
        
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        start_time = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=7)
        end_time = datetime.combine(date_obj, datetime.min.time()) + timedelta(hours=21)
        
        all_slots = []
        current = start_time
        while current < end_time:
            slot_start = current
            slot_end = current + timedelta(minutes=30)
            all_slots.append((int(time.mktime(slot_start.timetuple())), int(time.mktime(slot_end.timetuple()))))
            current = slot_end
        
        day_start_ts = int(time.mktime(start_time.timetuple()))
        day_end_ts = int(time.mktime(end_time.timetuple()))
        
        bookings = self.db.query(MRBSEntry).filter(
            MRBSEntry.room_id == room.id,
            MRBSEntry.start_time < day_end_ts,
            MRBSEntry.end_time > day_start_ts
        ).all()
        
        available_slots = []
        current_time = datetime.now()
        
        for slot_start, slot_end in all_slots:
            slot_datetime = datetime.fromtimestamp(slot_start)
            
            if slot_datetime <= current_time:
                continue
            
            conflict = any(
                booking.start_time < slot_end and booking.end_time > slot_start
                for booking in bookings
            )
            
            if not conflict:
                available_slots.append({
                    "start_time": datetime.fromtimestamp(slot_start).strftime("%H:%M"),
                    "end_time": datetime.fromtimestamp(slot_end).strftime("%H:%M")
                })
        
        if not available_slots:
            recommendations = self._get_recommendations(room_name, date, "09:00", "17:00")
            return {
                "status": "no_slots_available",
                "message": f"No available time slots found for {room_name} on {date}.",
                "room": room_name,
                "date": date,
                "available_slots": [],
                "recommendations": recommendations
            }
        
        return {
            "room": room_name,
            "date": date,
            "available_slots": available_slots
        }
    
    def get_bookings_by_date_and_room(self, date: str, room_id: int) -> List[Dict[str, Any]]:
        logger.info(f"Fetching bookings for room {room_id} on {date}")
        
        try:
            day_start = datetime.strptime(date, "%Y-%m-%d")
            next_day = day_start + timedelta(days=1)
            
            start_ts = int(time.mktime(day_start.timetuple()))
            next_day_ts = int(time.mktime(next_day.timetuple()))
            
            bookings = (
                self.db.query(MRBSEntry)
                .filter(
                    MRBSEntry.start_time < next_day_ts,
                    MRBSEntry.end_time > start_ts,
                    MRBSEntry.room_id == room_id
                )
                .order_by(MRBSEntry.start_time.asc())
                .all()
            )
            
            return [
                {
                    "id": b.id,
                    "room_id": b.room_id,
                    "name": b.name,
                    "date": datetime.fromtimestamp(b.start_time).strftime("%Y-%m-%d"),
                    "start_time": datetime.fromtimestamp(b.start_time).strftime("%H:%M"),
                    "end_time": datetime.fromtimestamp(b.end_time).strftime("%H:%M"),
                    "created_by": b.create_by,
                    "status": b.status,
                }
                for b in bookings
            ]
        except ValueError as e:
            raise HTTPException(status_code=400, detail=f"Invalid date format (expected YYYY-MM-DD): {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error fetching bookings by date: {e}")

    
    def _get_recommendations(self, room_name: str, date: str, start_time: str, 
                        end_time: str) -> List[Dict[str, Any]]:
        
        if not self.recommendation_engine:
            logger.warning("Recommendation engine not available")
            return []
        
        try:
            start_dt = datetime.strptime(f"{date} {start_time}", "%Y-%m-%d %H:%M")
            end_dt = datetime.strptime(f"{date} {end_time}", "%Y-%m-%d %H:%M")
            
            request_data = {
                "user_id": "system",
                "room_id": room_name,
                "start_time": start_dt,  
                "end_time": end_dt,      
                "date": date,
                "purpose": "meeting",
                "capacity": 1,
                "requirements": {"original_room": room_name}
            }
            
            recommendations = self.recommendation_engine.get_recommendations(request_data)
            logger.info(f"Generated {len(recommendations)} recommendations")
            return recommendations
            
        except Exception as e:
            logger.error(f"Recommendation system error: {e}")
            return []
 

def fetch_user_profile_by_email(email: str, db: Session):
    user = db.query(MRBSUser).filter(MRBSUser.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role
    }
    

def fetch_booking_by_id(booking_id: int, db: Session):
    try:
        booking = db.query(MRBSEntry).filter(MRBSEntry.id == booking_id).first()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        return booking
    except Exception as e:
        logger.error(f"Error fetching booking by ID: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

def fetch_moduleCodes_by_user_email(email: str, db: Session):
    user = db.query(MRBSUser).filter(MRBSUser.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    modules = db.query(MRBSModule).filter(MRBSModule.lecture_id == user.id).all()
    return [module.module_code for module in modules]

def fetch_all_halls(db: Session):
    halls = db.query(MRBSRoom).all()
    return [hall.room_name for hall in halls]


def fetch_halls_by_module_code(module_code: str, db: Session):
    module = db.query(MRBSModule).filter(MRBSModule.module_code == module_code).first()
    if not module:
        return []  
    halls = self.db.query(MRBSRoom).filter(MRBSRoom.capacity >= module.number_of_students).all()
    
    return [hall.room_name for hall in halls]