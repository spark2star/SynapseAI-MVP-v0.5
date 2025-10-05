"""
Global error handlers for FastAPI application.

Provides consistent, user-friendly error responses across all endpoints.
Handles validation errors, database errors, and unexpected exceptions.
"""
from fastapi import Request, status, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import IntegrityError, DatabaseError
import logging

logger = logging.getLogger(__name__)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Handle Pydantic validation errors with user-friendly messages.
    
    Converts technical validation errors into readable messages for the user.
    
    Args:
        request: FastAPI request object
        exc: Validation error exception
        
    Returns:
        JSONResponse with formatted error details
    """
    errors = []
    for error in exc.errors():
        field = ".".join(str(x) for x in error["loc"] if x != "body")
        message = error["msg"]
        
        # Make error messages more user-friendly
        if "field required" in message.lower():
            message = f"{field} is required"
        elif "ensure this value" in message.lower():
            message = f"{field} has invalid value"
        elif "value is not a valid" in message.lower():
            message = f"{field} must be a valid {error.get('type', 'value')}"
        
        errors.append({
            "field": field,
            "message": message,
            "type": error["type"]
        })
    
    request_id = getattr(request.state, 'request_id', None)
    
    logger.warning(
        f"Validation error on {request.url.path}",
        extra={
            "request_id": request_id,
            "errors": errors,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "status": "error",
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Please check your input and try again",
                "fields": errors,
                "request_id": request_id
            }
        }
    )


async def database_exception_handler(request: Request, exc: Exception):
    """
    Handle database errors with user-friendly messages.
    
    Handles integrity errors (duplicate entries) and general database errors.
    
    Args:
        request: FastAPI request object
        exc: Database exception
        
    Returns:
        JSONResponse with formatted error
    """
    request_id = getattr(request.state, 'request_id', None)
    
    if isinstance(exc, IntegrityError):
        # Duplicate key or constraint violation
        logger.warning(
            "Database integrity error",
            extra={
                "request_id": request_id,
                "error": str(exc),
                "url": request.url.path
            }
        )
        
        error_message = "This record already exists or violates data constraints"
        
        # Provide more specific messages based on the constraint
        error_str = str(exc).lower()
        if "duplicate key" in error_str or "unique constraint" in error_str:
            if "email" in error_str:
                error_message = "An account with this email already exists"
            elif "phone" in error_str:
                error_message = "A patient with this phone number already exists"
            elif "session_id" in error_str:
                error_message = "A consultation with this ID already exists"
            else:
                error_message = "This record already exists"
        elif "foreign key" in error_str:
            error_message = "Referenced record does not exist"
        elif "not null" in error_str:
            error_message = "Required field is missing"
        
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "status": "error",
                "error": {
                    "code": "DUPLICATE_ENTRY",
                    "message": error_message,
                    "request_id": request_id
                }
            }
        )
    
    elif isinstance(exc, DatabaseError):
        # General database error
        logger.error(
            "Database error",
            exc_info=True,
            extra={
                "request_id": request_id,
                "url": request.url.path
            }
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status": "error",
                "error": {
                    "code": "DATABASE_ERROR",
                    "message": "A database error occurred. Please try again.",
                    "request_id": request_id
                }
            }
        )
    
    # Unknown database-related error
    logger.error(
        "Unknown database exception",
        exc_info=True,
        extra={
            "request_id": request_id,
            "exception_type": type(exc).__name__
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error": {
                "code": "DATABASE_ERROR",
                "message": "An unexpected database error occurred. Please try again.",
                "request_id": request_id
            }
        }
    )


async def http_exception_handler(request: Request, exc: HTTPException):
    """
    Handle HTTP exceptions with consistent format.
    
    Ensures all HTTP exceptions follow the standard error response format.
    
    Args:
        request: FastAPI request object
        exc: HTTP exception
        
    Returns:
        JSONResponse with formatted error
    """
    request_id = getattr(request.state, 'request_id', None)
    
    # Extract message from detail
    if isinstance(exc.detail, dict):
        # Already formatted (e.g., from ValidationError)
        return JSONResponse(
            status_code=exc.status_code,
            content=exc.detail
        )
    
    message = exc.detail if isinstance(exc.detail, str) else str(exc.detail)
    
    # Map status codes to error codes
    code_map = {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
        405: "METHOD_NOT_ALLOWED",
        409: "CONFLICT",
        422: "VALIDATION_ERROR",
        429: "RATE_LIMIT_EXCEEDED",
        500: "INTERNAL_ERROR",
        503: "SERVICE_UNAVAILABLE"
    }
    
    error_code = code_map.get(exc.status_code, f"HTTP_{exc.status_code}")
    
    logger.warning(
        f"HTTP exception: {exc.status_code}",
        extra={
            "request_id": request_id,
            "status_code": exc.status_code,
            "message": message,
            "url": request.url.path
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "status": "error",
            "error": {
                "code": error_code,
                "message": message,
                "request_id": request_id
            }
        }
    )


async def general_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions with generic error message.
    
    Catch-all handler for any unhandled exceptions.
    Logs the full error but returns a generic message to the user.
    
    Args:
        request: FastAPI request object
        exc: Any exception
        
    Returns:
        JSONResponse with generic error message
    """
    request_id = getattr(request.state, 'request_id', None)
    
    logger.error(
        "Unhandled exception",
        exc_info=True,
        extra={
            "request_id": request_id,
            "exception_type": type(exc).__name__,
            "url": request.url.path,
            "method": request.method
        }
    )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An unexpected error occurred. Please try again later.",
                "request_id": request_id
            }
        }
    )
