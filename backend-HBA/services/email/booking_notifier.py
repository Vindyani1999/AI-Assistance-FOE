from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from services.email.email_service import get_email_service, EmailPriority
from config.email_config import EmailTemplateType, get_email_settings
from models.booking import MRBSEntry
from models.room import MRBSRoom
from models.user import MRBSUser, MRBSModule
from utils.logger import get_logger

logger = get_logger(__name__)
email_settings = get_email_settings()


class BookingNotifier:
    
    def __init__(self):
        self.email_service = get_email_service()
    
    def _get_user_details(self, email: str, db: Session) -> Optional[MRBSUser]:
        try:
            user = db.query(MRBSUser).filter(MRBSUser.email == email).first()
            return user
        except Exception as e:
            logger.error(f"Error fetching user details for {email}: {e}")
            return None
    
    def _get_module_details(self, module_code: str, db: Session) -> Optional[MRBSModule]:
        try:
            module = db.query(MRBSModule).filter(
                MRBSModule.module_code == module_code
            ).first()
            return module
        except Exception as e:
            logger.error(f"Error fetching module details for {module_code}: {e}")
            return None
    
    def _format_booking_context(
        self,
        booking: MRBSEntry,
        room: MRBSRoom,
        user: Optional[MRBSUser] = None,
        module: Optional[MRBSModule] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        context = {
            "booking_id": booking.id,
            "room_name": room.room_name,
            "room_capacity": room.capacity,
            "room_description": room.description or "No description available",
            "room_area_id": room.area_id,
            "module_code": booking.name,
            "date": datetime.fromtimestamp(booking.start_time).strftime("%Y-%m-%d"),
            "start_time": datetime.fromtimestamp(booking.start_time).strftime("%H:%M"),
            "end_time": datetime.fromtimestamp(booking.end_time).strftime("%H:%M"),
            "day_of_week": datetime.fromtimestamp(booking.start_time).strftime("%A"),
            "created_by": booking.create_by,
            "modified_by": booking.modified_by,
            "timestamp": booking.timestamp.strftime("%Y-%m-%d %H:%M:%S") if booking.timestamp else "",
            "booking_description": booking.description or "",
            "booking_type": booking.type,
            "booking_status": booking.status,
            "system_name": "HBA Booking System",
            "current_year": datetime.now().year,
            "booking_url": self._generate_booking_url(booking.id)
        }
        
        context.update({
            "formatted_datetime": f"{context['date']} at {context['start_time']}",
            "time_range": f"{context['start_time']} - {context['end_time']}",
            "full_date": datetime.fromtimestamp(booking.start_time).strftime("%B %d, %Y")
        })
        
        if user:
            context.update({
                "user_name": user.name,
                "user_email": user.email,
                "user_id": user.id,
                "user_role": getattr(user, 'role', 'user')
            })
        else:
            context.update({
                "user_name": "User",
                "user_email": booking.create_by,
                "user_role": "user"
            })
        
        if module:
            context.update({
                "module_name": module.module_code,
                "module_students": module.number_of_students,
                "lecturer_id": module.lecture_id
            })
        
        duration_minutes = (booking.end_time - booking.start_time) // 60
        hours = duration_minutes // 60
        minutes = duration_minutes % 60
        duration_str = f"{hours}h {minutes}m" if hours > 0 else f"{minutes}m"
        context["duration"] = duration_str
        
        if additional_context:
            for key, value in additional_context.items():
                if isinstance(value, list):
                    if all(isinstance(item, str) for item in value):
                        context[key] = "\n".join(f"• {item}" for item in value)
                    else:
                        context[key] = str(value)
                else:
                    context[key] = value
        
        return context
    
    def _generate_booking_url(self, booking_id: int) -> str:
        base_url = "http://localhost:3000"
        return f"{base_url}/bookings/{booking_id}"
    
    async def notify_booking_created(
        self,
        booking: MRBSEntry,
        room: MRBSRoom,
        recipient_email: str,
        db: Session,
        cc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        
        if not email_settings.NOTIFY_ON_BOOKING_CREATED:
            logger.debug("Booking creation notifications disabled")
            return {"status": "disabled", "message": "Notifications disabled"}
        
        try:
            user = self._get_user_details(recipient_email, db)
            module = self._get_module_details(booking.name, db)
            
            additional_context = {
                "action": "created",
                "action_past": "created",
                "action_color": "#4CAF50",
                "confirmation_message": "Your booking has been successfully created.",
                
                "next_steps_text": "\n".join([
                    "• Arrive at least 5 minutes before your scheduled time",
                    "• Bring any necessary equipment or materials",
                    "• Contact us if you need to make any changes"
                ]),
                "support_email": "support@example.com",
                "can_modify": True,
                "can_cancel": True
            }
            
            context = self._format_booking_context(
                booking=booking,
                room=room,
                user=user,
                module=module,
                additional_context=additional_context
            )
            
            logger.info(f"[EMAIL] Sending booking creation notification to {recipient_email}")
            logger.debug(f"[EMAIL] Context keys: {list(context.keys())}")
            
            result = await self.email_service.send_templated_email(
                to_email=recipient_email,
                template_type=EmailTemplateType.BOOKING_CREATED,
                context=context,
                priority=EmailPriority.NORMAL,
                cc_emails=cc_emails
            )
            
            logger.info(
                f"[EMAIL] Booking creation notification result: "
                f"Booking ID {booking.id} to {recipient_email} | "
                f"Status: {result.get('status')}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"[EMAIL] Failed to send booking creation notification: {e}", exc_info=True)
            return {"status": "error", "error": str(e), "message": "Failed to send notification"}
    
    async def notify_booking_updated(
        self,
        booking: MRBSEntry,
        room: MRBSRoom,
        recipient_email: str,
        db: Session,
        changes: Optional[Dict[str, Any]] = None,
        old_data: Optional[Dict[str, Any]] = None,
        cc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
       
        if not email_settings.NOTIFY_ON_BOOKING_UPDATED:
            logger.debug("Booking update notifications disabled")
            return {"status": "disabled", "message": "Notifications disabled"}
        
        try:
            user = self._get_user_details(recipient_email, db)
            module = self._get_module_details(booking.name, db)
            
            changes_html = ""
            if changes:
                change_lines = []
                
                field_config = {
                    "room": {
                        "icon": "🏢",
                        "label": "Room"
                    },
                    "date": {
                        "icon": "📅",
                        "label": "Date"
                    },
                    "start_time": {
                        "icon": "🕐",
                        "label": "Start Time"
                    },
                    "end_time": {
                        "icon": "🕑",
                        "label": "End Time"
                    }
                }
                
                for key, value in changes.items():
                    config = field_config.get(key, {"icon": "•", "label": key.replace('_', ' ').title()})
                    icon = config["icon"]
                    label = config["label"]
                    
                    if "→" in str(value):
                        old_val, new_val = str(value).split("→")
                        old_val = old_val.strip()
                        new_val = new_val.strip()
                        
                        change_html = f'''
                        <div class="change-item">
                            <span class="change-label">{icon} {label}</span>
                            <span class="old-value">{old_val}</span>
                            <span class="change-arrow">→</span>
                            <span class="new-value">{new_val}</span>
                        </div>
                        '''
                        change_lines.append(change_html)
                    else:
                        change_html = f'''
                        <div class="change-item">
                            <span class="change-label">{icon} {label}</span>
                            <span class="new-value">{value}</span>
                        </div>
                        '''
                        change_lines.append(change_html)
                
                changes_html = "\n".join(change_lines)
            
            additional_context = {
                "action": "updated",
                "action_past": "updated",
                "action_color": "#2196F3",
                "changes_text": changes_html,  
                "has_changes": bool(changes),
                "update_message": "Your booking has been successfully updated.",
                "modification_time": datetime.now().strftime("%B %d, %Y at %I:%M %p"),
                "can_modify": True,
                "can_cancel": True,
                "support_email": "support@example.com"
            }
            
            if old_data:
                additional_context.update({
                    "old_room_name": old_data.get("room_name"),
                    "old_date": old_data.get("date"),
                    "old_start_time": old_data.get("start_time"),
                    "old_end_time": old_data.get("end_time")
                })
            
            context = self._format_booking_context(
                booking=booking,
                room=room,
                user=user,
                module=module,
                additional_context=additional_context
            )
            
            logger.info(f"[EMAIL] Sending booking update notification to {recipient_email}")
            logger.debug(f"[EMAIL] Changes: {len(changes) if changes else 0} fields modified")
            
            result = await self.email_service.send_templated_email(
                to_email=recipient_email,
                template_type=EmailTemplateType.BOOKING_UPDATED,
                context=context,
                priority=EmailPriority.NORMAL,
                cc_emails=cc_emails
            )
            
            logger.info(
                f"[EMAIL] Booking update notification result: "
                f"Booking ID {booking.id} to {recipient_email} | "
                f"Status: {result.get('status')} | "
                f"Changes: {list(changes.keys()) if changes else 'none'}"
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"[EMAIL] Failed to send booking update notification: {e}", 
                exc_info=True
            )
            return {
                "status": "error", 
                "error": str(e), 
                "message": "Failed to send notification"
            }
            
    async def notify_recurring_booking_created(
        self,
        room_name: str,
        module_code: str,
        start_date: str,
        end_date: str,
        start_time: str,
        end_time: str,
        recurrence_pattern: str,
        booking_dates: List[str],
        total_bookings: int,
        skipped_count: int,
        recipient_email: str,
        db: Session,
        cc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        
        if not email_settings.NOTIFY_ON_BOOKING_CREATED:
            logger.debug("Recurring booking notifications disabled")
            return {"status": "disabled", "message": "Notifications disabled"}
        
        try:
            user = self._get_user_details(recipient_email, db)
            
            formatted_dates = "\n".join([
                f"• {date}" for date in booking_dates[:10]
            ])
            
            if len(booking_dates) > 10:
                formatted_dates += f"\n• ... and {len(booking_dates) - 10} more dates"
            
            context = {
                "user_name": user.name if user else "User",
                "user_email": recipient_email,
                "room_name": room_name,
                "module_code": module_code,
                "start_date": start_date,
                "end_date": end_date,
                "start_time": start_time,
                "end_time": end_time,
                "recurrence_pattern": recurrence_pattern,
                "total_bookings": total_bookings,
                "skipped_count": skipped_count,
                "booking_dates": formatted_dates,  # Converted to string
                "system_name": "HBA Booking System",
                "current_year": datetime.now().year,
                "booking_url": "http://localhost:3000/bookings",
                "confirmation_message": f"Successfully created {total_bookings} recurring bookings",
                "action": "created",
                "action_color": "#4CAF50"
            }
            
            logger.info(
                f"[EMAIL] Sending recurring booking notification to {recipient_email} | "
                f"Room: {room_name} | Total: {total_bookings} bookings"
            )
            
            result = await self.email_service.send_templated_email(
                to_email=recipient_email,
                template_type=EmailTemplateType.RECURRING_BOOKING_CREATED,
                context=context,
                priority=EmailPriority.NORMAL,
                cc_emails=cc_emails
            )
            
            logger.info(
                f"[EMAIL] Recurring booking notification result: "
                f"To: {recipient_email} | "
                f"Status: {result.get('status')} | "
                f"Bookings: {total_bookings}"
            )
            
            return result
            
        except Exception as e:
            logger.error(
                f"[EMAIL] Failed to send recurring booking notification: {e}", 
                exc_info=True
            )
            return {
                "status": "error", 
                "error": str(e), 
                "message": "Failed to send notification"
            }
    
    async def notify_booking_deleted(
        self,
        booking_data: Dict[str, Any],
        recipient_email: str,
        db: Session,
        reason: Optional[str] = None,
        deleted_by: Optional[str] = None,
        cc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        
        if not email_settings.NOTIFY_ON_BOOKING_DELETED:
            logger.debug("Booking deletion notifications disabled")
            return {"status": "disabled", "message": "Notifications disabled"}
        
        try:
            user = self._get_user_details(recipient_email, db)
            
            date_str = booking_data.get("date", "")
            if isinstance(date_str, str):
                try:
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d")
                    formatted_date = date_obj.strftime("%B %d, %Y")
                    day_of_week = date_obj.strftime("%A")
                except:
                    formatted_date = date_str
                    day_of_week = ""
            else:
                formatted_date = str(date_str)
                day_of_week = ""
            
            context = {
                **booking_data,
                "action": "deleted",
                "action_past": "cancelled",
                "action_color": "#f44336",
                "user_name": user.name if user else "User",
                "user_email": recipient_email,
                "cancellation_reason": reason or "Cancelled by user request",
                "cancellation_message": "Your booking has been cancelled.",
                "deleted_by": deleted_by or recipient_email,
                "deleted_by_self": deleted_by == recipient_email if deleted_by else True,
                "deletion_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                "formatted_date": formatted_date,
                "day_of_week": day_of_week,
                "time_range": f"{booking_data.get('start_time', '')} - {booking_data.get('end_time', '')}",
                "system_name": "HBA Booking System",
                "current_year": datetime.now().year,
                "support_email": "support@example.com",
                "can_rebook": True,
                "rebook_url": "http://localhost:3000/bookings/new"
            }
            
            result = await self.email_service.send_templated_email(
                to_email=recipient_email,
                template_type=EmailTemplateType.BOOKING_DELETED,
                context=context,
                priority=EmailPriority.NORMAL,
                cc_emails=cc_emails
            )
            
            logger.info(
                f"[EMAIL] Booking deletion notification sent to {recipient_email} | "
                f"Status: {result.get('status')}"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"[EMAIL] Failed to send booking deletion notification: {e}", exc_info=True)
            return {"status": "error", "error": str(e), "message": "Failed to send notification"}

_booking_notifier_instance = None


def get_booking_notifier() -> BookingNotifier:
    global _booking_notifier_instance
    if _booking_notifier_instance is None:
        _booking_notifier_instance = BookingNotifier()
        logger.info("[EMAIL] Booking notifier initialized")
    return _booking_notifier_instance