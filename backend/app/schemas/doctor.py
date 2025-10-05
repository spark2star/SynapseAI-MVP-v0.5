"""
Pydantic schemas for doctor registration and verification.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime
from enum import Enum

from app.schemas.base import CamelCaseModel


class DoctorStatus(str, Enum):
    """Doctor verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class StateMedicalCouncil(str, Enum):
    """Indian State Medical Councils."""
    ANDHRA_PRADESH = "Andhra Pradesh"
    ARUNACHAL_PRADESH = "Arunachal Pradesh"
    ASSAM = "Assam"
    BIHAR = "Bihar"
    CHHATTISGARH = "Chhattisgarh"
    DELHI = "Delhi"
    GOA = "Goa"
    GUJARAT = "Gujarat"
    HARYANA = "Haryana"
    HIMACHAL_PRADESH = "Himachal Pradesh"
    JHARKHAND = "Jharkhand"
    KARNATAKA = "Karnataka"
    KERALA = "Kerala"
    MADHYA_PRADESH = "Madhya Pradesh"
    MAHARASHTRA = "Maharashtra"
    MANIPUR = "Manipur"
    MEGHALAYA = "Meghalaya"
    MIZORAM = "Mizoram"
    NAGALAND = "Nagaland"
    ODISHA = "Odisha"
    PUNJAB = "Punjab"
    RAJASTHAN = "Rajasthan"
    SIKKIM = "Sikkim"
    TAMIL_NADU = "Tamil Nadu"
    TELANGANA = "Telangana"
    TRIPURA = "Tripura"
    UTTAR_PRADESH = "Uttar Pradesh"
    UTTARAKHAND = "Uttarakhand"
    WEST_BENGAL = "West Bengal"


# ==================== REQUEST SCHEMAS ====================

class DoctorRegistrationRequest(CamelCaseModel):
    """Request schema for doctor registration."""
    full_name: str = Field(..., min_length=3, max_length=255, description="Doctor's full name")
    email: EmailStr = Field(..., description="Doctor's email address")
    phone: str = Field(..., min_length=10, max_length=15, description="Phone/contact number")
    medical_registration_number: str = Field(..., min_length=5, max_length=100, description="Medical registration number")
    state_medical_council: str = Field(..., description="State medical council")
    
    @validator('phone')
    def validate_phone(cls, v):
        """Validate phone number format (Indian format)."""
        # Remove any spaces or special characters
        phone = v.strip().replace(' ', '').replace('-', '').replace('+', '')
        
        # Check if it's a valid 10-digit Indian number starting with 6-9
        if len(phone) == 10 and phone[0] in '6789' and phone.isdigit():
            return phone
        
        # Check if it has country code (+91)
        if len(phone) == 12 and phone.startswith('91') and phone[2] in '6789' and phone.isdigit():
            return phone[2:]  # Return without country code
        
        raise ValueError('Phone number must be a valid 10-digit Indian mobile number starting with 6-9')
    
    @validator('medical_registration_number')
    def validate_med_reg_number(cls, v):
        """Validate medical registration number format."""
        v = v.strip().upper()
        if len(v) < 5:
            raise ValueError('Medical registration number must be at least 5 characters')
        return v


class DoctorProfileCompletionRequest(CamelCaseModel):
    """Request schema for completing doctor profile after approval."""
    clinic_name: str = Field(..., min_length=3, max_length=255)
    clinic_address: str = Field(..., min_length=10, max_length=500)
    specializations: List[str] = Field(..., min_items=1, max_items=5, description="List of specializations")
    years_of_experience: int = Field(..., ge=0, le=60, description="Years of experience")
    phone_number: str = Field(..., min_length=10, max_length=20, description="Contact phone number")
    alternate_email: Optional[EmailStr] = Field(None, description="Alternate email address")
    digital_signature_url: Optional[str] = Field(None, max_length=500, description="URL to digital signature image")


# Alias for profile update (same schema)
DoctorProfileUpdateRequest = DoctorProfileCompletionRequest


class DoctorApprovalRequest(CamelCaseModel):
    """Request schema for approving a doctor application."""
    doctor_user_id: str = Field(..., description="ID of the doctor user to approve")


class DoctorRejectionRequest(CamelCaseModel):
    """Request schema for rejecting a doctor application."""
    doctor_user_id: str = Field(..., description="ID of the doctor user to reject")
    rejection_reason: str = Field(..., min_length=10, max_length=1000, description="Reason for rejection")


# ==================== RESPONSE SCHEMAS ====================

class DoctorRegistrationResponse(CamelCaseModel):
    """Response schema for doctor registration."""
    message: str
    application_id: str
    expected_review: str
    next_steps: str
    request_id: str


class DoctorProfileResponse(CamelCaseModel):
    """Response schema for doctor profile information."""
    user_id: str
    full_name: str
    medical_registration_number: str
    state_medical_council: str
    clinic_name: Optional[str] = None
    clinic_address: Optional[str] = None
    specializations: Optional[List[str]] = None
    years_of_experience: Optional[int] = None
    phone_number: Optional[str] = None
    alternate_email: Optional[str] = None
    digital_signature_url: Optional[str] = None
    application_date: datetime
    verification_date: Optional[datetime] = None
    profile_completed: bool
    status: DoctorStatus


class DoctorApplicationListItem(CamelCaseModel):
    """Individual doctor application in list view."""
    user_id: str
    full_name: str
    email: str
    medical_registration_number: str
    state_medical_council: str
    application_date: datetime
    status: DoctorStatus
    verification_date: Optional[datetime] = None
    verified_by: Optional[str] = None


class DoctorApplicationListResponse(CamelCaseModel):
    """Response schema for listing doctor applications."""
    applications: List[DoctorApplicationListItem]
    pagination: dict
    filters_applied: dict


class DoctorApplicationDetailResponse(CamelCaseModel):
    """Detailed response for a single doctor application."""
    user_id: str
    email: str
    status: DoctorStatus
    created_at: datetime
    profile: DoctorProfileResponse
    audit_history: List[dict]


class DoctorApprovalResponse(CamelCaseModel):
    """Response schema for doctor approval."""
    message: str
    doctor_id: str
    doctor_email: str
    temporary_password_sent: bool
    request_id: str


class DoctorRejectionResponse(CamelCaseModel):
    """Response schema for doctor rejection."""
    message: str
    doctor_id: str
    rejection_email_sent: bool
    request_id: str


class DoctorProfileCompletionResponse(CamelCaseModel):
    """Response schema for profile completion."""
    message: str
    profile_completed: bool
    doctor_id: str
