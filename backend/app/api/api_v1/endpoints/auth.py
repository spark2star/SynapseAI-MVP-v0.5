"""
Authentication endpoints.
Handles user login, logout, registration, and token management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Annotated
from typing import Dict, Any
import time
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    security, jwt_manager, rate_limit_check,
    get_current_user_token, get_current_user_id, require_role
)
from app.core.audit import audit_logger, AuditEventType
from app.services.auth_service import get_auth_service, AuthenticationService
from app.schemas.user import UserCreate, UserLogin, PasswordChange, PasswordResetRequest
from app.schemas.auth import (
    LoginRequest, LoginResponse, RefreshTokenRequest, 
    TokenValidationResponse, LogoutResponse
)

router = APIRouter()


@router.post("/login", response_model=Dict[str, Any])
async def login(
    login_data: LoginRequest,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    auth_service: Annotated[AuthenticationService, Depends(get_auth_service)],
    _: Annotated[None, Depends(rate_limit_check)] = None
):
    """
    User login endpoint.
    Returns JWT access and refresh tokens.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Convert LoginRequest to UserLogin schema
        user_login = UserLogin(
            email=login_data.email,
            password=login_data.password,
            remember_me=login_data.remember_me
        )
        
        # Authenticate user
        login_response, session_id = await auth_service.authenticate_user(
            login_data=user_login,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return {
            "status": "success",
            "data": {
                "access_token": login_response.access_token,
                "refresh_token": login_response.refresh_token,
                "token_type": login_response.token_type,
                "expires_in": login_response.expires_in,
                "user_id": login_response.user_id,
                "role": login_response.role,
                "requires_mfa": login_response.requires_mfa,
                "session_id": session_id
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        # Re-raise HTTP exceptions (they're already handled properly)
        raise e
    except Exception as e:
        # Log unexpected errors
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/login"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service temporarily unavailable"
        )


@router.post("/logout", response_model=Dict[str, Any])
async def logout(
    request: Request,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    auth_service: AuthenticationService = Depends(get_auth_service)
):
    """
    User logout endpoint.
    Invalidates current session.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        user_agent = request.headers.get("user-agent", "")
        
        # Get session ID from headers if available
        session_id = request.headers.get("x-session-id")
        
        # Logout user
        logout_data = await auth_service.logout_user(
            user_id=current_user_id,
            session_id=session_id,
            ip_address=client_ip,
            user_agent=user_agent
        )
        
        return {
            "status": "success",
            "data": logout_data,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/logout"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout service temporarily unavailable"
        )


@router.post("/refresh", response_model=Dict[str, Any])
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    auth_service: AuthenticationService = Depends(get_auth_service)
):
    """
    Refresh JWT token endpoint.
    Validates refresh token and returns new access token.
    """
    try:
        # Refresh token
        token_data = await auth_service.refresh_token(refresh_data.refresh_token)
        
        return {
            "status": "success",
            "data": token_data,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh service temporarily unavailable"
        )


@router.get("/validate-token", response_model=Dict[str, Any])
async def validate_token(
    token_data: Dict[str, Any] = Depends(get_current_user_token)
):
    """
    Validate current JWT token.
    Returns token information if valid.
    """
    return {
        "status": "success",
        "data": {
            "valid": True,
            "user_id": token_data.get("sub"),
            "role": token_data.get("role"),
            "email": token_data.get("email"),
            "expires_at": token_data.get("exp"),
            "token_type": token_data.get("type", "access")
        },
        "metadata": {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0"
        }
    }


@router.post("/register", response_model=Dict[str, Any])
async def register_user(
    user_data: UserCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user_token: Dict[str, Any] = Depends(require_role("admin")),
    auth_service: AuthenticationService = Depends(get_auth_service)
):
    """
    Register new user (admin only).
    Creates new user account with specified role.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        current_user_id = current_user_token.get("sub")
        
        # Register user
        new_user = await auth_service.register_user(
            user_data=user_data,
            created_by_user_id=current_user_id,
            ip_address=client_ip
        )
        
        return {
            "status": "success",
            "data": {
                "user_id": new_user.id,
                "email": user_data.email,
                "role": user_data.role.value,
                "message": "User registered successfully. Email verification required.",
                "requires_verification": True
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_token.get("sub"),
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/register"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User registration service temporarily unavailable"
        )


@router.post("/change-password", response_model=Dict[str, Any])
async def change_password(
    password_data: PasswordChange,
    request: Request,
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    auth_service: AuthenticationService = Depends(get_auth_service)
):
    """
    Change user password.
    Requires current password for verification.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Change password
        result = await auth_service.change_password(
            user_id=current_user_id,
            password_data=password_data,
            ip_address=client_ip
        )
        
        return {
            "status": "success",
            "data": result,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/change-password"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change service temporarily unavailable"
        )


@router.post("/request-password-reset", response_model=Dict[str, Any])
async def request_password_reset(
    reset_data: PasswordResetRequest,
    request: Request,
    auth_service: Annotated[AuthenticationService, Depends(get_auth_service)],
    _: Annotated[None, Depends(rate_limit_check)] = None
):
    """
    Request password reset.
    Sends reset instructions to email if account exists.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Request password reset
        result = await auth_service.request_password_reset(
            reset_data=reset_data,
            ip_address=client_ip
        )
        
        return {
            "status": "success",
            "data": result,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/request-password-reset"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset service temporarily unavailable"
        )


@router.post("/verify-email/{token}", response_model=Dict[str, Any])
async def verify_email(
    token: str,
    request: Request,
    auth_service: AuthenticationService = Depends(get_auth_service)
):
    """
    Verify user email with verification token.
    """
    try:
        # Verify email
        result = await auth_service.verify_email(token)
        
        await audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATED,
            ip_address=request.client.host if request.client else "unknown",
            details={"action": "email_verification_attempted", "token_provided": True}
        )
        
        return {
            "status": "success",
            "data": result,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/auth/verify-email"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification service temporarily unavailable"
        )