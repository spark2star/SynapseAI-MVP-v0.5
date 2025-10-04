"""
Email Queue model for asynchronous email processing.
Stores email jobs for background processing with retry logic.
"""

from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime, timezone

from .base import BaseModel


class EmailStatus(str, Enum):
    """Email processing status."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"


class EmailTemplate(str, Enum):
    """Available email templates."""
    APPLICATION_RECEIVED = "application_received"
    APPROVAL = "approval"
    REJECTION = "rejection"
    TEMP_PASSWORD = "temp_password"
    PASSWORD_RESET = "password_reset"
    EMAIL_VERIFICATION = "email_verification"
    WELCOME = "welcome"


class EmailQueue(BaseModel):
    """
    Email queue model for managing outbound emails.
    Supports async processing with retry logic and error tracking.
    """
    __tablename__ = "email_queue"
    
    # Recipient information
    recipient_email = Column(String(255), nullable=False)
    
    # Template information
    template_name = Column(String(100), nullable=False)
    template_data = Column(JSONB, nullable=True)  # Template variables
    
    # Processing status
    status = Column(String(20), nullable=False, default=EmailStatus.PENDING.value, index=True)
    sent_at = Column(DateTime(timezone=True), nullable=True)
    error_message = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<EmailQueue(recipient='{self.recipient_email}', template='{self.template_name}', status='{self.status}')>"
    
    def mark_as_sent(self):
        """Mark email as successfully sent."""
        self.status = EmailStatus.SENT.value
        self.sent_at = datetime.now(timezone.utc)
        self.error_message = None
    
    def mark_as_failed(self, error_message: str):
        """Mark email as failed with error message."""
        self.status = EmailStatus.FAILED.value
        self.error_message = error_message
    
    @property
    def is_pending(self) -> bool:
        """Check if email is pending."""
        return self.status == EmailStatus.PENDING.value
    
    @property
    def is_sent(self) -> bool:
        """Check if email was sent."""
        return self.status == EmailStatus.SENT.value
    
    @property
    def is_failed(self) -> bool:
        """Check if email failed."""
        return self.status == EmailStatus.FAILED.value

