from typing import Dict, Any, Optional, List
from datetime import datetime
from sqlalchemy.orm import Session

from services.email.email_service import get_email_service, EmailPriority
from config.email_config import EmailTemplateType, get_email_settings
from models.booking import MRBSEntry, MRBSSwapRequest
from models.room import MRBSRoom
from models.user import MRBSUser
from utils.logger import get_logger

logger = get_logger(__name__)
email_settings = get_email_settings()


class SwapNotifier:
    def __init__(self):
        self.email_service = get_email_service()
    
    def _format_swap_context(
        self,
        swap_request: MRBSSwapRequest,
        requested_booking: MRBSEntry,
        requested_room: MRBSRoom,
        offered_booking: Optional[MRBSEntry] = None,
        offered_room: Optional[MRBSRoom] = None,
        requester: Optional[MRBSUser] = None,
        offerer: Optional[MRBSUser] = None,
        additional_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        context = {
            "swap_id": swap_request.id,
            "swap_status": swap_request.status,
            "requested_booking_id": requested_booking.id,
            "requested_room_name": requested_room.room_name,
            "requested_date": datetime.fromtimestamp(requested_booking.start_time).strftime("%Y-%m-%d"),
            "requested_start_time": datetime.fromtimestamp(requested_booking.start_time).strftime("%H:%M"),
            "requested_end_time": datetime.fromtimestamp(requested_booking.end_time).strftime("%H:%M"),
            "requested_module_code": requested_booking.name,
            "requester_name": requester.name if requester else "Unknown",
            "requester_email": requester.email if requester else "",
            "system_name": "HBA Booking System",
            "current_year": datetime.now().year,
            "swap_url": self._generate_swap_url(swap_request.id)
        }
        
        if offered_booking and offered_room:
            context.update({
                "offered_booking_id": offered_booking.id,
                "offered_room_name": offered_room.room_name,
                "offered_date": datetime.fromtimestamp(offered_booking.start_time).strftime("%Y-%m-%d"),
                "offered_start_time": datetime.fromtimestamp(offered_booking.start_time).strftime("%H:%M"),
                "offered_end_time": datetime.fromtimestamp(offered_booking.end_time).strftime("%H:%M"),
                "offered_module_code": offered_booking.name,
                "offerer_name": offerer.name if offerer else "Unknown",
                "offerer_email": offerer.email if offerer else ""
            })
        
        if additional_context:
            context.update(additional_context)
        
        return context
    
    def _generate_swap_url(self, swap_id: int) -> str:
        base_url = "http://localhost:3000"  
        return f"{base_url}/swaps/{swap_id}"
    
    async def notify_swap_requested(
        self,
        swap_request: MRBSSwapRequest,
        requested_booking: MRBSEntry,
        requested_room: MRBSRoom,
        offered_booking: Optional[MRBSEntry],
        offered_room: Optional[MRBSRoom],
        db: Session
    ) -> Dict[str, Any]:
       
        if not email_settings.NOTIFY_ON_SWAP_REQUESTED:
            logger.debug("Swap request notifications disabled")
            return {"status": "disabled"}
        
        try:
            requester = db.query(MRBSUser).filter(
                MRBSUser.id == swap_request.requested_by
            ).first()
            
            offerer = None
            if swap_request.offered_by:
                offerer = db.query(MRBSUser).filter(
                    MRBSUser.id == swap_request.offered_by
                ).first()
            
            context = self._format_swap_context(
                swap_request=swap_request,
                requested_booking=requested_booking,
                requested_room=requested_room,
                offered_booking=offered_booking,
                offered_room=offered_room,
                requester=requester,
                offerer=offerer,
                additional_context={
                    "action": "requested",
                    "message": "A new swap request has been created."
                }
            )
            
            results = {}
            
            if requester:
                results["requester"] = await self.email_service.send_templated_email(
                    to_email=requester.email,
                    template_type=EmailTemplateType.SWAP_REQUESTED,
                    context={
                        **context,
                        "recipient_type": "requester",
                        "message": "Your swap request has been submitted successfully."
                    },
                    priority=EmailPriority.NORMAL
                )
            
            if offerer:
                results["offerer"] = await self.email_service.send_templated_email(
                    to_email=offerer.email,
                    template_type=EmailTemplateType.SWAP_REQUESTED,
                    context={
                        **context,
                        "recipient_type": "offerer",
                        "message": f"{requester.name if requester else 'Someone'} has requested to swap bookings with you."
                    },
                    priority=EmailPriority.HIGH
                )
            
            logger.info(f"Swap request notifications sent: Swap ID {swap_request.id}")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to send swap request notifications: {e}")
            return {"status": "error", "error": str(e)}
    
    async def notify_swap_approved(
        self,
        swap_request: MRBSSwapRequest,
        requested_booking: MRBSEntry,
        requested_room: MRBSRoom,
        offered_booking: MRBSEntry,
        offered_room: MRBSRoom,
        db: Session
    ) -> Dict[str, Any]:
      
        if not email_settings.NOTIFY_ON_SWAP_APPROVED:
            logger.debug("Swap approval notifications disabled")
            return {"status": "disabled"}
        
        try:
            requester = db.query(MRBSUser).filter(
                MRBSUser.id == swap_request.requested_by
            ).first()
            
            offerer = db.query(MRBSUser).filter(
                MRBSUser.id == swap_request.offered_by
            ).first()
            
            context = self._format_swap_context(
                swap_request=swap_request,
                requested_booking=requested_booking,
                requested_room=requested_room,
                offered_booking=offered_booking,
                offered_room=offered_room,
                requester=requester,
                offerer=offerer,
                additional_context={
                    "action": "approved",
                    "message": "The swap request has been approved and bookings have been exchanged."
                }
            )
            
            results = {}
            
            if requester:
                results["requester"] = await self.email_service.send_templated_email(
                    to_email=requester.email,
                    template_type=EmailTemplateType.SWAP_APPROVED,
                    context={
                        **context,
                        "recipient_type": "requester"
                    },
                    priority=EmailPriority.HIGH
                )
            
            if offerer:
                results["offerer"] = await self.email_service.send_templated_email(
                    to_email=offerer.email,
                    template_type=EmailTemplateType.SWAP_APPROVED,
                    context={
                        **context,
                        "recipient_type": "offerer"
                    },
                    priority=EmailPriority.HIGH
                )
            
            logger.info(f"Swap approval notifications sent: Swap ID {swap_request.id}")
            
            return results
            
        except Exception as e:
            logger.error(f"Failed to send swap approval notifications: {e}")
            return {"status": "error", "error": str(e)}
    
    async def notify_swap_rejected(
        self,
        swap_request: MRBSSwapRequest,
        requested_booking: MRBSEntry,
        requested_room: MRBSRoom,
        db: Session,
        rejection_reason: Optional[str] = None
    ) -> Dict[str, Any]:
        if not email_settings.NOTIFY_ON_SWAP_REJECTED:
            logger.debug("Swap rejection notifications disabled")
            return {"status": "disabled"}
        
        try:
            requester = db.query(MRBSUser).filter(
                MRBSUser.id == swap_request.requested_by
            ).first()
            
            if not requester:
                logger.warning(f"Requester not found for swap {swap_request.id}")
                return {"status": "error", "error": "Requester not found"}
            
            context = self._format_swap_context(
                swap_request=swap_request,
                requested_booking=requested_booking,
                requested_room=requested_room,
                requester=requester,
                additional_context={
                    "action": "rejected",
                    "rejection_reason": rejection_reason or "No reason provided",
                    "message": "Unfortunately, your swap request has been declined."
                }
            )
            
            result = await self.email_service.send_templated_email(
                to_email=requester.email,
                template_type=EmailTemplateType.SWAP_REJECTED,
                context=context,
                priority=EmailPriority.NORMAL
            )
            
            logger.info(f"Swap rejection notification sent: Swap ID {swap_request.id}")
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to send swap rejection notification: {e}")
            return {"status": "error", "error": str(e)}


_swap_notifier_instance = None


def get_swap_notifier() -> SwapNotifier:
    global _swap_notifier_instance
    if _swap_notifier_instance is None:
        _swap_notifier_instance = SwapNotifier()
    return _swap_notifier_instance