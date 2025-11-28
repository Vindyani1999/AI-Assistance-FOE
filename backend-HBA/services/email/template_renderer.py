from typing import Dict, Any, Optional
from pathlib import Path
import subprocess
import json
import hashlib
from jinja2 import Environment, FileSystemLoader
from cachetools import TTLCache

from config.email_config import get_email_settings, EmailTemplateType
from utils.logger import get_logger

logger = get_logger(__name__)
email_settings = get_email_settings()


class TemplateRenderer:
    def __init__(self):
        self.template_dir = Path(email_settings.EMAIL_TEMPLATE_DIR)
        self.template_dir.mkdir(parents=True, exist_ok=True)
        
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.template_dir)),
            autoescape=True,
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        self.cache = TTLCache(
            maxsize=100,
            ttl=email_settings.TEMPLATE_CACHE_TTL
        ) if email_settings.CACHE_TEMPLATES else None
        
        self.mjml_available = self._check_mjml_installed()
        
        self.subject_templates = {
            EmailTemplateType.BOOKING_CREATED: "Booking Confirmation - {room_name} on {date}",
            EmailTemplateType.BOOKING_UPDATED: "Booking Updated - {room_name} on {date}",
            EmailTemplateType.BOOKING_DELETED: "Booking Cancelled - {room_name} on {date}",
            EmailTemplateType.BOOKING_REMINDER: "Reminder: Upcoming Booking - {room_name}",
            EmailTemplateType.RECURRING_BOOKING_CREATED: "Recurring Booking Confirmed - {room_name} ({total_bookings} bookings)", 
            EmailTemplateType.SWAP_REQUESTED: "Swap Request Received - {room_name}",
            EmailTemplateType.SWAP_APPROVED: "Swap Request Approved - {room_name}",
            EmailTemplateType.SWAP_REJECTED: "Swap Request Rejected - {room_name}",
            EmailTemplateType.SWAP_CANCELLED: "Swap Request Cancelled",
            EmailTemplateType.SYSTEM_ERROR: "[{environment}] System Alert: {subject}"
        }
        
        logger.info(
            f"Template renderer initialized | "
            f"Dir: {self.template_dir} | "
            f"Cache: {email_settings.CACHE_TEMPLATES} | "
            f"MJML: {self.mjml_available}"
        )
    
    def _check_mjml_installed(self) -> bool:
        try:
            result = subprocess.run(
                ['mjml', '--version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            if result.returncode == 0:
                logger.info(f"MJML installed: {result.stdout.strip()}")
                return True
        except (FileNotFoundError, subprocess.TimeoutExpired):
            logger.warning("MJML not installed - using fallback HTML templates")
        except Exception as e:
            logger.error(f"Error checking MJML: {e}")
        
        return False
    
    def _make_cache_key(self, template_type: str, context: Dict[str, Any]) -> str:
        
        try:
            context_str = json.dumps(context, sort_keys=True, default=str)
            context_hash = hashlib.md5(context_str.encode()).hexdigest()
            return f"{template_type}:{context_hash}"
        except Exception as e:
            logger.warning(f"Failed to create cache key: {e}")
            return template_type
    
    def _compile_mjml(self, mjml_content: str) -> str:
        if not self.mjml_available:
            logger.warning("MJML not available, using fallback")
            return self._mjml_fallback_html(mjml_content)
        
        try:
            process = subprocess.Popen(
                ['mjml', '-s', '-i'],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
            
            stdout, stderr = process.communicate(input=mjml_content, timeout=30)
            
            if process.returncode != 0:
                logger.error(f"MJML compilation error: {stderr}")
                return self._mjml_fallback_html(mjml_content)
            
            return stdout
            
        except Exception as e:
            logger.error(f"MJML compilation failed: {e}")
            return self._mjml_fallback_html(mjml_content)
    
    def _mjml_fallback_html(self, mjml_content: str) -> str:
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background: white; }}
            </style>
        </head>
        <body>
            <div class="content">{mjml_content}</div>
        </body>
        </html>
        """
    
    def _render_jinja_template(self, template_name: str, context: Dict[str, Any]) -> str:
        try:
            template = self.jinja_env.get_template(template_name)
            return template.render(**context)
        except Exception as e:
            logger.error(f"Jinja2 error for {template_name}: {e}")
            raise
    
    def render_template(
        self,
        template_type: str,
        context: Dict[str, Any]
    ) -> Dict[str, str]:
        
        cache_key = self._make_cache_key(template_type, context)
        
        if self.cache and cache_key in self.cache:
            logger.debug(f"Using cached template: {template_type}")
            return self.cache[cache_key]
        
        try:
            subject_template = self.subject_templates.get(
                template_type,
                "HBA Notification"
            )
            
            try:
                subject = subject_template.format(**context)
            except KeyError as e:
                logger.warning(f"Missing context key for subject: {e}")
                subject = "HBA Booking System Notification"
            
            template_file = f"{template_type}.mjml"
            template_path = self.template_dir / template_file
            
            if not template_path.exists():
                logger.warning(f"Template not found: {template_path}")
                return self._render_fallback_template(template_type, context)
            
            mjml_content = self._render_jinja_template(template_file, context)
            
            try:
                html_content = self._compile_mjml(mjml_content)
            except Exception as mjml_error:
                logger.error(f"MJML compilation failed: {mjml_error}")
                return self._render_fallback_template(template_type, context)
            
            text_content = self._generate_text_version(context, template_type)
            
            result = {
                "subject": subject,
                "html": html_content,
                "text": text_content
            }
            
            if self.cache:
                self.cache[cache_key] = result
            
            logger.debug(f"Template rendered: {template_type}")
            return result
            
        except Exception as e:
            logger.error(f"Template rendering failed for {template_type}: {e}", exc_info=True)
            return self._render_fallback_template(template_type, context)
    
    
    def _generate_text_version(self, context: Dict[str, Any], template_type: str) -> str:
        text_templates = {
            EmailTemplateType.BOOKING_CREATED: """
Booking Confirmation

Your booking has been confirmed:
- Room: {room_name}
- Date: {date}
- Time: {start_time} - {end_time}
- Module: {module_code}

Booking ID: {booking_id}

Thank you for using HBA Booking System.
            """,
            
            EmailTemplateType.RECURRING_BOOKING_CREATED: """
Recurring Booking Confirmation

Your recurring booking series has been confirmed!

BOOKING DETAILS:
- Room: {room_name}
- Module Code: {module_code}
- Time: {start_time} - {end_time}
- Duration: {duration} per session
- Recurrence: {recurrence_pattern}
- Period: {start_date} to {end_date}

SUMMARY:
- Total Bookings Created: {total_bookings}
- Total Duration: {total_duration_hours} hours{skipped_info}

SCHEDULED DATES:
{booking_dates_text}

IMPORTANT REMINDERS:
• Arrive at least 5 minutes before each scheduled session
• Each booking can be modified or cancelled individually
• You will receive reminder notifications before each session
• Changes to one booking do not affect others in the series

Need to make changes? Visit: {booking_url}

Thank you for using HBA Booking System.
        """,
        
            EmailTemplateType.BOOKING_UPDATED: """
Booking Updated

Your booking has been updated:
- Room: {room_name}
- Date: {date}
- Time: {start_time} - {end_time}

Booking ID: {booking_id}
            """,
            EmailTemplateType.BOOKING_DELETED: """
Booking Cancelled

Your booking has been cancelled:
- Room: {room_name}
- Date: {date}
- Time: {start_time} - {end_time}

Booking ID: {booking_id}
            """
        }
        
        template = text_templates.get(template_type, "")
        try:
            if template_type == EmailTemplateType.RECURRING_BOOKING_CREATED:
                booking_dates_html = context.get('booking_dates', '')
                if isinstance(booking_dates_html, str):
                    booking_dates_text = (booking_dates_html
                        .replace('<br/>', '\n')
                        .replace('<em>', '')
                        .replace('</em>', '')
                        .replace('&bull;', '•')
                    )
                else:
                    booking_dates_text = "See email for full list"
                        
                skipped_count = context.get('skipped_count', 0)
                skipped_info = f"\n- Skipped (Past Dates): {skipped_count}" if skipped_count > 0 else ""
                        
                format_context = {
                    **context,
                    'booking_dates_text': booking_dates_text,
                    'skipped_info': skipped_info
                }
                
                return template.format(**format_context).strip()
                    
            else:
                return template.format(**context).strip()
                        
        except KeyError as e:
            logger.warning(f"Missing key in text template for {template_type}: {e}")
                    
            if template_type == EmailTemplateType.RECURRING_BOOKING_CREATED:
                return f"""
            Recurring Booking Confirmation

            Your recurring booking series has been confirmed!

            Room: {context.get('room_name', 'N/A')}
            Module: {context.get('module_code', 'N/A')}
            Time: {context.get('start_time', 'N/A')} - {context.get('end_time', 'N/A')}
            Total Bookings: {context.get('total_bookings', 'N/A')}
            Period: {context.get('start_date', 'N/A')} to {context.get('end_date', 'N/A')}

            Thank you for using HBA Booking System.
                        """.strip()
                    
                    
        return f"HBA Booking System Notification\n\nDetails: {context.get('booking_id', 'N/A')}"
                         
    def _render_fallback_template(self, template_type: str, context: Dict[str, Any]) -> Dict[str, str]:
        
        
        try:
            subject = self.subject_templates.get(template_type, "HBA Notification").format(**context)
        except:
            subject = "HBA Booking System Notification"
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{ font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f5f5f5; }}
                .header {{ background: #4CAF50; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background: white; padding: 30px; border: 1px solid #ddd; }}
                .detail-row {{ padding: 10px 0; border-bottom: 1px solid #eee; }}
                .detail-label {{ font-weight: bold; width: 150px; display: inline-block; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0; }}
                .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="header"><h2>{subject}</h2></div>
            <div class="content">
                <p>Hi {context.get('user_name', 'there')},</p>
                <div class="detail-row">
                    <span class="detail-label">Booking ID:</span>
                    <span>#{context.get('booking_id', 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Room:</span>
                    <span>{context.get('room_name', 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Module:</span>
                    <span>{context.get('module_code', 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Date:</span>
                    <span>{context.get('date', 'N/A')}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Time:</span>
                    <span>{context.get('start_time', '')} - {context.get('end_time', '')}</span>
                </div>
                <p style="margin-top: 20px;">{context.get('confirmation_message', 'Your booking has been processed.')}</p>
                <a href="{context.get('booking_url', '#')}" class="button">View Details</a>
            </div>
            <div class="footer">
                <p>This is an automated notification from HBA Booking System.</p>
                <p>© {context.get('current_year', '2024')} All rights reserved.</p>
            </div>
        </body>
        </html>
        """
        
        return {
            "subject": subject,
            "html": html,
            "text": self._generate_text_version(context, template_type)
        }


_template_renderer_instance = None

def get_template_renderer() -> TemplateRenderer:
    global _template_renderer_instance
    if _template_renderer_instance is None:
        _template_renderer_instance = TemplateRenderer()
    return _template_renderer_instance