"""
Rate limiting configuration for API endpoints.

Protects against:
- Brute force attacks on authentication
- API abuse and spam
- Resource exhaustion

Uses SlowAPI for rate limiting with Redis backend support.
"""

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from starlette.requests import Request
from starlette.responses import JSONResponse
import logging
import os

logger = logging.getLogger(__name__)

# Determine storage backend
# Use Redis in production, memory for development
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379")
STORAGE_URI = REDIS_URL if os.getenv("ENVIRONMENT") == "production" else "memory://"

# Create limiter instance
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],  # Global default for all endpoints
    storage_uri=STORAGE_URI,
    strategy="fixed-window",
    headers_enabled=True  # Add rate limit headers to responses
)

logger.info(f"Rate limiter initialized with storage: {STORAGE_URI}")


async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
    """
    Custom handler for rate limit exceeded errors.
    
    Returns structured error response with:
    - Error code
    - User-friendly message
    - Retry-after information
    - Request ID for tracking
    
    Also logs the event with IP address and path for security monitoring.
    """
    request_id = getattr(request.state, 'request_id', 'unknown')
    ip_address = get_remote_address(request)
    
    logger.warning(
        "Rate limit exceeded",
        extra={
            'request_id': request_id,
            'path': request.url.path,
            'ip_address': ip_address,
            'limit': str(exc.detail),
            'user_agent': request.headers.get('user-agent', 'unknown')
        }
    )
    
    return JSONResponse(
        status_code=429,
        content={
            "status": "error",
            "error": {
                "code": "RATE_LIMIT_EXCEEDED",
                "message": "Too many requests. Please try again later.",
                "details": str(exc.detail),
                "retry_after": "Please wait before making more requests"
            },
            "request_id": request_id
        },
        headers={
            "Retry-After": "60",  # Suggest retry after 60 seconds
            "X-RateLimit-Limit": str(exc.detail)
        }
    )


# Rate limit configurations for different endpoint types
RATE_LIMITS = {
    # Authentication endpoints - strict limits
    "login": "5/minute",  # 5 login attempts per minute per IP
    "register": "3/hour",  # 3 registrations per hour per IP
    "forgot_password": "3/hour",  # 3 password reset requests per hour
    "refresh_token": "10/minute",  # 10 token refreshes per minute
    
    # Resource-intensive endpoints
    "generate_report": "10/minute",  # AI report generation
    "upload_file": "20/minute",  # File uploads
    
    # Standard CRUD operations
    "create": "30/minute",  # Creating resources
    "list": "60/minute",  # Listing resources
    "search": "60/minute",  # Search operations
    
    # Permissive for read operations
    "read": "100/minute",  # Reading individual resources
}


def get_rate_limit(endpoint_type: str) -> str:
    """
    Get rate limit string for endpoint type.
    
    Args:
        endpoint_type: Type of endpoint (e.g., 'login', 'create', 'list')
    
    Returns:
        Rate limit string (e.g., '5/minute')
    """
    return RATE_LIMITS.get(endpoint_type, "100/minute")

