"""
Audit logging system for compliance and security monitoring.
Implements comprehensive audit trails for HIPAA compliance.
"""

from fastapi import Request, Response
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional, Dict, Any
import json
import logging
import asyncio
from enum import Enum

from .config import settings
from .database import get_db

logger = logging.getLogger(__name__)


class AuditEventType(str, Enum):
    """Audit event types for categorization."""
    USER_LOGIN = "user_login"
    USER_LOGOUT = "user_logout"
    USER_CREATED = "user_created"
    USER_UPDATED = "user_updated"
    CONSULTATION_STARTED = "consultation_started"
    CONSULTATION_ENDED = "consultation_ended"
    USER_DELETED = "user_deleted"
    
    PATIENT_CREATED = "patient_created"
    PATIENT_VIEWED = "patient_viewed"
    PATIENT_UPDATED = "patient_updated"
    PATIENT_DELETED = "patient_deleted"
    PATIENT_SEARCHED = "patient_searched"
    
    SESSION_STARTED = "session_started"
    SESSION_ENDED = "session_ended"
    SESSION_PAUSED = "session_paused"
    SESSION_RESUMED = "session_resumed"
    
    REPORT_GENERATED = "report_generated"
    REPORT_VIEWED = "report_viewed"
    REPORT_EXPORTED = "report_exported"
    REPORT_DELETED = "report_deleted"
    
    BILL_GENERATED = "bill_generated"
    BILL_UPDATED = "bill_updated"
    BILL_VIEWED = "bill_viewed"
    
    APPOINTMENT_CREATED = "appointment_created"
    APPOINTMENT_UPDATED = "appointment_updated"
    APPOINTMENT_DELETED = "appointment_deleted"
    
    DATA_EXPORTED = "data_exported"
    DATA_IMPORTED = "data_imported"
    
    SECURITY_LOGIN_FAILED = "security_login_failed"
    SECURITY_UNAUTHORIZED_ACCESS = "security_unauthorized_access"
    SECURITY_RATE_LIMIT_EXCEEDED = "security_rate_limit_exceeded"
    SECURITY_SUSPICIOUS_ACTIVITY = "security_suspicious_activity"
    
    SYSTEM_STARTUP = "system_startup"
    SYSTEM_SHUTDOWN = "system_shutdown"
    SYSTEM_ERROR = "system_error"


class AuditLogger:
    """
    Comprehensive audit logging system.
    Logs all significant events for compliance and security monitoring.
    """
    
    def __init__(self):
        self.enabled = settings.ENABLE_AUDIT_LOGGING
        self.logger = logging.getLogger("audit")
        
        # Configure audit logger with separate handler
        if self.enabled:
            audit_handler = logging.StreamHandler()
            audit_formatter = logging.Formatter(
                '%(asctime)s - AUDIT - %(levelname)s - %(message)s'
            )
            audit_handler.setFormatter(audit_formatter)
            self.logger.addHandler(audit_handler)
            self.logger.setLevel(logging.INFO)
    
    async def log_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str] = None,
        resource_type: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        session_id: Optional[str] = None
    ):
        """Log an audit event."""
        if not self.enabled:
            return
        
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type.value,
            "user_id": user_id,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "session_id": session_id,
            "details": details or {},
            "environment": settings.ENVIRONMENT
        }
        
        # Log to structured logging
        self.logger.info(json.dumps(audit_entry))
        
        # Store in database for long-term retention
        try:
            await self._store_audit_event(audit_entry)
        except Exception as e:
            logger.error(f"Failed to store audit event: {str(e)}")
    
    async def log_request(self, request: Request):
        """Log incoming HTTP request."""
        if not self.enabled:
            return
        
        # Extract request information
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        method = request.method
        url = str(request.url)
        
        # Don't log sensitive endpoints in detail
        sensitive_endpoints = ["/auth/login", "/auth/register"]
        is_sensitive = any(endpoint in url for endpoint in sensitive_endpoints)
        
        details = {
            "method": method,
            "url": url if not is_sensitive else url.split("?")[0],  # Remove query params for sensitive endpoints
            "headers": {
                k: v for k, v in request.headers.items()
                if k.lower() not in ["authorization", "cookie", "x-api-key"]
            }
        }
        
        await self.log_event(
            event_type=AuditEventType.SYSTEM_STARTUP,  # Generic for requests
            ip_address=client_ip,
            user_agent=user_agent,
            details=details
        )
    
    async def log_response(self, request: Request, response: Response, process_time: float):
        """Log HTTP response."""
        if not self.enabled:
            return
        
        client_ip = self._get_client_ip(request)
        
        details = {
            "status_code": response.status_code,
            "process_time": process_time,
            "response_size": response.headers.get("content-length", "unknown")
        }
        
        # Log as error if status code indicates a problem
        if response.status_code >= 400:
            await self.log_security_event(
                event_type="http_error",
                request=request,
                details=details
            )
    
    async def log_authentication_event(
        self,
        event_type: AuditEventType,
        user_id: Optional[str],
        success: bool,
        ip_address: str,
        user_agent: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log authentication-related events."""
        event_details = {
            "success": success,
            "authentication_method": "jwt",
            **(details or {})
        }
        
        await self.log_event(
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            details=event_details
        )
    
    async def log_data_access(
        self,
        user_id: str,
        resource_type: str,
        resource_id: str,
        action: str,
        ip_address: str,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log data access events for compliance."""
        event_details = {
            "action": action,
            "data_classification": "PHI",  # All EMR data is PHI
            **(details or {})
        }
        
        # Map action to event type
        action_mapping = {
            "create": AuditEventType.PATIENT_CREATED,
            "read": AuditEventType.PATIENT_VIEWED,
            "update": AuditEventType.PATIENT_UPDATED,
            "delete": AuditEventType.PATIENT_DELETED
        }
        
        # Default to viewed if action not mapped
        event_type = action_mapping.get(action, AuditEventType.PATIENT_VIEWED)
        
        await self.log_event(
            event_type=event_type,
            user_id=user_id,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            details=event_details
        )
    
    async def log_security_event(
        self,
        event_type: str,
        request: Request,
        details: Optional[Dict[str, Any]] = None
    ):
        """Log security-related events."""
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        security_details = {
            "event_category": "security",
            "severity": "high" if "unauthorized" in event_type.lower() else "medium",
            "url": str(request.url),
            "method": request.method,
            **(details or {})
        }
        
        await self.log_event(
            event_type=AuditEventType.SECURITY_SUSPICIOUS_ACTIVITY,
            ip_address=client_ip,
            user_agent=user_agent,
            details=security_details
        )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP from request, considering proxies."""
        # Check for forwarded headers (common in production with load balancers)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # Take the first IP in the chain (original client)
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fallback to direct connection IP
        return request.client.host if request.client else "unknown"
    
    async def _store_audit_event(self, audit_entry: Dict[str, Any]):
        """Store audit event in database for long-term retention."""
        try:
            # This would normally store in the audit_logs table
            # For now, we'll just ensure the structure is logged
            pass
        except Exception as e:
            logger.error(f"Failed to store audit event in database: {str(e)}")


# Global audit logger instance
audit_logger = AuditLogger()


# Convenience functions for common audit events
async def log_user_action(
    action: str,
    user_id: str,
    resource_type: str,
    resource_id: str,
    request: Request,
    details: Optional[Dict[str, Any]] = None
):
    """Log user action with request context."""
    client_ip = audit_logger._get_client_ip(request)
    
    await audit_logger.log_data_access(
        user_id=user_id,
        resource_type=resource_type,
        resource_id=resource_id,
        action=action,
        ip_address=client_ip,
        details=details
    )


async def log_patient_access(
    user_id: str,
    patient_id: str,
    action: str,
    request: Request,
    details: Optional[Dict[str, Any]] = None
):
    """Log patient data access."""
    await log_user_action(
        action=action,
        user_id=user_id,
        resource_type="patient",
        resource_id=patient_id,
        request=request,
        details=details
    )
