"""
Consultation session API endpoints.
Handles session lifecycle management, audio upload, and transcription.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_doctor_or_admin, PaginationParams
from app.models.user import User
from app.schemas.consultation import (
    ConsultationSessionCreate,
    ConsultationSessionRead,
    ConsultationSessionUpdate,
    SessionStatusUpdate,
    SessionAudioUpload,
    SessionSummaryResponse
)
from app.services.session_service import SessionService
from app.services.report_service import ReportService

router = APIRouter()


@router.post("/", response_model=ConsultationSessionRead, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: ConsultationSessionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Start a new consultation session.
    
    - Creates a new session with status IN_PROGRESS
    - Generates unique session_id
    - Records start timestamp
    - Links to patient and doctor
    
    **Requires:** Doctor or Admin role
    """
    session = SessionService.create_session(
        db=db,
        patient_id=session_data.patient_id,
        doctor_id=current_user.id,
        session_type=session_data.session_type,
        chief_complaint=session_data.chief_complaint,
        notes=session_data.notes,
        recording_settings=session_data.recording_settings,
        stt_settings=session_data.stt_settings
    )
    
    return session


@router.get("/", response_model=List[SessionSummaryResponse])
async def list_sessions(
    pagination: PaginationParams = Depends(),
    status_filter: Optional[str] = Query(None, description="Filter by session status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    List all consultation sessions for current doctor.
    
    - Returns sessions in reverse chronological order
    - Supports pagination
    - Can filter by status
    
    **Requires:** Doctor or Admin role
    """
    sessions = SessionService.list_sessions_by_doctor(
        db=db,
        doctor_id=current_user.id,
        skip=pagination.skip,
        limit=pagination.limit,
        status=status_filter
    )
    
    return sessions


@router.get("/{session_id}", response_model=ConsultationSessionRead)
async def get_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Get consultation session details.
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only session owner can access
    """
    session = SessionService.get_session_by_id(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id
    )
    
    return session


@router.put("/{session_id}", response_model=ConsultationSessionRead)
async def update_session(
    session_id: str,
    session_data: ConsultationSessionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Update consultation session information.
    
    - Supports partial updates
    - All fields are optional
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only session owner can update
    """
    update_dict = session_data.model_dump(exclude_unset=True)
    
    session = SessionService.update_session(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id,
        **update_dict
    )
    
    return session


@router.post("/{session_id}/pause")
async def pause_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Pause an in-progress session.
    
    - Changes status from IN_PROGRESS to PAUSED
    - Records pause timestamp
    
    **Requires:** Doctor or Admin role
    **Precondition:** Session must be IN_PROGRESS
    """
    session = SessionService.pause_session(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id
    )
    
    return {
        "message": "Session paused successfully",
        "session_id": session.session_id,
        "status": session.status
    }


@router.post("/{session_id}/resume")
async def resume_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Resume a paused session.
    
    - Changes status from PAUSED to IN_PROGRESS
    - Records resume timestamp
    
    **Requires:** Doctor or Admin role
    **Precondition:** Session must be PAUSED
    """
    session = SessionService.resume_session(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id
    )
    
    return {
        "message": "Session resumed successfully",
        "session_id": session.session_id,
        "status": session.status
    }


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Complete a consultation session.
    
    - Changes status to COMPLETED
    - Calculates total duration
    - Records end timestamp
    - Triggers transcription processing (if audio uploaded)
    
    **Requires:** Doctor or Admin role
    **Precondition:** Session must be IN_PROGRESS or PAUSED
    """
    session = SessionService.complete_session(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id
    )
    
    return {
        "message": "Session completed successfully",
        "session_id": session.session_id,
        "status": session.status,
        "duration_minutes": session.total_duration
    }


@router.post("/{session_id}/cancel")
async def cancel_session(
    session_id: str,
    reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Cancel a consultation session.
    
    - Changes status to CANCELLED
    - Records cancellation reason
    
    **Requires:** Doctor or Admin role
    """
    session = SessionService.cancel_session(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id,
        reason=reason
    )
    
    return {
        "message": "Session cancelled successfully",
        "session_id": session.session_id,
        "status": session.status
    }


@router.post("/{session_id}/audio")
async def upload_audio(
    session_id: str,
    audio_data: SessionAudioUpload,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Update session with audio file information.
    
    - Stores audio file URL and metadata
    - Audio file should be uploaded to cloud storage first
    - Triggers transcription processing
    
    **Requires:** Doctor or Admin role
    **Note:** Actual file upload is handled by separate cloud storage service
    """
    session = SessionService.upload_audio(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id,
        audio_file_url=audio_data.audio_file_url,
        audio_file_size=audio_data.audio_file_size,
        audio_format=audio_data.audio_format,
        audio_duration=audio_data.audio_duration
    )
    
    return {
        "message": "Audio uploaded successfully",
        "session_id": session.session_id,
        "audio_url": session.audio_file_url
    }


@router.post("/{session_id}/generate-report")
async def generate_report(
    session_id: str,
    template_id: Optional[str] = None,
    report_type: str = "consultation",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Generate AI medical report from session transcription.
    
    - Requires completed transcription
    - Uses specified template or default template
    - Creates Report entity with status PENDING
    - Triggers async AI report generation
    
    **Requires:** Doctor or Admin role
    **Precondition:** Session must have completed transcription
    """
    # Get session
    session = SessionService.get_session_by_id(
        db=db,
        session_id=session_id,
        doctor_id=current_user.id
    )
    
    # Get transcription
    from app.models.session import Transcription, TranscriptionStatus
    transcription = db.query(Transcription).filter(
        Transcription.session_id == session.id,
        Transcription.processing_status == TranscriptionStatus.COMPLETED.value
    ).first()
    
    if not transcription:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No completed transcription found for this session"
        )
    
    # Create report
    report = ReportService.create_report(
        db=db,
        session_id=session.id,
        transcription_id=transcription.id,
        doctor_id=current_user.id,
        report_type=report_type,
        template_id=template_id
    )
    
    # TODO: Trigger async AI generation task
    
    return {
        "message": "Report generation started",
        "report_id": report.id,
        "status": report.status
    }


@router.get("/patient/{patient_id}/sessions", response_model=List[SessionSummaryResponse])
async def list_patient_sessions(
    patient_id: str,
    pagination: PaginationParams = Depends(),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    List all sessions for a specific patient.
    
    - Returns sessions in reverse chronological order
    - Only shows sessions for current doctor
    
    **Requires:** Doctor or Admin role
    **Access Control:** Only patient's doctor can view
    """
    sessions = SessionService.list_sessions_by_patient(
        db=db,
        patient_id=patient_id,
        doctor_id=current_user.id,
        skip=pagination.skip,
        limit=pagination.limit
    )
    
    return sessions
