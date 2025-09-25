"""
Security middleware for SynapseAI production deployment
"""
from typing import Dict, Optional
import time
import redis
from fastapi import Request, HTTPException, status
from fastapi.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware to prevent abuse of form submissions
    """
    
    def __init__(self, app, redis_client: Optional[redis.Redis] = None, 
                 requests_per_minute: int = 5, requests_per_hour: int = 100):
        super().__init__(app)
        self.redis_client = redis_client
        self.requests_per_minute = requests_per_minute
        self.requests_per_hour = requests_per_hour
        
    async def dispatch(self, request: Request, call_next) -> Response:
        # Only apply rate limiting to form submission endpoints
        if request.url.path in ["/api/v1/newsletter/subscribe", "/api/v1/contact/submit"]:
            client_ip = self._get_client_ip(request)
            
            if self.redis_client:
                # Check rate limits using Redis
                if not self._check_rate_limit(client_ip, request.url.path):
                    logger.warning(f"Rate limit exceeded for IP: {client_ip} on path: {request.url.path}")
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Too many requests. Please try again later."
                    )
            else:
                # Fallback to in-memory rate limiting (not recommended for production)
                logger.warning("Using in-memory rate limiting. Consider using Redis for production.")
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract real client IP considering proxies"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
            
        return request.client.host if request.client else "unknown"
    
    def _check_rate_limit(self, client_ip: str, endpoint: str) -> bool:
        """Check if request is within rate limits"""
        if not self.redis_client:
            return True
            
        current_time = int(time.time())
        
        # Minute-based rate limiting
        minute_key = f"rate_limit:{client_ip}:{endpoint}:minute:{current_time // 60}"
        minute_requests = self.redis_client.incr(minute_key)
        self.redis_client.expire(minute_key, 60)
        
        if minute_requests > self.requests_per_minute:
            return False
        
        # Hour-based rate limiting
        hour_key = f"rate_limit:{client_ip}:{endpoint}:hour:{current_time // 3600}"
        hour_requests = self.redis_client.incr(hour_key)
        self.redis_client.expire(hour_key, 3600)
        
        if hour_requests > self.requests_per_hour:
            return False
            
        return True


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses
    """
    
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS header (only in production with HTTPS)
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


class ContentValidationMiddleware(BaseHTTPMiddleware):
    """
    Validate and sanitize form content
    """
    
    SUSPICIOUS_PATTERNS = [
        "<script",
        "javascript:",
        "vbscript:",
        "onload=",
        "onerror=",
        "eval(",
        "alert(",
        "document.cookie",
        "window.location",
        "iframe",
        "embed",
        "object",
        "<form",
        "sql injection",
        "union select",
        "drop table",
        "delete from",
        "insert into",
    ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        # Only validate form submission endpoints
        if request.url.path in ["/api/v1/newsletter/subscribe", "/api/v1/contact/submit"]:
            if request.method == "POST":
                # Read and validate request body
                body = await request.body()
                body_str = body.decode("utf-8").lower()
                
                # Check for suspicious patterns
                for pattern in self.SUSPICIOUS_PATTERNS:
                    if pattern in body_str:
                        logger.warning(f"Suspicious content detected from IP: {self._get_client_ip(request)}")
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Invalid content detected"
                        )
                
                # Rebuild request with validated body
                request._body = body
        
        response = await call_next(request)
        return response
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract real client IP considering proxies"""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        return request.client.host if request.client else "unknown"


