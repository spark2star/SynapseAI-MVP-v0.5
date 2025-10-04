"""
Audit Log model for compliance and security tracking.
Records all critical system events for doctor registration and verification.
"""

from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime, timezone

from .base import BaseModel


class AuditEventType(str, Enum):
    """Types of auditable events in the system."""
    DOCTOR_APPLIED = "doctor_applied"
    DOCTOR_APPROVED = "doctor_approved"
    DOCTOR_REJECTED = "doctor_rejected"
    PROFILE_UPDATED = "profile_updated"
    PROFILE_COMPLETED = "profile_completed"
    PASSWORD_CHANGED = "password_changed"
    MFA_ENABLED = "mfa_enabled"
    MFA_DISABLED = "mfa_disabled"
    LOGIN_SUCCESS = "login_success"
    LOGIN_FAILED = "login_failed"
    ACCOUNT_LOCKED = "account_locked"
    ACCOUNT_UNLOCKED = "account_unlocked"


class AuditLog(BaseModel):
    """
    Audit log model for tracking all critical system events.
    Provides complete audit trail for compliance and security monitoring.
    """
    __tablename__ = "doctor_audit_logs"
    
    # Event information
    event_type = Column(String(50), nullable=False, index=True)
    
    # User references
    admin_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    doctor_user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Request metadata
    ip_address = Column(String(45), nullable=True)  # IPv6 max length
    user_agent = Column(String(500), nullable=True)
    
    # Event details (flexible JSONB for different event types)
    details = Column(JSONB, nullable=True)
    
    # Timestamp
    timestamp = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True)
    
    # Relationships
    admin_user = relationship("User", foreign_keys=[admin_user_id])
    doctor_user = relationship("User", foreign_keys=[doctor_user_id])
    
    def __repr__(self):
        return f"<AuditLog(event_type='{self.event_type}', timestamp='{self.timestamp}')>"
    
    @classmethod
    def log_event(
        cls,
        db_session,
        event_type: AuditEventType,
        admin_user_id: str = None,
        doctor_user_id: str = None,
        ip_address: str = None,
        user_agent: str = None,
        details: dict = None
    ):
        """
        Convenience method to create an audit log entry.
        
        Args:
            db_session: SQLAlchemy database session
            event_type: Type of event being logged
            admin_user_id: ID of admin user (if applicable)
            doctor_user_id: ID of doctor user (if applicable)
            ip_address: IP address of request
            user_agent: User agent string
            details: Additional event details as dictionary
        
        Returns:
            AuditLog: Created audit log entry
        """
        audit_log = cls(
            event_type=event_type.value if isinstance(event_type, AuditEventType) else event_type,
            admin_user_id=admin_user_id,
            doctor_user_id=doctor_user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=details or {}
        )
        
        db_session.add(audit_log)
        return audit_log
