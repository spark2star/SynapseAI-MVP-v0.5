"""
Patient-related Pydantic schemas for request/response validation.
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

from app.models.patient import Gender, BloodGroup
from app.core.security import SecurityValidator


class PatientBase(BaseModel):
    """Base patient schema with common fields."""
    first_name: str = Field(..., min_length=1, max_length=100, description="Patient first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="Patient last name")
    date_of_birth: date = Field(..., description="Patient date of birth")
    gender: Gender = Field(..., description="Patient gender")
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate and sanitize names."""
        return SecurityValidator.sanitize_input(v)


class PatientCreate(PatientBase):
    """Schema for patient creation."""
    # Contact information
    phone_primary: Optional[str] = Field(None, max_length=20, description="Primary phone number")
    phone_secondary: Optional[str] = Field(None, max_length=20, description="Secondary phone number")
    email: Optional[EmailStr] = Field(None, description="Email address")
    
    # Address
    address_line1: Optional[str] = Field(None, max_length=255, description="Address line 1")
    address_line2: Optional[str] = Field(None, max_length=255, description="Address line 2")
    city: Optional[str] = Field(None, max_length=100, description="City")
    state: Optional[str] = Field(None, max_length=100, description="State/Province")
    postal_code: Optional[str] = Field(None, max_length=20, description="Postal code")
    country: Optional[str] = Field(None, max_length=100, description="Country")
    
    # Emergency contact
    emergency_contact_name: Optional[str] = Field(None, max_length=200, description="Emergency contact name")
    emergency_contact_phone: Optional[str] = Field(None, max_length=20, description="Emergency contact phone")
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50, description="Emergency contact relationship")
    
    # Medical information
    blood_group: Optional[BloodGroup] = Field(None, description="Blood group")
    allergies: Optional[str] = Field(None, max_length=1000, description="Known allergies")
    medical_history: Optional[str] = Field(None, max_length=5000, description="Medical history")
    current_medications: Optional[str] = Field(None, max_length=2000, description="Current medications")
    
    # Insurance information
    insurance_provider: Optional[str] = Field(None, max_length=200, description="Insurance provider")
    insurance_policy_number: Optional[str] = Field(None, max_length=100, description="Insurance policy number")
    insurance_group_number: Optional[str] = Field(None, max_length=100, description="Insurance group number")
    
    # Additional demographics
    occupation: Optional[str] = Field(None, max_length=200, description="Occupation")
    marital_status: Optional[str] = Field(None, max_length=20, description="Marital status")
    preferred_language: Optional[str] = Field(None, max_length=50, description="Preferred language")
    
    # System fields
    notes: Optional[str] = Field(None, description="Additional notes")
    tags: Optional[str] = Field(None, max_length=500, description="Comma-separated tags")
    
    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        if v and not SecurityValidator.is_valid_email(v):
            raise ValueError('Invalid email format')
        return v.lower() if v else v
    
    @validator('allergies', 'medical_history', 'current_medications', 'notes')
    def validate_text_fields(cls, v):
        """Validate and sanitize text fields."""
        if v is not None:
            return SecurityValidator.sanitize_input(v)
        return v


class PatientUpdate(BaseModel):
    """Schema for patient updates."""
    first_name: Optional[str] = Field(None, min_length=1, max_length=100)
    last_name: Optional[str] = Field(None, min_length=1, max_length=100)
    date_of_birth: Optional[date] = Field(None)
    gender: Optional[Gender] = Field(None)
    
    # Contact information
    phone_primary: Optional[str] = Field(None, max_length=20)
    phone_secondary: Optional[str] = Field(None, max_length=20)
    email: Optional[EmailStr] = Field(None)
    
    # Address
    address_line1: Optional[str] = Field(None, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: Optional[str] = Field(None, max_length=100)
    state: Optional[str] = Field(None, max_length=100)
    postal_code: Optional[str] = Field(None, max_length=20)
    country: Optional[str] = Field(None, max_length=100)
    
    # Emergency contact
    emergency_contact_name: Optional[str] = Field(None, max_length=200)
    emergency_contact_phone: Optional[str] = Field(None, max_length=20)
    emergency_contact_relationship: Optional[str] = Field(None, max_length=50)
    
    # Medical information
    blood_group: Optional[BloodGroup] = Field(None)
    allergies: Optional[str] = Field(None, max_length=1000)
    medical_history: Optional[str] = Field(None, max_length=5000)
    current_medications: Optional[str] = Field(None, max_length=2000)
    
    # Insurance information
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_policy_number: Optional[str] = Field(None, max_length=100)
    insurance_group_number: Optional[str] = Field(None, max_length=100)
    
    # Additional demographics
    occupation: Optional[str] = Field(None, max_length=200)
    marital_status: Optional[str] = Field(None, max_length=20)
    preferred_language: Optional[str] = Field(None, max_length=50)
    
    # System fields
    notes: Optional[str] = Field(None)
    tags: Optional[str] = Field(None, max_length=500)
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate and sanitize names."""
        if v is not None:
            return SecurityValidator.sanitize_input(v)
        return v
    
    @validator('email')
    def validate_email_format(cls, v):
        """Validate email format."""
        if v and not SecurityValidator.is_valid_email(v):
            raise ValueError('Invalid email format')
        return v.lower() if v else v


class PatientSearch(BaseModel):
    """Schema for patient search parameters."""
    query: Optional[str] = Field(None, min_length=2, description="Search query")
    search_type: str = Field("name", regex="^(name|phone|email)$", description="Type of search")
    limit: int = Field(20, ge=1, le=100, description="Maximum number of results")
    offset: int = Field(0, ge=0, description="Number of results to skip")
    
    # Additional filters
    created_by: Optional[str] = Field(None, description="Filter by creator user ID")
    gender: Optional[Gender] = Field(None, description="Filter by gender")
    blood_group: Optional[BloodGroup] = Field(None, description="Filter by blood group")
    created_after: Optional[datetime] = Field(None, description="Filter by creation date (after)")
    created_before: Optional[datetime] = Field(None, description="Filter by creation date (before)")


class PatientResponse(BaseModel):
    """Schema for patient response."""
    id: str
    patient_id: str
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: str
    age: Optional[int]
    gender: str
    phone_primary: Optional[str]
    email: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class PatientDetailResponse(BaseModel):
    """Schema for detailed patient response."""
    id: str
    patient_id: str
    
    # Demographics
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: str
    age: Optional[int]
    gender: str
    
    # Contact information
    contact_info: dict
    emergency_contact: dict
    
    # Medical information
    medical_summary: dict
    
    # Insurance
    insurance: dict
    
    # System information
    created_by: str
    created_at: datetime
    updated_at: datetime
    notes: Optional[str]
    tags: Optional[str]
    
    class Config:
        from_attributes = True


class PatientSummaryResponse(BaseModel):
    """Schema for patient summary (list view)."""
    id: str
    patient_id: str
    full_name: str
    age: Optional[int]
    gender: str
    phone_primary: Optional[str]
    last_visit: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True


class PatientListResponse(BaseModel):
    """Schema for patient list response."""
    patients: List[PatientSummaryResponse]
    total_count: int
    limit: int
    offset: int


class PatientHistoryResponse(BaseModel):
    """Schema for patient history response."""
    patient: PatientDetailResponse
    consultation_sessions: List[dict]  # Will be replaced with proper session schema
    reports: List[dict]  # Will be replaced with proper report schema
    bills: List[dict]  # Will be replaced with proper bill schema
    total_sessions: int


class PatientSearchResponse(BaseModel):
    """Schema for patient search response."""
    patients: List[PatientSummaryResponse]
    total_count: int
    limit: int
    offset: int
    search_query: Optional[str]
    search_type: str
