"""
Consultation session management endpoints.
Handles starting, stopping, and managing consultation sessions.
"""

import uuid
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.session import ConsultationSession, SessionStatus, SessionType
from app.models.patient import Patient
from app.schemas.auth import get_current_user
from app.models.user import User
from app.services.mental_health_stt_service import mental_health_stt_service
from app.core.audit import audit_logger, AuditEventType

router = APIRouter()
logger = logging.getLogger(__name__)

class StartConsultationRequest(BaseModel):
    """Request model for starting a consultation session."""
    patient_id: str = Field(..., description="Patient ID")
    doctor_id: str = Field(..., description="Doctor ID")
    chief_complaint: str = Field(..., description="Primary reason for consultation")
    session_type: str = Field(default="consultation", description="Type of session")

class StopConsultationRequest(BaseModel):
    """Request model for stopping a consultation session."""
    notes: Optional[str] = Field(None, description="Session notes")

@router.post("/start")
async def start_consultation(
    request: StartConsultationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Start a new consultation session with live transcription.
    """
    try:
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Check if there's already an active session for this patient
        active_session = db.query(ConsultationSession).filter(
            ConsultationSession.patient_id == request.patient_id,
            ConsultationSession.status == SessionStatus.IN_PROGRESS.value
        ).first()
        
        if active_session:
            raise HTTPException(status_code=400, detail="Patient already has an active consultation session")
        
        # Generate unique session ID
        session_id = f"CS-{datetime.now().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"
        
        # Create consultation session
        consultation = ConsultationSession(
            session_id=session_id,
            patient_id=request.patient_id,
            doctor_id=request.doctor_id,
            session_type=request.session_type,
            status=SessionStatus.IN_PROGRESS.value,
            chief_complaint=request.chief_complaint,
            started_at=datetime.now(timezone.utc),
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        
        # Initialize STT session if available
        stt_session_info = None
        if mental_health_stt_service:
            try:
                stt_session_info = mental_health_stt_service.start_session(
                    session_id=session_id,
                    patient_id=request.patient_id
                )
                logger.info(f"STT session started for {session_id}")
            except Exception as e:
                logger.warning(f"Failed to start STT session: {str(e)}")
        
        # Log audit event
        background_tasks.add_task(
            audit_logger.log_event,
            event_type=AuditEventType.CONSULTATION_STARTED,
            user_id=current_user.id,
            resource_type="consultation_session",
            resource_id=consultation.id,
            details={
                "session_id": session_id,
                "patient_id": request.patient_id,
                "session_type": request.session_type,
                "stt_enabled": stt_session_info is not None
            }
        )
        
        return {
            "status": "success",
            "data": {
                "session_id": session_id,
                "consultation_id": consultation.id,
                "patient_name": patient.full_name,
                "started_at": consultation.started_at.isoformat(),
                "stt_session": stt_session_info,
                "websocket_url": f"ws://localhost:8000/ws/consultation/{session_id}"
            },
            "message": "Consultation session started successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start consultation: {str(e)}")

@router.post("/{session_id}/stop")
async def stop_consultation(
    session_id: str,
    request: StopConsultationRequest = None,
    background_tasks: BackgroundTasks = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Stop an active consultation session.
    """
    try:
        # Find consultation session
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation session not found")
        
        if consultation.status != SessionStatus.IN_PROGRESS.value:
            raise HTTPException(status_code=400, detail="Consultation session is not active")
        
        # Update consultation session
        consultation.status = SessionStatus.COMPLETED.value
        consultation.ended_at = datetime.now(timezone.utc)
        
        # Calculate duration
        if consultation.started_at:
            duration = consultation.ended_at - consultation.started_at
            consultation.total_duration = int(duration.total_seconds() / 60)  # Duration in minutes
        
        # Add notes if provided
        if request and request.notes:
            consultation.session_notes = request.notes
        
        db.commit()
        
        # End STT session if available
        stt_summary = None
        if mental_health_stt_service:
            try:
                stt_summary = mental_health_stt_service.end_session(session_id)
                logger.info(f"STT session ended for {session_id}")
            except Exception as e:
                logger.warning(f"Failed to end STT session: {str(e)}")
        
        # Log audit event
        if background_tasks:
            background_tasks.add_task(
                audit_logger.log_event,
                event_type=AuditEventType.CONSULTATION_COMPLETED,
                user_id=current_user.id,
                resource_type="consultation_session",
                resource_id=consultation.id,
                details={
                    "session_id": session_id,
                    "duration_minutes": consultation.total_duration,
                    "stt_summary": stt_summary
                }
            )
        
        return {
            "status": "success",
            "data": {
                "session_id": session_id,
                "ended_at": consultation.ended_at.isoformat(),
                "duration_minutes": consultation.total_duration,
                "stt_summary": stt_summary
            },
            "message": "Consultation session completed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to stop consultation: {str(e)}")

@router.get("/{session_id}/status")
async def get_consultation_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get the current status of a consultation session.
    """
    try:
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation session not found")
        
        # Get patient information
        patient = db.query(Patient).filter(Patient.id == consultation.patient_id).first()
        
        return {
            "status": "success",
            "data": {
                "session_id": session_id,
                "consultation_id": consultation.id,
                "status": consultation.status,
                "patient_name": patient.full_name if patient else "Unknown",
                "chief_complaint": consultation.chief_complaint,
                "started_at": consultation.started_at.isoformat() if consultation.started_at else None,
                "ended_at": consultation.ended_at.isoformat() if consultation.ended_at else None,
                "duration_minutes": consultation.total_duration,
                "session_type": consultation.session_type
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting consultation status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get consultation status: {str(e)}")

@router.get("/test")
async def test_stt_service():
    """
    Test endpoint to check STT service availability.
    """
    try:
        if not mental_health_stt_service:
            return {
                "status": "error",
                "message": "Mental Health STT service not available"
            }
        
        # Get supported languages
        languages = mental_health_stt_service.get_supported_languages()
        
        return {
            "status": "success",
            "data": {
                "stt_service": "available",
                "project_id": mental_health_stt_service.project_id,
                "supported_languages": languages,
                "active_sessions": len(mental_health_stt_service.active_sessions)
            },
            "message": "STT service is operational"
        }
        
    except Exception as e:
        logger.error(f"Error testing STT service: {str(e)}")
        return {
            "status": "error",
            "message": f"STT service test failed: {str(e)}"
        }


