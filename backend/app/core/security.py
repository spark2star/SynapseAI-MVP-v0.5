"""
Security middleware and utilities.
Implements comprehensive security headers and JWT handling.
"""

from fastapi import HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from jose import JWTError, jwt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import time
import logging

from .config import settings
from .encryption import hash_util

logger = logging.getLogger(__name__)

# JWT Security
security = HTTPBearer()


class SecurityHeaders(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    Implements OWASP security recommendations.
    """
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS (HTTPS Strict Transport Security)
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Content Security Policy
        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' data:; "
            "connect-src 'self' wss: https:; "
            "media-src 'self' blob:; "
            "object-src 'none'; "
            "base-uri 'self';"
        )
        response.headers["Content-Security-Policy"] = csp
        
        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]
        
        return response


class JWTManager:
    """JWT token management utilities."""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any]) -> str:
        """Create JWT access token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire, "type": "access"})
        
        return jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any]) -> str:
        """Create JWT refresh token."""
        to_encode = data.copy()
        expire = datetime.now(timezone.utc) + timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
        to_encode.update({"exp": expire, "type": "refresh"})
        
        return jwt.encode(
            to_encode,
            settings.JWT_SECRET_KEY,
            algorithm=settings.JWT_ALGORITHM
        )
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(
                token,
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM]
            )
            
            # Verify token type
            if payload.get("type") != token_type:
                raise JWTError(f"Invalid token type: expected {token_type}")
            
            # Verify expiration
            exp = payload.get("exp")
            if exp is None or datetime.fromtimestamp(exp, timezone.utc) < datetime.now(timezone.utc):
                raise JWTError("Token has expired")
            
            return payload
            
        except JWTError as e:
            logger.warning(f"JWT verification failed: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )


class RateLimiter:
    """
    Simple in-memory rate limiter.
    In production, use Redis-based rate limiting.
    """
    
    def __init__(self):
        self.requests = {}
        self.blocked_ips = {}
    
    def is_allowed(self, client_ip: str) -> bool:
        """Check if request is allowed based on rate limits."""
        now = time.time()
        
        # Check if IP is temporarily blocked
        if client_ip in self.blocked_ips:
            if now < self.blocked_ips[client_ip]:
                return False
            else:
                del self.blocked_ips[client_ip]
        
        # Initialize or clean old requests
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Remove old requests (older than 1 hour)
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 3600
        ]
        
        # Check hourly limit
        if len(self.requests[client_ip]) >= settings.RATE_LIMIT_PER_HOUR:
            # Block IP for 1 hour
            self.blocked_ips[client_ip] = now + 3600
            return False
        
        # Check per-minute limit
        recent_requests = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 60
        ]
        
        if len(recent_requests) >= settings.RATE_LIMIT_PER_MINUTE:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter()


# JWT Dependencies
jwt_manager = JWTManager()


async def get_current_user_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    """
    Dependency to get current user from JWT token.
    Returns the token payload.
    """
    return jwt_manager.verify_token(credentials.credentials)


async def get_current_user_id(token_data: Dict[str, Any] = Depends(get_current_user_token)) -> str:
    """Get current user ID from token."""
    user_id = token_data.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )
    return user_id


def require_role(required_role: str):
    """
    Dependency factory to require specific role.
    Usage: Depends(require_role("admin"))
    """
    async def check_role(token_data: Dict[str, Any] = Depends(get_current_user_token)) -> Dict[str, Any]:
        user_role = token_data.get("role")
        if user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {required_role}"
            )
        return token_data
    
    return check_role


def require_any_role(required_roles: list):
    """
    Dependency factory to require any of the specified roles.
    Usage: Depends(require_any_role(["admin", "doctor"]))
    """
    async def check_roles(token_data: Dict[str, Any] = Depends(get_current_user_token)) -> Dict[str, Any]:
        user_role = token_data.get("role")
        if user_role not in required_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {required_roles}"
            )
        return token_data
    
    return check_roles


async def rate_limit_check(request: Request):
    """Dependency to check rate limits."""
    client_ip = request.client.host if request.client else "unknown"
    
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded. Please try again later.",
            headers={"Retry-After": "60"}
        )


class SecurityValidator:
    """Security validation utilities."""
    
    @staticmethod
    def validate_password_strength(password: str) -> bool:
        """
        Validate password strength.
        Requirements: 8+ chars, uppercase, lowercase, digit, special char.
        """
        if len(password) < 8:
            return False
        
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = any(c.isdigit() for c in password)
        has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
        
        return all([has_upper, has_lower, has_digit, has_special])
    
    @staticmethod
    def sanitize_input(value: str) -> str:
        """Basic input sanitization."""
        if not isinstance(value, str):
            return str(value)
        
        # Remove potential XSS characters
        dangerous_chars = ["<", ">", "\"", "'", "&", "javascript:", "data:"]
        sanitized = value
        
        for char in dangerous_chars:
            sanitized = sanitized.replace(char, "")
        
        return sanitized.strip()
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Basic email validation."""
        import re
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        return re.match(pattern, email) is not None


# ============================================================================
# PASSWORD HASHING UTILITIES (Argon2id - Modern Standard)
# ============================================================================

from passlib.context import CryptContext

# Password hashing context using Argon2id (more secure than bcrypt)
pwd_context = CryptContext(
    schemes=["argon2"], 
    deprecated="auto",
    argon2__time_cost=2,
    argon2__memory_cost=512,
    argon2__parallelism=2
)


def get_password_hash(password: str) -> str:
    """
    Hash a password using Argon2id.
    
    Argon2id is the winner of the Password Hashing Competition (2015)
    and is recommended over bcrypt for new applications.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its Argon2 hash.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Previously hashed password
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def hash_password(password: str) -> str:
    """Alias for get_password_hash for backward compatibility."""
    return get_password_hash(password)
