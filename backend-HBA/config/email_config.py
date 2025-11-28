from pydantic_settings import BaseSettings
from pydantic import Field, validator
from typing import List, Optional
from functools import lru_cache
import os


class EmailSettings(BaseSettings):
    
    SENDGRID_API_KEY: str = Field(..., description="SendGrid API key")
    SENDGRID_FROM_EMAIL: str = Field(..., description="Verified sender email")
    SENDGRID_FROM_NAME: str = Field(default="HBA Booking System", description="Sender name")
    
    ENABLE_EMAIL_NOTIFICATIONS: bool = Field(default=True, description="Enable/disable email notifications")
    EMAIL_TEMPLATE_DIR: str = Field(default="./templates/email", description="Email template directory")
    
    NOTIFY_ON_BOOKING_CREATED: bool = Field(default=True)
    NOTIFY_ON_BOOKING_UPDATED: bool = Field(default=True)
    NOTIFY_ON_BOOKING_DELETED: bool = Field(default=True)
    NOTIFY_ON_SWAP_REQUESTED: bool = Field(default=True)
    NOTIFY_ON_SWAP_APPROVED: bool = Field(default=True)
    NOTIFY_ON_SWAP_REJECTED: bool = Field(default=True)
    
    ADMIN_NOTIFICATION_EMAILS: List[str] = Field(
        default_factory=list,
        description="List of admin emails for critical notifications"
    )
    
    EMAIL_RATE_LIMIT_PER_MINUTE: int = Field(default=60, description="Max emails per minute")
    EMAIL_BATCH_SIZE: int = Field(default=10, description="Batch size for bulk emails")
    
    EMAIL_MAX_RETRIES: int = Field(default=3, description="Max retry attempts for failed emails")
    EMAIL_RETRY_DELAY_SECONDS: int = Field(default=5, description="Delay between retries")
    
    CACHE_TEMPLATES: bool = Field(default=True, description="Cache compiled templates")
    TEMPLATE_CACHE_TTL: int = Field(default=3600, description="Template cache TTL in seconds")
    
    ENVIRONMENT: str = Field(default="development", description="Application environment")
    
    @validator("SENDGRID_FROM_EMAIL")
    def validate_email(cls, v):
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, v):
            raise ValueError(f"Invalid email format: {v}")
        return v
    
    @validator("ADMIN_NOTIFICATION_EMAILS", pre=True)
    def parse_admin_emails(cls, v):
        if isinstance(v, str):
            if v.startswith('[') and v.endswith(']'):
                import json
                try:
                    return json.loads(v)
                except json.JSONDecodeError:
                    v = v.strip('[]').replace('"', '').replace("'", "")
                    return [email.strip() for email in v.split(",") if email.strip()]
            return [email.strip() for email in v.split(",") if email.strip()]
        return v if v else []
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"


@lru_cache()
def get_email_settings() -> EmailSettings:
    return EmailSettings()


class EmailTemplateType:
    BOOKING_CREATED = "booking_created"
    BOOKING_UPDATED = "booking_updated"
    BOOKING_DELETED = "booking_deleted"
    BOOKING_REMINDER = "booking_reminder"
    RECURRING_BOOKING_CREATED = "recurring_booking_created"
    SWAP_REQUESTED = "swap_requested"
    SWAP_APPROVED = "swap_approved"
    SWAP_REJECTED = "swap_rejected"
    SWAP_CANCELLED = "swap_cancelled"
    SYSTEM_ERROR = "system_error"


class EmailPriority:
    """Email priority constants"""
    HIGH = "high"
    NORMAL = "normal"
    LOW = "low"


email_settings = get_email_settings()