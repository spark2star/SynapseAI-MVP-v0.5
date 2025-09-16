"""
Audit logging model for compliance and security monitoring.
Comprehensive audit trail for HIPAA compliance and security analysis.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime
from typing import Dict, Any, Optional

from .base import BaseModel


class AuditEventType(str, Enum):
    """Audit event types for categorization."""
    # User events
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    USER_DELETED = "user_deleted"
    USER_PASSWORD_CHANGED = "user_password_changed"
    USER_MFA_ENABLED = "user_mfa_enabled"
    USER_MFA_DISABLED = "user_mfa_disabled"
    
    # Patient events
    PATIENT_CREATED = "patient_created"
    PATIENT_VIEWED = "patient_viewed"
    PATIENT_UPDATED = "patient_updated"
    PATIENT_DELETED = "patient_deleted"
    PATIENT_SEARCHED = "patient_searched"
    PATIENT_EXPORTED = "patient_exported"
    
    # Session events
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"
    SESSION_PAUSED = "session_paused"
    SESSION_RESUMED = "session_resumed"
    SESSION_RECORDING_STARTED = "session_recording_started"
    SESSION_RECORDING_STOPPED = "session_recording_stopped"
    
    # Transcription events
    TRANSCRIPTION_STARTED = "transcription_started"
    TRANSCRIPTION_COMPLETED = "transcription_completed"
    TRANSCRIPTION_FAILED = "transcription_failed"
    TRANSCRIPTION_CORRECTED = "transcription_corrected"
    
    # Report events
    REPORT_GENERATED = "report_generated"
    REPORT_VIEWED = "report_viewed"
    REPORT_UPDATED = "report_updated"
    REPORT_SIGNED = "report_signed"
    REPORT_EXPORTED = "report_exported"
    REPORT_DELETED = "report_deleted"
    
    # Billing events
    BILL_GENERATED = "bill_generated"
    BILL_UPDATED = "bill_updated"
    BILL_VIEWED = "bill_viewed"
    BILL_PAID = "bill_paid"
    BILL_CANCELLED = "bill_cancelled"
    
    # Appointment events
    APPOINTMENT_CREATED = "appointment_created"
    APPOINTMENT_UPDATED = "appointment_updated"
    APPOINTMENT_CANCELLED = "appointment_cancelled"
    APPOINTMENT_RESCHEDULED = "appointment_rescheduled"
    APPOINTMENT_COMPLETED = "appointment_completed"
    
    # Data events
    DATA_EXPORTED = "data_exported"
    DATA_IMPORTED = "data_imported"
    DATA_BACKUP_CREATED = "data_backup_created"
    DATA_RESTORED = "data_restored"
    
    # Security events
    SECURITY_LOGIN_FAILED = "security_login_failed"
    SECURITY_UNAUTHORIZED_ACCESS = "security_unauthorized_access"
    SECURITY_RATE_LIMIT_EXCEEDED = "security_rate_limit_exceeded"
    SECURITY_SUSPICIOUS_ACTIVITY = "security_suspicious_activity"
    SECURITY_PERMISSION_DENIED = "security_permission_denied"
    SECURITY_TOKEN_EXPIRED = "security_token_expired"
    SECURITY_PASSWORD_RESET_REQUESTED = "security_password_reset_requested"
    SECURITY_PASSWORD_RESET_COMPLETED = "security_password_reset_completed"
    
    # System events
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    SYSTEM_ERROR = "system_error"
    SYSTEM_MAINTENANCE_START = "system_maintenance_start"
    SYSTEM_MAINTENANCE_END = "system_maintenance_end"
    
    # API events
    API_REQUEST = "api_request"
    API_RESPONSE = "api_response"
    API_ERROR = "api_error"
    
    # Configuration events
    CONFIG_CHANGED = "config_changed"
    TEMPLATE_CREATED = "template_created"
    TEMPLATE_UPDATED = "template_updated"
    TEMPLATE_DELETED = "template_deleted"


class AuditSeverity(str, Enum):
    """Audit event severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AuditLog(BaseModel):
    """
    Comprehensive audit log model for compliance and security monitoring.
    Tracks all significant events in the EMR system.
    """
    __tablename__ = "audit_logs"
    
    # Event classification
    event_type = Column(String(50), nullable=False, index=True)
    severity = Column(String(20), nullable=False, default=AuditSeverity.MEDIUM.value)
    category = Column(String(30), nullable=False, index=True)  # user, patient, security, etc.
    
    # Event details
    event_description = Column(Text, nullable=False)
    event_timestamp = Column(String(50), nullable=False, index=True)  # ISO format with timezone
    
    # User and session information
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    session_id = Column(String(200), nullable=True)  # HTTP session or consultation session
    
    # Resource information
    resource_type = Column(String(50), nullable=True, index=True)  # patient, report, etc.
    resource_id = Column(String(36), nullable=True, index=True)
    resource_name = Column(String(200), nullable=True)  # Human-readable resource name
    
    # Request context
    ip_address = Column(String(45), nullable=True, index=True)  # IPv4 or IPv6
    user_agent = Column(Text, nullable=True)
    request_method = Column(String(10), nullable=True)  # GET, POST, etc.
    request_url = Column(Text, nullable=True)
    request_id = Column(String(36), nullable=True)  # Request correlation ID
    
    # Application context
    application_version = Column(String(20), nullable=True)
    environment = Column(String(20), nullable=True)  # development, staging, production
    server_name = Column(String(100), nullable=True)
    
    # Detailed event data
    event_data = Column(JSONB, nullable=True)  # Structured event details
    before_values = Column(JSONB, nullable=True)  # Previous state (for updates)
    after_values = Column(JSONB, nullable=True)  # New state (for updates)
    
    # Success/failure information
    success = Column(String(10), nullable=False, default="true")  # Encrypted boolean
    error_code = Column(String(50), nullable=True)
    error_message = Column(Text, nullable=True)
    
    # Data sensitivity classification
    contains_phi = Column(String(10), nullable=False, default="false")  # Contains PHI data
    data_classification = Column(String(20), nullable=True)  # public, internal, confidential, restricted
    
    # Compliance and retention
    compliance_tags = Column(JSONB, nullable=True)  # HIPAA, GDPR, etc.
    retention_date = Column(String(50), nullable=True)  # When this log can be purged
    
    # Relationships
    user = relationship("User")
    
    # Indexes for performance and compliance queries
    __table_args__ = (
        Index('idx_audit_event_type_timestamp', 'event_type', 'event_timestamp'),
        Index('idx_audit_user_timestamp', 'user_id', 'event_timestamp'),
        Index('idx_audit_resource_timestamp', 'resource_type', 'resource_id', 'event_timestamp'),
        Index('idx_audit_ip_timestamp', 'ip_address', 'event_timestamp'),
        Index('idx_audit_severity_timestamp', 'severity', 'event_timestamp'),
        Index('idx_audit_phi_timestamp', 'contains_phi', 'event_timestamp'),
    )
    
    def __init__(self, **kwargs):
        """Initialize audit log with automatic timestamp if not provided."""
        if 'event_timestamp' not in kwargs:
            kwargs['event_timestamp'] = datetime.utcnow().isoformat()
        
        # Set category based on event type if not provided
        if 'category' not in kwargs and 'event_type' in kwargs:
            kwargs['category'] = self._derive_category(kwargs['event_type'])
        
        super().__init__(**kwargs)
    
    @staticmethod
    def _derive_category(event_type: str) -> str:
        """Derive category from event type."""
        if event_type.startswith('user_'):
            return 'user'
        elif event_type.startswith('patient_'):
            return 'patient'
        elif event_type.startswith('session_'):
            return 'session'
        elif event_type.startswith('transcription_'):
            return 'transcription'
        elif event_type.startswith('report_'):
            return 'report'
        elif event_type.startswith('bill_'):
            return 'billing'
        elif event_type.startswith('appointment_'):
            return 'appointment'
        elif event_type.startswith('security_'):
            return 'security'
        elif event_type.startswith('system_'):
            return 'system'
        elif event_type.startswith('api_'):
            return 'api'
        elif event_type.startswith('data_'):
            return 'data'
        else:
            return 'general'
    
    def __repr__(self):
        return f"<AuditLog(event_type='{self.event_type}', user_id='{self.user_id}', timestamp='{self.event_timestamp}')>"
    
    def get_audit_summary(self) -> Dict[str, Any]:
        """Get audit log summary for API responses."""
        return {
            "id": self.id,
            "event_type": self.event_type,
            "severity": self.severity,
            "category": self.category,
            "event_description": self.event_description,
            "event_timestamp": self.event_timestamp,
            "user_id": self.user_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "ip_address": self.ip_address,
            "success": self.success == "true",
            "contains_phi": self.contains_phi == "true",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def get_full_audit_log(self) -> Dict[str, Any]:
        """Get full audit log data for detailed analysis."""
        return {
            "id": self.id,
            "event_type": self.event_type,
            "severity": self.severity,
            "category": self.category,
            "event_description": self.event_description,
            "event_timestamp": self.event_timestamp,
            "user_id": self.user_id,
            "session_id": self.session_id,
            "resource_type": self.resource_type,
            "resource_id": self.resource_id,
            "resource_name": self.resource_name,
            "ip_address": self.ip_address,
            "user_agent": self.user_agent,
            "request_method": self.request_method,
            "request_url": self.request_url,
            "request_id": self.request_id,
            "application_version": self.application_version,
            "environment": self.environment,
            "server_name": self.server_name,
            "event_data": self.event_data,
            "before_values": self.before_values,
            "after_values": self.after_values,
            "success": self.success == "true",
            "error_code": self.error_code,
            "error_message": self.error_message,
            "contains_phi": self.contains_phi == "true",
            "data_classification": self.data_classification,
            "compliance_tags": self.compliance_tags,
            "retention_date": self.retention_date,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def create_user_event(
        cls,
        event_type: AuditEventType,
        user_id: str,
        description: str,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None,
        success: bool = True
    ) -> "AuditLog":
        """Create a user-related audit event."""
        return cls(
            event_type=event_type.value,
            event_description=description,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            event_data=event_data,
            success=str(success).lower(),
            severity=AuditSeverity.MEDIUM.value
        )
    
    @classmethod
    def create_patient_event(
        cls,
        event_type: AuditEventType,
        user_id: str,
        patient_id: str,
        description: str,
        ip_address: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None,
        before_values: Optional[Dict[str, Any]] = None,
        after_values: Optional[Dict[str, Any]] = None
    ) -> "AuditLog":
        """Create a patient-related audit event."""
        return cls(
            event_type=event_type.value,
            event_description=description,
            user_id=user_id,
            resource_type="patient",
            resource_id=patient_id,
            ip_address=ip_address,
            event_data=event_data,
            before_values=before_values,
            after_values=after_values,
            contains_phi="true",
            data_classification="restricted",
            severity=AuditSeverity.HIGH.value
        )
    
    @classmethod
    def create_security_event(
        cls,
        event_type: AuditEventType,
        description: str,
        ip_address: str,
        user_id: Optional[str] = None,
        user_agent: Optional[str] = None,
        event_data: Optional[Dict[str, Any]] = None,
        severity: AuditSeverity = AuditSeverity.HIGH
    ) -> "AuditLog":
        """Create a security-related audit event."""
        return cls(
            event_type=event_type.value,
            event_description=description,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            event_data=event_data,
            severity=severity.value,
            success="false" if "failed" in event_type.value else "true"
        )
