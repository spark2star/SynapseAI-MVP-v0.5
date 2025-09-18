"""
Medical report generation endpoints powered by Gemini AI.
Handles AI-driven clinical insights and automated documentation.
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.session import ConsultationSession, Transcription
from app.models.patient import Patient
from app.models.report import Report, ReportType
from app.services.gemini_service import gemini_service
from app.core.audit import audit_logger, AuditEventType
from app.schemas.auth import get_current_user
from app.models.user import User

router = APIRouter()
logger = logging.getLogger(__name__)

class ReportGenerationRequest(BaseModel):
    """Request model for AI report generation."""
    session_id: str = Field(..., description="Consultation session ID")
    report_type: str = Field(default="consultation", description="Type of report to generate")
    include_insights: bool = Field(default=True, description="Include AI clinical insights")

class ClinicalInsightsRequest(BaseModel):
    """Request model for clinical insights generation."""
    transcription_text: str = Field(..., description="Consultation transcription text")
    patient_id: Optional[str] = Field(None, description="Patient ID for context")

class LiveInsightsRequest(BaseModel):
    """Request model for live insights generation during active sessions."""
    transcription_text: str = Field(..., description="Current transcription text")
    patient_id: Optional[str] = Field(None, description="Patient ID for context")
    session_id: str = Field(..., description="Active session ID")
    is_partial: bool = Field(default=True, description="Whether this is partial analysis")

class PatientSummaryRequest(BaseModel):
    """Request model for patient history summary."""
    patient_id: str = Field(..., description="Patient ID")
    include_recent_only: bool = Field(default=False, description="Include only recent sessions")

@router.post("/generate")
async def generate_medical_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered medical report from consultation session.
    """
    try:
        # Verify consultation session exists
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == request.session_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation session not found")
        
        # Get transcription text
        transcriptions = db.query(Transcription).filter(
            Transcription.session_id == consultation.id
        ).all()
        
        if not transcriptions:
            raise HTTPException(status_code=400, detail="No transcription available for this session")
        
        # Combine all transcription text
        full_transcription = " ".join([t.transcript_text for t in transcriptions])
        
        # Check if Gemini service is available
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        # Generate medical report using Gemini
        report_result = await gemini_service.generate_medical_report(
            consultation_session=consultation,
            transcription_text=full_transcription,
            report_type=request.report_type
        )
        
        if report_result["status"] != "success":
            raise HTTPException(status_code=500, detail=f"Report generation failed: {report_result.get('error')}")
        
        # Generate clinical insights if requested
        insights_result = None
        if request.include_insights:
            insights_result = await gemini_service.generate_clinical_insights(
                transcription_text=full_transcription
            )
        
        # Log audit event
        background_tasks.add_task(
            audit_logger.log_event,
            event_type=AuditEventType.REPORT_GENERATED,
            user_id=current_user.id,
            resource_type="consultation_session",
            resource_id=consultation.id,
            details={
                "report_type": request.report_type,
                "ai_generated": True,
                "model_used": "gemini-2.5-flash",
                "session_id": request.session_id
            }
        )
        
        return {
            "status": "success",
            "data": {
                "session_id": request.session_id,
                "report": report_result["report"],
                "insights": insights_result.get("insights") if insights_result else None,
                "metadata": {
                    "generated_at": report_result["generated_at"],
                    "model_used": report_result["model_used"],
                    "confidence": report_result.get("confidence", 0.95),
                    "report_type": request.report_type
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/insights")
async def generate_clinical_insights(
    request: ClinicalInsightsRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate AI-powered clinical insights from transcription.
    """
    try:
        # Check if Gemini service is available
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        # Get patient history if patient_id provided
        patient_history = None
        if request.patient_id:
            patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
            if patient:
                patient_history = f"Medical History: {patient.medical_history or 'None recorded'}\nAllergies: {patient.allergies or 'None known'}"
        
        # Generate clinical insights
        insights_result = await gemini_service.generate_clinical_insights(
            transcription_text=request.transcription_text,
            patient_history=patient_history
        )
        
        if insights_result["status"] != "success":
            raise HTTPException(status_code=500, detail=f"Insights generation failed: {insights_result.get('error')}")
        
        # Log audit event
        background_tasks.add_task(
            audit_logger.log_event,
            event_type=AuditEventType.AI_ANALYSIS_PERFORMED,
            user_id=current_user.id,
            resource_type="transcription",
            resource_id=request.patient_id or "unknown",
            details={
                "analysis_type": "clinical_insights",
                "model_used": "gemini-2.5-flash",
                "text_length": len(request.transcription_text)
            }
        )
        
        return {
            "status": "success",
            "data": {
                "insights": insights_result["insights"],
                "metadata": {
                    "generated_at": insights_result["generated_at"],
                    "model_used": "gemini-2.5-flash",
                    "analysis_type": "clinical_insights"
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.post("/live-insights")
async def generate_live_insights(
    request: LiveInsightsRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate live AI insights during active consultation sessions.
    Optimized for real-time partial analysis.
    """
    try:
        # Validate minimum text length for meaningful analysis
        if len(request.transcription_text.strip()) < 50:
            return {
                "status": "success",
                "data": {
                    "insights": {
                        "key_clinical_findings": [],
                        "treatment_recommendations": [],
                        "confidence": 0.0
                    },
                    "message": "Insufficient text for analysis"
                }
            }
        
        # Check if Gemini service is available
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        # Get patient context if available
        patient_context = None
        if request.patient_id:
            patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
            if patient:
                patient_context = {
                    "medical_history": patient.medical_history,
                    "allergies": patient.allergies,
                    "age": patient.age,
                    "gender": patient.gender
                }
        
        # Generate live insights with reduced complexity for speed
        insights_result = await gemini_service.generate_live_insights(
            transcription_text=request.transcription_text,
            patient_context=patient_context,
            is_partial=request.is_partial
        )
        
        if insights_result["status"] != "success":
            # Don't raise error for live insights, just log and return empty
            logger.warning(f"Live insights generation failed: {insights_result.get('error')}")
            return {
                "status": "success",
                "data": {
                    "insights": {
                        "key_clinical_findings": [],
                        "treatment_recommendations": [],
                        "confidence": 0.0
                    },
                    "message": "Analysis temporarily unavailable"
                }
            }
        
        # Log audit event (non-blocking)
        background_tasks.add_task(
            audit_logger.log_event,
            event_type=AuditEventType.AI_ANALYSIS_PERFORMED,
            user_id=current_user.id,
            resource_type="live_session",
            resource_id=request.session_id,
            details={
                "analysis_type": "live_insights",
                "model_used": "gemini-2.5-flash",
                "text_length": len(request.transcription_text),
                "is_partial": request.is_partial
            }
        )
        
        return {
            "status": "success",
            "data": {
                "insights": insights_result["insights"],
                "metadata": {
                    "generated_at": insights_result["generated_at"],
                    "model_used": "gemini-2.5-flash",
                    "analysis_type": "live_insights",
                    "is_partial": request.is_partial,
                    "session_id": request.session_id
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        # For live insights, don't raise errors - just return empty results
        logger.error(f"Live insights error: {str(e)}")
        return {
            "status": "success", 
            "data": {
                "insights": {
                    "key_clinical_findings": [],
                    "treatment_recommendations": [],
                    "confidence": 0.0
                },
                "error": "Analysis failed"
            }
        }

@router.post("/patient-summary")
async def generate_patient_summary(
    request: PatientSummaryRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive patient history summary using AI.
    """
    try:
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == request.patient_id).first()
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Get consultation sessions
        query = db.query(ConsultationSession).filter(
            ConsultationSession.patient_id == request.patient_id
        )
        
        if request.include_recent_only:
            # Get sessions from last 6 months
            from datetime import timedelta
            six_months_ago = datetime.now(timezone.utc) - timedelta(days=180)
            query = query.filter(ConsultationSession.created_at >= six_months_ago)
        
        consultation_sessions = query.order_by(ConsultationSession.created_at.desc()).all()
        
        if not consultation_sessions:
            raise HTTPException(status_code=400, detail="No consultation sessions found for this patient")
        
        # Check if Gemini service is available
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        # Generate patient summary
        summary_result = await gemini_service.summarize_patient_history(consultation_sessions)
        
        if summary_result["status"] != "success":
            raise HTTPException(status_code=500, detail=f"Summary generation failed: {summary_result.get('error')}")
        
        # Log audit event
        background_tasks.add_task(
            audit_logger.log_event,
            event_type=AuditEventType.PATIENT_SUMMARY_GENERATED,
            user_id=current_user.id,
            resource_type="patient",
            resource_id=request.patient_id,
            details={
                "summary_type": "ai_generated",
                "sessions_analyzed": summary_result["sessions_analyzed"],
                "model_used": "gemini-2.5-flash",
                "recent_only": request.include_recent_only
            }
        )
        
        return {
            "status": "success",
            "data": {
                "patient_id": request.patient_id,
                "summary": summary_result["summary"],
                "metadata": {
                    "generated_at": summary_result["generated_at"],
                    "sessions_analyzed": summary_result["sessions_analyzed"],
                    "model_used": "gemini-2.5-flash",
                    "recent_only": request.include_recent_only
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/session/{session_id}/transcription")
async def get_session_transcription(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get formatted transcription for a consultation session.
    """
    try:
        # Find consultation session
        consultation = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id
        ).first()
        
        if not consultation:
            raise HTTPException(status_code=404, detail="Consultation session not found")
        
        # Get transcriptions
        transcriptions = db.query(Transcription).filter(
            Transcription.session_id == consultation.id
        ).order_by(Transcription.created_at).all()
        
        if not transcriptions:
            raise HTTPException(status_code=404, detail="No transcription found for this session")
        
        # Format transcription data
        formatted_transcription = {
            "session_id": session_id,
            "total_segments": len(transcriptions),
            "full_text": " ".join([t.transcript_text for t in transcriptions]),
            "segments": [
                {
                    "id": t.id,
                    "text": t.transcript_text,
                    "confidence": t.confidence_score,
                    "timestamp": t.created_at.isoformat() if t.created_at else None,
                    "word_count": t.word_count
                }
                for t in transcriptions
            ],
            "metadata": {
                "session_type": consultation.session_type,
                "started_at": consultation.started_at,
                "duration_minutes": consultation.total_duration,
                "chief_complaint": consultation.chief_complaint
            }
        }
        
        return {
            "status": "success",
            "data": formatted_transcription
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/health")
async def health_check():
    """Check health of AI services."""
    gemini_status = "available" if gemini_service else "unavailable"
    
    return {
        "status": "success",
        "data": {
            "gemini_service": gemini_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0"
        }
    }
