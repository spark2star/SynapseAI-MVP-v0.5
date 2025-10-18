"""
Practitioner profile schemas for request/response validation.
Handles profile data for doctors including clinic information and logo uploads.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from datetime import datetime
import re

from app.core.security import SecurityValidator


class PractitionerProfileBase(BaseModel):
    """Base schema for practitioner profile."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Practitioner first name")
    last_name: Optional[str] = Field(None, min_length=1, max_length=100, description="Practitioner last name")
    clinic_name: Optional[str] = Field(None, max_length=255, description="Clinic or practice name")
    clinic_address: Optional[str] = Field(None, max_length=1000, description="Clinic address")
    phone: Optional[str] = Field(None, max_length=20, description="Contact phone number")
    license_number: Optional[str] = Field(None, max_length=50, description="Medical license number")
    specialization: Optional[str] = Field(None, max_length=100, description="Medical specialization")
    
    @validator('phone')
    def validate_phone_format(cls, v):
        """Validate phone number format (international format)."""
        if v is not None and v.strip():
            # Allow international format: +1234567890 or 1234567890
            phone_pattern = r'^\+?[1-9]\d{1,14}$'
            cleaned = re.sub(r'[\s\-\(\)]', '', v)  # Remove spaces, dashes, parentheses
            if not re.match(phone_pattern, cleaned):
                raise ValueError('Please enter a valid phone number')
            return cleaned
        return v
    
    @validator('first_name', 'last_name', 'clinic_name', 'specialization')
    def validate_text_fields(cls, v):
        """Validate and sanitize text fields."""
        if v is not None and v.strip():
            sanitized = SecurityValidator.sanitize_input(v.strip())
            return sanitized
        return v
    
    @validator('clinic_address')
    def validate_clinic_address(cls, v):
        """Validate clinic address."""
        if v is not None and v.strip():
            if len(v) > 1000:
                raise ValueError('Clinic address must be less than 1000 characters')
            return v.strip()
        return v


class PractitionerProfileUpdate(PractitionerProfileBase):
    """Schema for updating practitioner profile."""
    pass


class PractitionerProfileRead(BaseModel):
    """Schema for reading practitioner profile."""
    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    clinic_name: Optional[str]
    clinic_address: Optional[str]
    phone: Optional[str]
    license_number: Optional[str]
    specialization: Optional[str]
    logo_url: Optional[str]
    avatar_url: Optional[str]
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class PractitionerProfileUpdateResponse(BaseModel):
    """Schema for profile update response."""
    success: bool = Field(..., description="Whether the update was successful")
    message: str = Field(..., description="Response message")
    data: PractitionerProfileRead = Field(..., description="Updated profile data")


class ProfileCompletionRequest(BaseModel):
    """Schema for doctor profile completion request."""
    qualifications: str = Field(..., max_length=255, description="Doctor credentials (e.g., 'MBBS, MD (Psychiatry), DPM')")
    clinic_name: str = Field(..., max_length=255, description="Name of clinic/practice")
    clinic_address: str = Field(..., max_length=1000, description="Full clinic address")
    phone: str = Field(..., pattern=r'^\+?[1-9]\d{1,14}$', description="Contact phone number in international format")
    
    @validator('qualifications', 'clinic_name')
    def validate_text_fields(cls, v):
        """Validate and sanitize text fields."""
        if v:
            sanitized = SecurityValidator.sanitize_input(v.strip())
            if not sanitized:
                raise ValueError('Field cannot be empty')
            return sanitized
        raise ValueError('Field is required')
    
    @validator('clinic_address')
    def validate_clinic_address(cls, v):
        """Validate clinic address."""
        if v:
            v = v.strip()
            if len(v) < 10:
                raise ValueError('Clinic address must be at least 10 characters')
            if len(v) > 1000:
                raise ValueError('Clinic address must be less than 1000 characters')
            return v
        raise ValueError('Clinic address is required')
    
    @validator('phone')
    def validate_phone_format(cls, v):
        """Validate phone number format."""
        if v:
            # Remove spaces, dashes, parentheses
            cleaned = re.sub(r'[\s\-\(\)]', '', v)
            # Validate international format
            if not re.match(r'^\+?[1-9]\d{1,14}$', cleaned):
                raise ValueError('Please enter a valid phone number in international format')
            return cleaned
        raise ValueError('Phone number is required')
    
    class Config:
        json_schema_extra = {
            "example": {
                "qualifications": "MBBS, MD (Psychiatry), DPM",
                "clinic_name": "Mind Wellness Clinic",
                "clinic_address": "123 Health Street, Mumbai, MH 400001",
                "phone": "+919876543210"
            }
        }


class ProfileCompletionResponse(BaseModel):
    """Schema for profile completion response."""
    message: str = Field(..., description="Success message")
    profile_completed: bool = Field(..., description="Whether profile is now completed")
    profile: PractitionerProfileRead = Field(..., description="Updated profile data")
    
    class Config:
        json_schema_extra = {
            "example": {
                "message": "Profile completed successfully",
                "profile_completed": True,
                "profile": {
                    "id": "user-uuid",
                    "email": "doctor@example.com",
                    "first_name": "John",
                    "last_name": "Doe",
                    "full_name": "Dr. John Doe",
                    "clinic_name": "Mind Wellness Clinic",
                    "clinic_address": "123 Health Street, Mumbai, MH 400001",
                    "phone": "+919876543210",
                    "license_number": "MH12345",
                    "specialization": "Psychiatry",
                    "logo_url": "https://storage.googleapis.com/...",
                    "avatar_url": None,
                    "updated_at": "2025-10-18T12:00:00Z"
                }
            }
        }
