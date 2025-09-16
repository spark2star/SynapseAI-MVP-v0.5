"""
User-related Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.core.security import SecurityValidator


class UserRole(str, Enum):
    """User role enumeration."""
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"


class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr = Field(..., description="User email address")
    role: UserRole = Field(..., description="User role")
    
    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        if not SecurityValidator.is_valid_email(v):
            raise ValueError('Invalid email format')
        return v.lower()


class UserCreate(UserBase):
    """Schema for user creation."""
    password: str = Field(..., min_length=8, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="First name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Last name")
    phone: Optional[str] = Field(None, max_length=20, description="Phone number")
    license_number: Optional[str] = Field(None, max_length=50, description="Medical license number (for doctors)")
    specialization: Optional[str] = Field(None, max_length=100, description="Medical specialization (for doctors)")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password strength."""
        if not SecurityValidator.validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, digit, and special character')
        return v
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate and sanitize names."""
        return SecurityValidator.sanitize_input(v)
    
    @validator('license_number')
    def validate_license_for_doctors(cls, v, values):
        """Validate that doctors have license numbers."""
        if values.get('role') == UserRole.DOCTOR and not v:
            raise ValueError('License number is required for doctors')
        return v


class UserLogin(BaseModel):
    """Schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    remember_me: bool = Field(False, description="Extended session duration")
    
    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        return v.lower()


class UserUpdate(BaseModel):
    """Schema for user updates."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=20)
    specialization: Optional[str] = Field(None, max_length=100)
    timezone: Optional[str] = Field(None, max_length=50)
    language: Optional[str] = Field(None, max_length=10)
    
    @validator('first_name', 'last_name', 'specialization')
    def validate_text_fields(cls, v):
        """Validate and sanitize text fields."""
        if v is not None:
            return SecurityValidator.sanitize_input(v)
        return v


class PasswordChange(BaseModel):
    """Schema for password change."""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Validate new password strength."""
        if not SecurityValidator.validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, digit, and special character')
        return v


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)."""
    id: str
    email: str
    role: UserRole
    is_verified: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserProfileResponse(BaseModel):
    """Schema for user profile response."""
    id: str
    user_id: str
    first_name: str
    last_name: str
    phone: Optional[str]
    license_number: Optional[str]
    specialization: Optional[str]
    timezone: str
    language: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    """Schema for detailed user response."""
    user: UserResponse
    profile: UserProfileResponse
    
    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field("bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration time in seconds")
    user: UserResponse = Field(..., description="User information")


class TokenValidationResponse(BaseModel):
    """Schema for token validation response."""
    valid: bool = Field(..., description="Whether token is valid")
    user_id: str = Field(..., description="User ID from token")
    role: UserRole = Field(..., description="User role from token")
    expires_at: int = Field(..., description="Token expiration timestamp")


class MFASetup(BaseModel):
    """Schema for MFA setup."""
    secret: str = Field(..., description="MFA secret key")
    qr_code: str = Field(..., description="QR code for MFA setup")
    backup_codes: List[str] = Field(..., description="Backup codes for MFA")


class MFAVerification(BaseModel):
    """Schema for MFA verification."""
    token: str = Field(..., min_length=6, max_length=6, description="6-digit MFA token")
    
    @validator('token')
    def validate_token_format(cls, v):
        """Validate MFA token format."""
        if not v.isdigit():
            raise ValueError('MFA token must be 6 digits')
        return v


class PasswordResetRequest(BaseModel):
    """Schema for password reset request."""
    email: EmailStr = Field(..., description="User email address")
    
    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        return v.lower()


class PasswordReset(BaseModel):
    """Schema for password reset."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator('new_password')
    def validate_password_strength(cls, v):
        """Validate new password strength."""
        if not SecurityValidator.validate_password_strength(v):
            raise ValueError('Password must be at least 8 characters with uppercase, lowercase, digit, and special character')
        return v


class UserListResponse(BaseModel):
    """Schema for user list response."""
    users: List[UserResponse]
    total_count: int
    limit: int
    offset: int
