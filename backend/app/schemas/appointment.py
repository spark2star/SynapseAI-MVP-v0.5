"""
Appointment schemas for API validation and serialization.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.appointment import AppointmentStatus, AppointmentType, AppointmentPriority


# Base Schemas
class AppointmentBase(BaseModel):
    """Base schema for appointment."""
    patient_id: str
    doctor_id: Optional[str] = None  # Will be set from auth if not provided
    scheduled_datetime: str = Field(..., description="ISO 8601 datetime string")
    duration_minutes: int = Field(30, ge=5, le=480)
    timezone: str = "UTC"
    appointment_type: str = AppointmentType.CONSULTATION.value
    priority: str = AppointmentPriority.NORMAL.value
    
    @validator('scheduled_datetime')
    def validate_datetime(cls, v):
        """Validate ISO 8601 datetime format."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid datetime format. Use ISO 8601 format.")
        return v


class AppointmentCreate(AppointmentBase):
    """Schema for creating a new appointment."""
    chief_complaint: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    preparation_instructions: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    confirmation_required: bool = True
    estimated_cost: Optional[float] = None
    copay_amount: Optional[float] = None


class AppointmentUpdate(BaseModel):
    """Schema for updating an appointment (all fields optional)."""
    scheduled_datetime: Optional[str] = None
    duration_minutes: Optional[int] = Field(None, ge=5, le=480)
    appointment_type: Optional[str] = None
    status: Optional[str] = None
    priority: Optional[str] = None
    chief_complaint: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=1000)
    preparation_instructions: Optional[str] = Field(None, max_length=1000)
    location: Optional[str] = Field(None, max_length=200)
    estimated_cost: Optional[float] = None
    copay_amount: Optional[float] = None
    
    @validator('scheduled_datetime')
    def validate_datetime(cls, v):
        if v is not None:
            try:
                datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError("Invalid datetime format. Use ISO 8601 format.")
        return v


class AppointmentRead(AppointmentBase):
    """Schema for reading appointment data."""
    id: str
    status: str
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None
    preparation_instructions: Optional[str] = None
    location: Optional[str] = None
    reminder_sent: bool = False
    reminder_datetime: Optional[str] = None
    confirmation_required: bool = True
    confirmed_at: Optional[str] = None
    confirmed_by: Optional[str] = None
    cancelled_at: Optional[str] = None
    cancelled_by: Optional[str] = None
    cancellation_reason: Optional[str] = None
    rescheduled_from: Optional[str] = None
    rescheduled_to: Optional[str] = None
    reschedule_reason: Optional[str] = None
    completed_at: Optional[str] = None
    session_id: Optional[str] = None
    estimated_cost: Optional[float] = None
    insurance_verified: bool = False
    copay_amount: Optional[float] = None
    appointment_metadata: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Action Schemas
class AppointmentConfirm(BaseModel):
    """Schema for confirming an appointment."""
    confirmation_notes: Optional[str] = Field(None, max_length=500)


class AppointmentCancel(BaseModel):
    """Schema for canceling an appointment."""
    cancellation_reason: str = Field(..., min_length=1, max_length=500)


class AppointmentReschedule(BaseModel):
    """Schema for rescheduling an appointment."""
    new_datetime: str = Field(..., description="New ISO 8601 datetime string")
    reschedule_reason: Optional[str] = Field(None, max_length=500)
    
    @validator('new_datetime')
    def validate_datetime(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid datetime format. Use ISO 8601 format.")
        return v


class AppointmentComplete(BaseModel):
    """Schema for completing an appointment."""
    session_id: Optional[str] = None
    completion_notes: Optional[str] = Field(None, max_length=500)


# Response Schemas
class AppointmentSummaryResponse(BaseModel):
    """Simplified appointment summary for lists."""
    id: str
    patient_id: str
    doctor_id: str
    scheduled_datetime: str
    duration_minutes: int
    appointment_type: str
    status: str
    priority: str
    location: Optional[str] = None
    is_upcoming: bool = False
    is_today: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class AppointmentCalendarEvent(BaseModel):
    """Schema for calendar integration."""
    id: str
    title: str
    start: str
    end: str
    description: Optional[str] = None
    location: Optional[str] = None
    status: str
