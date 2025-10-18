"""
Patient schemas with automatic camelCase conversion.

All response schemas inherit from CamelCaseModel to automatically convert
Python snake_case field names to JavaScript camelCase.
"""

from app.schemas.base import CamelCaseModel
from typing import Optional
from datetime import datetime


class PatientResponse(CamelCaseModel):
    """
    Patient response with automatic camelCase conversion.
    
    Python fields → JSON fields:
    - id → id
    - name → name
    - age → age
    - sex → sex
    - phone → phone
    - email → email
    - address → address
    - referred_by → referredBy
    - illness_duration → illnessDuration
    - created_at → createdAt
    - updated_at → updatedAt
    """
    id: str
    name: str
    age: int
    sex: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    referred_by: Optional[str] = None
    illness_duration: Optional[str] = None  # Formatted string like "2 Months"
    created_at: datetime
    updated_at: datetime
    last_visit: Optional[datetime] = None  # ADD THIS LINE
    

class PatientCreateRequest(CamelCaseModel):
    """
    Patient creation request - accepts both camelCase and snake_case.
    
    Frontend can send either:
    - { "referredBy": "Dr. Smith", "illnessDuration": {...} }
    - { "referred_by": "Dr. Smith", "illness_duration": {...} }
    """
    name: str
    age: int
    sex: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    referred_by: Optional[str] = None
    illness_duration_value: Optional[int] = None
    illness_duration_unit: Optional[str] = None


class PatientListResponse(CamelCaseModel):
    """Paginated patient list response with camelCase fields"""
    items: list[PatientResponse]
    pagination: dict



class PatientDemographicsRequest(CamelCaseModel):
    """
    Stage 1: Demographics-only patient creation (Receptionist).
    Only includes non-clinical administrative data.
    """
    # Basic demographics
    first_name: str
    last_name: str
    date_of_birth: str  # Format: YYYY-MM-DD
    gender: str
    
    # Contact information
    phone_primary: str
    phone_secondary: Optional[str] = None
    email: Optional[str] = None
    
    # Address
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    
    # Emergency contact
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None
    emergency_contact_relationship: Optional[str] = None
    
    # Insurance (administrative, not clinical)
    insurance_provider: Optional[str] = None
    insurance_policy_number: Optional[str] = None
    insurance_group_number: Optional[str] = None
    
    # Additional demographics
    occupation: Optional[str] = None
    marital_status: Optional[str] = None
    preferred_language: Optional[str] = None


class PatientClinicalInfoRequest(CamelCaseModel):
    """
    Stage 2: Clinical information completion (Doctor only).
    Adds sensitive medical data to existing patient record.
    """
    # Medical information
    blood_group: Optional[str] = None
    allergies: Optional[str] = None  # Comma-separated
    medical_history: Optional[str] = None
    current_medications: Optional[str] = None
    
    # Clinical notes
    notes: Optional[str] = None
    tags: Optional[str] = None


class PatientDemographicsResponse(CamelCaseModel):
    """Response for demographics-only patient (Stage 1)."""
    id: str
    patient_id: str
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: str
    age: Optional[int]
    gender: str
    phone_primary: str
    phone_secondary: Optional[str]
    email: Optional[str]
    profile_status: str
    created_at: datetime
    created_by: str


class PatientCompleteResponse(CamelCaseModel):
    """Response for complete patient profile (Stage 2 complete)."""
    id: str
    patient_id: str
    first_name: str
    last_name: str
    full_name: str
    date_of_birth: str
    age: Optional[int]
    gender: str
    
    # Contact
    phone_primary: str
    phone_secondary: Optional[str]
    email: Optional[str]
    
    # Address
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    state: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    
    # Emergency contact
    emergency_contact_name: Optional[str]
    emergency_contact_phone: Optional[str]
    emergency_contact_relationship: Optional[str]
    
    # Medical
    blood_group: Optional[str]
    allergies: Optional[str]
    medical_history: Optional[str]
    current_medications: Optional[str]
    
    # Insurance
    insurance_provider: Optional[str]
    insurance_policy_number: Optional[str]
    insurance_group_number: Optional[str]
    
    # Metadata
    profile_status: str
    created_at: datetime
    updated_at: datetime
    created_by: str


class PendingPatientResponse(CamelCaseModel):
    """Response for patients pending clinical review."""
    id: str
    patient_id: str
    full_name: str
    age: Optional[int]
    gender: str
    phone_primary: str
    created_at: datetime
    created_by_name: Optional[str]  # Receptionist who created it
