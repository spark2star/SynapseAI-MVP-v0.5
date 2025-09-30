"""
Consultation session schemas for API validation and serialization.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime

from app.models.session import SessionStatus, SessionType


# Base Schemas
class ConsultationSessionBase(BaseModel):
    """Base schema for consultation session."""
    patient_id: str
    session_type: str = SessionType.CONSULTATION.value
    chief_complaint: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)
    recording_settings: Optional[Dict[str, Any]] = None
    stt_settings: Optional[Dict[str, Any]] = None


class ConsultationSessionCreate(ConsultationSessionBase):
    """Schema for creating a new consultation session."""
    pass


class ConsultationSessionUpdate(BaseModel):
    """Schema for updating a consultation session (all fields optional)."""
    status: Optional[str] = None
    chief_complaint: Optional[str] = Field(None, max_length=500)
    notes: Optional[str] = Field(None, max_length=2000)
    audio_file_url: Optional[str] = None
    audio_file_size: Optional[int] = None
    audio_format: Optional[str] = None
    audio_duration: Optional[float] = None
    billing_code: Optional[str] = None
    billing_amount: Optional[float] = None


class ConsultationSessionRead(ConsultationSessionBase):
    """Schema for reading consultation session data."""
    id: str
    session_id: str
    doctor_id: str
    status: str
    started_at: str
    ended_at: Optional[str] = None
    paused_at: Optional[str] = None
    resumed_at: Optional[str] = None
    total_duration: Optional[float] = None
    audio_file_url: Optional[str] = None
    audio_duration: Optional[float] = None
    audio_quality_score: Optional[float] = None
    transcription_confidence: Optional[float] = None
    billing_code: Optional[str] = None
    billing_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SessionStatusUpdate(BaseModel):
    """Schema for updating session status."""
    status: str = Field(..., description="New session status")
    
    @validator('status')
    def validate_status(cls, v):
        valid_statuses = [s.value for s in SessionStatus]
        if v not in valid_statuses:
            raise ValueError(f"Status must be one of: {', '.join(valid_statuses)}")
        return v


class SessionStartRequest(BaseModel):
    """Schema for starting a new session."""
    patient_id: str
    session_type: str = SessionType.CONSULTATION.value
    chief_complaint: Optional[str] = None
    notes: Optional[str] = None


class SessionAudioUpload(BaseModel):
    """Schema for audio upload metadata."""
    audio_file_url: str
    audio_file_size: int
    audio_format: str
    audio_duration: Optional[float] = None


# Response Schemas
class SessionSummaryResponse(BaseModel):
    """Simplified session summary for lists."""
    id: str
    session_id: str
    patient_id: str
    status: str
    session_type: str
    started_at: str
    duration_minutes: Optional[float] = None
    has_audio: bool = False
    has_transcription: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
