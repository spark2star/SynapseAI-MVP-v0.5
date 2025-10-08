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