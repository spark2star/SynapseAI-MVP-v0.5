"""
Authentication-related Pydantic schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class LoginRequest(BaseModel):
    """Schema for login request."""
    email: str = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    remember_me: bool = Field(False, description="Extended session duration")


class LoginResponse(BaseModel):
    """Schema for login response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")
    user_id: str = Field(..., description="User ID")
    role: str = Field(..., description="User role")
    requires_mfa: bool = Field(False, description="Whether MFA is required")
    doctor_status: Optional[str] = Field(None, description="Doctor verification status")
    profile_completed: Optional[bool] = Field(None, description="Whether profile is completed")
    password_reset_required: bool = Field(False, description="Whether password reset is required")


class RefreshTokenRequest(BaseModel):
    """Schema for token refresh request."""
    refresh_token: str = Field(..., description="Refresh token")


class LogoutResponse(BaseModel):
    """Schema for logout response."""
    message: str = Field(..., description="Logout confirmation message")
    logged_out_at: datetime = Field(..., description="Logout timestamp")


class TokenValidationRequest(BaseModel):
    """Schema for token validation request."""
    token: str = Field(..., description="JWT token to validate")


class TokenValidationResponse(BaseModel):
    """Schema for token validation response."""
    valid: bool = Field(..., description="Whether token is valid")
    user_id: Optional[str] = Field(None, description="User ID if token is valid")
    role: Optional[str] = Field(None, description="User role if token is valid")
    expires_at: Optional[int] = Field(None, description="Token expiration timestamp")
    error: Optional[str] = Field(None, description="Error message if token is invalid")


class AuthenticationError(BaseModel):
    """Schema for authentication errors."""
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")


class SessionInfo(BaseModel):
    """Schema for session information."""
    session_id: str = Field(..., description="Session identifier")
    user_id: str = Field(..., description="User ID")
    created_at: datetime = Field(..., description="Session creation time")
    last_activity: datetime = Field(..., description="Last activity time")
    ip_address: str = Field(..., description="Client IP address")
    user_agent: str = Field(..., description="Client user agent")
    is_active: bool = Field(..., description="Whether session is active")
