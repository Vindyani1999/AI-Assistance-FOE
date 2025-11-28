from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from enum import Enum
import asyncio
from collections import deque
import backoff
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from email_validator import validate_email, EmailNotValidError

from config.email_config import get_email_settings, EmailTemplateType
from services.email.template_renderer import TemplateRenderer
from utils.logger import get_logger

logger = get_logger(__name__)
email_settings = get_email_settings()


class EmailPriority(str, Enum):
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(email_settings.SENDGRID_API_KEY)
        self.template_renderer = TemplateRenderer()
        self.from_email = email_settings.SENDGRID_FROM_EMAIL
        self.from_name = email_settings.SENDGRID_FROM_NAME
        
        self.email_queue = deque(maxlen=email_settings.EMAIL_RATE_LIMIT_PER_MINUTE)
        self.last_minute = datetime.now()
        
        self.stats = {
            "total_sent": 0,
            "total_failed": 0,
            "retries": 0,
            "last_error": None
        }
        
        logger.info(
            f"Email service initialized | "
            f"From: {self.from_email} | "
            f"Rate limit: {email_settings.EMAIL_RATE_LIMIT_PER_MINUTE}/min"
        )
    
    def _validate_email_address(self, email: str) -> bool:
       
        try:
            validate_email(email, check_deliverability=False)
            return True
        except EmailNotValidError as e:
            logger.error(f"Invalid email address '{email}': {e}")
            return False
    
    def _check_rate_limit(self) -> bool:
     
        now = datetime.now()
        
        if (now - self.last_minute).total_seconds() >= 60:
            self.email_queue.clear()
            self.last_minute = now
        
        if len(self.email_queue) >= email_settings.EMAIL_RATE_LIMIT_PER_MINUTE:
            logger.warning(
                f"Rate limit reached: {len(self.email_queue)}/{email_settings.EMAIL_RATE_LIMIT_PER_MINUTE}"
            )
            return False
        
        return True
    
    async def _wait_for_rate_limit(self):
        now = datetime.now()
        wait_time = 60 - (now - self.last_minute).total_seconds()
        
        if wait_time > 0:
            logger.info(f"Rate limited, waiting {wait_time:.1f}s")
            await asyncio.sleep(wait_time)
            self.email_queue.clear()
            self.last_minute = datetime.now()
    
    @backoff.on_exception(
        backoff.expo,
        Exception,
        max_tries=email_settings.EMAIL_MAX_RETRIES,
        max_time=60
    )
    async def _send_email_with_retry(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None
    ) -> Dict[str, Any]:
      
        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content)
            )
            
            if plain_content:
                message.add_content(Content("text/plain", plain_content))
            
            if cc_emails:
                for cc_email in cc_emails:
                    if self._validate_email_address(cc_email):
                        message.add_cc(cc_email)
            
            if bcc_emails:
                for bcc_email in bcc_emails:
                    if self._validate_email_address(bcc_email):
                        message.add_bcc(bcc_email)
            
            response = self.client.send(message)
            
            self.email_queue.append(datetime.now())
            
            self.stats["total_sent"] += 1
            
            result = {
                "status": "sent",
                "message_id": response.headers.get("X-Message-Id"),
                "status_code": response.status_code,
                "to_email": to_email,
                "subject": subject,
                "timestamp": datetime.now().isoformat()
            }
            
            logger.info(
                f"Email sent successfully | "
                f"To: {to_email} | "
                f"Subject: {subject} | "
                f"Message ID: {result['message_id']}"
            )
            
            return result
            
        except Exception as e:
            self.stats["total_failed"] += 1
            self.stats["last_error"] = str(e)
            self.stats["retries"] += 1
            
            logger.error(
                f"Failed to send email | "
                f"To: {to_email} | "
                f"Subject: {subject} | "
                f"Error: {e}",
                exc_info=True
            )
            raise
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None,
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        priority: EmailPriority = EmailPriority.NORMAL
    ) -> Dict[str, Any]:
        
        if not email_settings.ENABLE_EMAIL_NOTIFICATIONS:
            logger.debug("Email notifications disabled")
            return {
                "status": "disabled",
                "message": "Email notifications are disabled"
            }
        
        if not self._validate_email_address(to_email):
            return {
                "status": "error",
                "error": "invalid_email",
                "message": f"Invalid email address: {to_email}"
            }
        
        if not self._check_rate_limit():
            if priority == EmailPriority.HIGH:
                await self._wait_for_rate_limit()
            else:
                return {
                    "status": "rate_limited",
                    "message": "Rate limit exceeded, email queued"
                }
        
        try:
            result = await self._send_email_with_retry(
                to_email=to_email,
                subject=subject,
                html_content=html_content,
                plain_content=plain_content,
                cc_emails=cc_emails,
                bcc_emails=bcc_emails
            )
            return result
            
        except Exception as e:
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to send email after retries"
            }
    
    async def send_templated_email(
        self,
        to_email: str,
        template_type: str,
        context: Dict[str, Any],
        cc_emails: Optional[List[str]] = None,
        bcc_emails: Optional[List[str]] = None,
        priority: EmailPriority = EmailPriority.NORMAL
    ) -> Dict[str, Any]:
       
        try:
            rendered = self.template_renderer.render_template(
                template_type=template_type,
                context=context
            )
            
            result = await self.send_email(
                to_email=to_email,
                subject=rendered["subject"],
                html_content=rendered["html"],
                plain_content=rendered.get("text"),
                cc_emails=cc_emails,
                bcc_emails=bcc_emails,
                priority=priority
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Failed to send templated email: {e}", exc_info=True)
            return {
                "status": "error",
                "error": str(e),
                "message": "Failed to render or send template"
            }
    
    async def send_batch_emails(
        self,
        recipients: List[Dict[str, Any]],
        template_type: str,
        base_context: Optional[Dict[str, Any]] = None,
        priority: EmailPriority = EmailPriority.NORMAL
    ) -> Dict[str, Any]:
       
        results = {
            "total": len(recipients),
            "sent": 0,
            "failed": 0,
            "details": []
        }
        
        base_context = base_context or {}
        
        batch_size = email_settings.EMAIL_BATCH_SIZE
        
        for i in range(0, len(recipients), batch_size):
            batch = recipients[i:i + batch_size]
            
            tasks = []
            for recipient in batch:
                context = {**base_context, **recipient.get("context", {})}
                task = self.send_templated_email(
                    to_email=recipient["email"],
                    template_type=template_type,
                    context=context,
                    priority=priority
                )
                tasks.append(task)
            
            batch_results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for recipient, result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    results["failed"] += 1
                    results["details"].append({
                        "email": recipient["email"],
                        "status": "error",
                        "error": str(result)
                    })
                elif result.get("status") == "sent":
                    results["sent"] += 1
                    results["details"].append({
                        "email": recipient["email"],
                        "status": "sent"
                    })
                else:
                    results["failed"] += 1
                    results["details"].append({
                        "email": recipient["email"],
                        "status": result.get("status"),
                        "error": result.get("error")
                    })
            
            if i + batch_size < len(recipients):
                await asyncio.sleep(1)
        
        logger.info(
            f"Batch email completed | "
            f"Total: {results['total']} | "
            f"Sent: {results['sent']} | "
            f"Failed: {results['failed']}"
        )
        
        return results
    
    def get_stats(self) -> Dict[str, Any]:
        
        return {
            **self.stats,
            "queue_size": len(self.email_queue),
            "rate_limit": email_settings.EMAIL_RATE_LIMIT_PER_MINUTE,
            "last_minute": self.last_minute.isoformat()
        }


_email_service_instance = None


def get_email_service() -> EmailService:
    global _email_service_instance
    if _email_service_instance is None:
        _email_service_instance = EmailService()
        logger.info("Email service singleton created")
    return _email_service_instance