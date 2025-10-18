"""
Staff Invitation Model
Manages secure invitation tokens for receptionist onboarding.
"""

from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta, timezone
import secrets

from .base import BaseModel


class StaffInvitation(BaseModel):
    """
    Staff invitation model for secure receptionist onboarding.
    Tokens are single-use and expire after 7 days.
    """
    __tablename__ = "staff_invitations"
    
    # Inviter (doctor who sent the invitation)
    inviter_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    
    # Recipient information
    recipient_email = Column(String(255), nullable=False, index=True)
    
    # Secure token for invitation link
    token = Column(String(255), unique=True, nullable=False, index=True)
    
    # Expiration timestamp
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    # Relationships
    inviter = relationship("User", foreign_keys=[inviter_id])
    
    def __init__(self, **kwargs):
        """Initialize invitation with auto-generated token and expiration."""
        if 'token' not in kwargs:
            kwargs['token'] = self.generate_token()
        if 'expires_at' not in kwargs:
            kwargs['expires_at'] = datetime.now(timezone.utc) + timedelta(days=7)
        super().__init__(**kwargs)
    
    @staticmethod
    def generate_token() -> str:
        """Generate a secure random token for invitation."""
        return secrets.token_urlsafe(32)
    
    def is_expired(self) -> bool:
        """Check if invitation token has expired."""
        return datetime.now(timezone.utc) > self.expires_at
    
    def __repr__(self):
        return f"<StaffInvitation(id='{self.id}', recipient='{self.recipient_email}', expired={self.is_expired()})>"
