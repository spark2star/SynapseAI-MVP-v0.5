"""
Consultation session management endpoints.
Handles starting, stopping, and managing consultation sessions.
"""


import uuid
import logging
import os
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone


from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from pydantic import BaseModel, Field


from app.core.database import get_db
from app.core.pagination import paginate_query
from app.schemas.consultation import ConsultationResponse
from app.models.session import ConsultationSession, SessionStatus, SessionType, Transcription
from app.models.patient import Patient
from app.models.symptom import IntakePatient
from app.models.report import Report
from app.core.dependencies import get_current_user
from app.models.user import User
from app.services.mental_health_stt_service import mental_health_stt_service
from app.core.audit import audit_logger, AuditEventType
from app.schemas.consultation import (
    ConsultationHistoryResponse,
    ConsultationHistoryItem,
    ConsultationDetailResponse
)


router = APIRouter()
logger = logging.getLogger(__name__)


# WebSocket base URL - configurable for production
WS_BASE_URL = os.getenv("WS_BASE_URL", "ws://localhost:8000")
logger.info(f"🔗 WebSocket base URL: {WS_BASE_URL}")


# Validate WebSocket URL format
if not WS_BASE_URL.startswith(('ws://', 'wss://')):
    logger.warning(f"⚠️ Invalid WS_BASE_URL format: {WS_BASE_URL}")
    WS_BASE_URL = "ws://localhost:8000"
    logger.info(f"   Falling back to: {WS_BASE_URL}")


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
    
    Migration Note: Now uses IntakePatient instead of Patient model.
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        # Verify patient exists using IntakePatient
        patient = db.query(IntakePatient).filter(
            IntakePatient.id == request.patient_id
        ).first()
        
        if not patient:
            logger.warning(f"[{request_id}] Patient not found: {request.patient_id}")
            raise HTTPException(
                status_code=404,
                detail=f"Patient not found: {request.patient_id}"
            )
        
        # Verify doctor has access to this patient
        if str(patient.doctor_id) != current_user.id:
            logger.warning(
                f"[{request_id}] Access denied - Patient {patient.id} "
                f"belongs to doctor {patient.doctor_id}, not {current_user.id}"
            )
            raise HTTPException(
                status_code=403,
                detail="Access denied to this patient"
            )
        
        patient_name = patient.name
        
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
        
        # ✅ CRITICAL FIX: Add and commit IMMEDIATELY before any other operations
        db.add(consultation)
        db.commit()
        db.refresh(consultation)
        
        logger.info(f"✅ [{ request_id}] Consultation {session_id} committed to database successfully")
        
        # Initialize STT session if available (AFTER commit - can fail without affecting DB)
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
                # Don't fail the request if STT fails - session is already committed
        
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
                "consultation_id": str(consultation.id),
                "patient_name": patient_name,
                "started_at": consultation.started_at,
                "stt_session": stt_session_info,
                "websocket_url": f"{WS_BASE_URL}/ws/consultation/{session_id}"
            },
            "message": "Consultation session started successfully"
        }
        
    except HTTPException:
        # db.rollback()
        raise
    except Exception as e:
        # db.rollback()
        logger.error(f"Error starting consultation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start consultation: {str(e)}")



@router.get("/history/{patient_id}")
async def get_consultation_history(
    patient_id: str,
    limit: int = Query(20, ge=1, le=100, description="Number of consultations per page"),
    offset: int = Query(0, ge=0, description="Number of consultations to skip"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Fetch consultation history for a patient with pagination.
    Returns paginated list ordered by most recent first.
    
    Migration Note: Fetches patient info from IntakePatient table.
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(f"[{request_id}] Fetching consultation history for patient {patient_id}")
        
        # Verify patient exists and doctor has access
        patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id,
            # IntakePatient.doctor_id == current_user.id
        ).first()
        
        if not patient:
            raise HTTPException(
                status_code=404,
                detail="Patient not found or access denied"
            )
        
        # Build query
        query = db.query(ConsultationSession).filter(
            ConsultationSession.patient_id == patient_id
        ).order_by(ConsultationSession.created_at.desc())
        
        # Transform function for consultations - returns ConsultationResponse with auto camelCase
        def transform_consultation(consultation):
            # Check if transcription exists
            transcription = db.query(Transcription).filter(
                Transcription.session_id == consultation.session_id
            ).first()
            
            # ✅ CHECK IF REPORT EXISTS
            report = db.query(Report).filter(
                Report.session_id == str(consultation.id)
            ).first()
            
            # Calculate duration if ended
            duration_minutes = None
            if consultation.ended_at and consultation.started_at:
                try:
                    start = datetime.fromisoformat(str(consultation.started_at).replace('Z', '+00:00'))
                    end = datetime.fromisoformat(str(consultation.ended_at).replace('Z', '+00:00'))
                    duration_minutes = int((end - start).total_seconds() / 60)
                except:
                    duration_minutes = consultation.total_duration
            
            return ConsultationResponse(
                id=str(consultation.id),
                session_id=consultation.session_id,
                patient_id=str(consultation.patient_id) if consultation.patient_id else None,
                doctor_id=str(consultation.doctor_id) if consultation.doctor_id else None,
                created_at=consultation.created_at,
                started_at=consultation.started_at,
                ended_at=consultation.ended_at,
                duration_minutes=duration_minutes,
                chief_complaint=consultation.chief_complaint if consultation.chief_complaint else "Not specified",
                status=consultation.status,
                session_type=consultation.session_type,
                has_transcription=transcription is not None,
                has_report=report is not None,      # ✅ FIXED
                report_id=str(report.id) if report else None  # ✅ ADD THIS if ConsultationResponse has report_id field
            )
        
        # Use pagination helper
        result = paginate_query(query, limit, offset, transform_consultation)
        
        logger.info(
            f"[{request_id}] Retrieved {len(result['items'])} consultations "
            f"(Total: {result['pagination']['total']}, Page: {result['pagination']['current_page']}/{result['pagination']['total_pages']})"
        )
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient_id,
                "patient_name": patient.name,
                **result
            },
            "request_id": request_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching consultation history: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch consultation history: {str(e)}")



@router.get("/detail/{consultation_id}", response_model=ConsultationDetailResponse)
async def get_consultation_detail(
    consultation_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get detailed information about a specific consultation session.
    """
    try:
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.id == consultation_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation not found")
        
        return ConsultationDetailResponse(
            id=consultation.id,
            session_id=consultation.session_id,
            patient_id=consultation.patient_id,
            doctor_id=consultation.doctor_id,
            session_type=consultation.session_type,
            status=consultation.status,
            started_at=consultation.started_at,
            ended_at=consultation.ended_at,
            total_duration=consultation.total_duration,
            chief_complaint=consultation.chief_complaint,
            notes=consultation.notes,
            audio_quality_score=consultation.audio_quality_score,
            transcription_confidence=consultation.transcription_confidence,
            created_at=consultation.created_at,
            updated_at=consultation.updated_at
        )
        
    except HTTPException:
            raise
    except Exception as e:
        logger.error(f"Error fetching consultation detail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch consultation detail: {str(e)}")



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
        
        # Calculate duration (with type safety)
        if consultation.started_at:
            # Ensure started_at is datetime object
            if isinstance(consultation.started_at, str):
                from dateutil import parser
                started_at = parser.parse(consultation.started_at)
            else:
                started_at = consultation.started_at
            
            duration = consultation.ended_at - started_at
            consultation.total_duration = int(duration.total_seconds() / 60)
        
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
