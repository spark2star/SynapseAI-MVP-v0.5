"""
Custom exceptions and exception handlers for SynapseAI.
Implements comprehensive error handling with proper HTTP status codes.
"""

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from typing import Any, Dict, Optional
import logging

logger = logging.getLogger(__name__)


# Base Exceptions
class SynapseAIException(Exception):
    """Base exception for SynapseAI application."""
    
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or "INTERNAL_ERROR"
        self.details = details or {}
        super().__init__(self.message)


# Resource Not Found Exceptions
class ResourceNotFoundException(SynapseAIException):
    """Base exception for resource not found errors."""
    
    def __init__(self, resource_type: str, identifier: str, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} with identifier '{identifier}' not found"
        super().__init__(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="RESOURCE_NOT_FOUND",
            details={"resource_type": resource_type, "identifier": identifier, **(details or {})}
        )


class PatientNotFoundException(ResourceNotFoundException):
    """Exception raised when patient is not found."""
    
    def __init__(self, patient_id: str):
        super().__init__("Patient", patient_id)


class SessionNotFoundException(ResourceNotFoundException):
    """Exception raised when consultation session is not found."""
    
    def __init__(self, session_id: str):
        super().__init__("Consultation Session", session_id)


class ReportNotFoundException(ResourceNotFoundException):
    """Exception raised when report is not found."""
    
    def __init__(self, report_id: str):
        super().__init__("Report", report_id)


class AppointmentNotFoundException(ResourceNotFoundException):
    """Exception raised when appointment is not found."""
    
    def __init__(self, appointment_id: str):
        super().__init__("Appointment", appointment_id)


class BillNotFoundException(ResourceNotFoundException):
    """Exception raised when bill is not found."""
    
    def __init__(self, bill_id: str):
        super().__init__("Bill", bill_id)


class TranscriptionNotFoundException(ResourceNotFoundException):
    """Exception raised when transcription is not found."""
    
    def __init__(self, transcription_id: str):
        super().__init__("Transcription", transcription_id)


class TemplateNotFoundException(ResourceNotFoundException):
    """Exception raised when report template is not found."""
    
    def __init__(self, template_id: str):
        super().__init__("Report Template", template_id)


class UserNotFoundException(ResourceNotFoundException):
    """Exception raised when user is not found."""
    
    def __init__(self, user_id: str):
        super().__init__("User", user_id)


# Duplicate Resource Exceptions
class DuplicateResourceException(SynapseAIException):
    """Exception raised when trying to create a duplicate resource."""
    
    def __init__(self, resource_type: str, identifier: str, details: Optional[Dict[str, Any]] = None):
        message = f"{resource_type} with identifier '{identifier}' already exists"
        super().__init__(
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            error_code="DUPLICATE_RESOURCE",
            details={"resource_type": resource_type, "identifier": identifier, **(details or {})}
        )


# Authorization Exceptions
class UnauthorizedException(SynapseAIException):
    """Exception raised when user is not authenticated."""
    
    def __init__(self, message: str = "Authentication required"):
        super().__init__(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED"
        )


class ForbiddenException(SynapseAIException):
    """Exception raised when user doesn't have permission."""
    
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN"
        )


# Validation Exceptions
class ValidationException(SynapseAIException):
    """Exception raised for validation errors."""
    
    def __init__(self, message: str, field: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details={"field": field, **(details or {})}
        )


# Business Logic Exceptions
class BusinessLogicException(SynapseAIException):
    """Exception raised for business logic errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            error_code="BUSINESS_LOGIC_ERROR",
            details=details
        )


class SessionAlreadyActiveException(BusinessLogicException):
    """Exception raised when trying to start a session while one is active."""
    
    def __init__(self, patient_id: str):
        super().__init__(
            f"An active session already exists for patient {patient_id}",
            details={"patient_id": patient_id}
        )


class SessionNotActiveException(BusinessLogicException):
    """Exception raised when trying to perform action on inactive session."""
    
    def __init__(self, session_id: str):
        super().__init__(
            f"Session {session_id} is not active",
            details={"session_id": session_id}
        )


class ReportNotSignedException(BusinessLogicException):
    """Exception raised when trying to export unsigned report."""
    
    def __init__(self, report_id: str):
        super().__init__(
            f"Report {report_id} must be signed before export",
            details={"report_id": report_id}
        )


class BillAlreadyPaidException(BusinessLogicException):
    """Exception raised when trying to modify a paid bill."""
    
    def __init__(self, bill_number: str):
        super().__init__(
            f"Bill {bill_number} is already fully paid and cannot be modified",
            details={"bill_number": bill_number}
        )


# Service Exceptions
class ServiceException(SynapseAIException):
    """Exception raised for external service errors."""
    
    def __init__(self, service_name: str, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=f"{service_name} error: {message}",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            error_code="SERVICE_ERROR",
            details={"service": service_name, **(details or {})}
        )


class STTServiceException(ServiceException):
    """Exception raised for Speech-to-Text service errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("Speech-to-Text", message, details)


class AIServiceException(ServiceException):
    """Exception raised for AI service errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("AI Report Generation", message, details)


class StorageServiceException(ServiceException):
    """Exception raised for cloud storage errors."""
    
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__("Cloud Storage", message, details)


# Exception Handlers
async def synapseai_exception_handler(request: Request, exc: SynapseAIException) -> JSONResponse:
    """Handle SynapseAI custom exceptions."""
    logger.error(
        f"SynapseAI Exception: {exc.error_code} - {exc.message}",
        extra={
            "status_code": exc.status_code,
            "error_code": exc.error_code,
            "details": exc.details,
            "path": request.url.path
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.error_code,
                "message": exc.message,
                "details": exc.details
            },
            "metadata": {
                "timestamp": "utcnow",
                "path": request.url.path
            }
        }
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(
        f"Validation error on {request.url.path}",
        extra={"errors": exc.errors()}
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {"validation_errors": exc.errors()}
            },
            "metadata": {
                "timestamp": "utcnow",
                "path": request.url.path
            }
        }
    )


async def integrity_error_handler(request: Request, exc: IntegrityError) -> JSONResponse:
    """Handle database integrity constraint violations."""
    logger.error(
        f"Database integrity error on {request.url.path}",
        extra={"error": str(exc.orig)}
    )
    
    # Parse error message to provide better feedback
    error_message = "Database constraint violation"
    if "duplicate key" in str(exc.orig).lower():
        error_message = "A resource with this identifier already exists"
    elif "foreign key" in str(exc.orig).lower():
        error_message = "Referenced resource does not exist"
    elif "not null" in str(exc.orig).lower():
        error_message = "Required field is missing"
    
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "success": False,
            "error": {
                "code": "INTEGRITY_ERROR",
                "message": error_message,
                "details": {}
            },
            "metadata": {
                "timestamp": "utcnow",
                "path": request.url.path
            }
        }
    )


async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle general SQLAlchemy database errors."""
    logger.error(
        f"Database error on {request.url.path}",
        exc_info=True
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "error": {
                "code": "DATABASE_ERROR",
                "message": "A database error occurred",
                "details": {}
            },
            "metadata": {
                "timestamp": "utcnow",
                "path": request.url.path
            }
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTP exceptions."""
    logger.warning(
        f"HTTP {exc.status_code} on {request.url.path}: {exc.detail}"
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "details": {}
            },
            "metadata": {
                "timestamp": "utcnow",
                "path": request.url.path
            }
        },
        headers=exc.headers
    )


def register_exception_handlers(app):
    """Register all exception handlers with the FastAPI app."""
    app.add_exception_handler(SynapseAIException, synapseai_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(IntegrityError, integrity_error_handler)
    app.add_exception_handler(SQLAlchemyError, sqlalchemy_error_handler)
    app.add_exception_handler(HTTPException, http_exception_handler)
