"""
Staff management schemas for invitation and onboarding.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime


class StaffInviteRequest(BaseModel):
    """Request schema for inviting a receptionist."""
    email: EmailStr = Field(..., description="Email address of the receptionist to invite")


class StaffInviteResponse(BaseModel):
    """Response schema after sending invitation."""
    status: str = "success"
    message: str
    invitation_id: str
    recipient_email: str
    expires_at: datetime


class AcceptInviteRequest(BaseModel):
    """Request schema for accepting an invitation."""
    password: str = Field(..., min_length=8, description="Password for the new account")
    confirm_password: str = Field(..., min_length=8, description="Password confirmation")
    
    @validator('confirm_password')
    def passwords_match(cls, v, values):
        """Validate that passwords match."""
        if 'password' in values and v != values['password']:
            raise ValueError('Passwords do not match')
        return v


class AcceptInviteResponse(BaseModel):
    """Response schema after accepting invitation."""
    status: str = "success"
    message: str
    user_id: str
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class StaffMemberResponse(BaseModel):
    """Response schema for staff member information."""
    id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]
    role: str
    is_active: bool
    created_at: datetime
    invited_by_id: Optional[str]
    
    class Config:
        from_attributes = True


class InvitationStatusResponse(BaseModel):
    """Response schema for invitation status check."""
    valid: bool
    expired: bool
    recipient_email: Optional[str]
    inviter_name: Optional[str]
    clinic_name: Optional[str]
    message: str
