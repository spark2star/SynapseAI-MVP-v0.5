"""
Consultation schemas with automatic camelCase conversion.
"""

from app.schemas.base import CamelCaseModel
from typing import Optional
from datetime import datetime


class ConsultationResponse(CamelCaseModel):
    """
    Consultation session response with automatic camelCase conversion.
    
    Automatic conversions:
    - session_id → sessionId
    - patient_id → patientId
    - doctor_id → doctorId
    - chief_complaint → chiefComplaint
    - session_type → sessionType
    - created_at → createdAt
    - started_at → startedAt
    - ended_at → endedAt
    - total_duration → totalDuration
    - duration_minutes → durationMinutes
    - has_transcription → hasTranscription
    - has_report → hasReport
    - report_id → reportId
    """
    id: str
    session_id: str
    patient_id: Optional[str] = None
    doctor_id: Optional[str] = None
    chief_complaint: str
    session_type: str
    status: str
    created_at: Optional[datetime] = None
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    has_transcription: bool = False
    has_report: bool = False
    report_id: Optional[str] = None


class StartConsultationRequest(CamelCaseModel):
    """
    Start consultation request - accepts both camelCase and snake_case.
    
    Frontend can send either format:
    - { "patientId": "...", "chiefComplaint": "...", "sessionType": "..." }
    - { "patient_id": "...", "chief_complaint": "...", "session_type": "..." }
    """
    patient_id: str
    doctor_id: str
    chief_complaint: str
    session_type: str = "consultation"


class ConsultationSessionCreate(CamelCaseModel):
    """Create consultation session request"""
    patient_id: str
    doctor_id: str
    chief_complaint: str
    session_type: str = "consultation"


class ConsultationSessionRead(CamelCaseModel):
    """Read consultation session response"""
    id: str
    session_id: str
    patient_id: str
    doctor_id: str
    chief_complaint: str
    session_type: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None


class ConsultationSessionUpdate(CamelCaseModel):
    """Update consultation session request"""
    chief_complaint: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class SessionStatusUpdate(CamelCaseModel):
    """Update session status"""
    status: str
    notes: Optional[str] = None


class SessionAudioUpload(CamelCaseModel):
    """Audio upload for session"""
    audio_url: str
    duration_seconds: Optional[int] = None


class ConsultationHistoryItem(CamelCaseModel):
    """Individual consultation in history list"""
    id: str
    session_id: str
    chief_complaint: str
    session_type: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    has_report: bool = False
    report_id: Optional[str] = None


class ConsultationDetailResponse(CamelCaseModel):
    """Detailed consultation response with all fields"""
    id: str
    session_id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    chief_complaint: str
    session_type: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    has_transcription: bool = False
    transcription_id: Optional[str] = None
    has_report: bool = False
    report_id: Optional[str] = None


class SessionSummaryResponse(CamelCaseModel):
    """Summary of a consultation session"""
    id: str
    session_id: str
    patient_id: str
    patient_name: str
    doctor_id: str
    chief_complaint: str
    session_type: str
    status: str
    created_at: datetime
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None


class StopConsultationRequest(CamelCaseModel):
    """Request to stop a consultation"""
    notes: Optional[str] = None


class StartConsultationResponse(CamelCaseModel):
    """Response after starting consultation"""
    session_id: str
    consultation_id: str
    patient_name: str
    started_at: datetime
    websocket_url: Optional[str] = None


class ConsultationHistoryResponse(CamelCaseModel):
    """Consultation history with patient info and camelCase fields"""
    patient_id: str
    patient_name: str
    total_consultations: int = 0
    items: list[ConsultationHistoryItem]
    pagination: dict