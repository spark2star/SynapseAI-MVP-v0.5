"""
Report generation endpoints (DB-backed) and AI health check.
ENHANCED: Added /list and /stats endpoints for production-ready report management
Last Updated: 2025-10-04
"""

import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, HTTPException, Depends, status, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.core.database import get_db
from app.core.dependencies import require_doctor_or_admin
from app.core.security import get_current_user_id
from app.core.pagination import paginate_query
from app.schemas.report import ReportResponse, ReportDetailResponse, DiagnosisItem, MedicationItem, RecommendationItem
from app.models.user import User
from app.models.session import Transcription, TranscriptionStatus, ConsultationSession
from app.models.report import Report
from app.models.symptom import IntakePatient
from app.services.session_service import SessionService
from app.services.report_service import ReportService
from app.services.gemini_service import gemini_service
from app.core.exceptions import SynapseAIException

router = APIRouter()
logger = logging.getLogger(__name__)


class ReportGenerationRequest(BaseModel):
    session_id: str
    transcription: Optional[str] = Field(default=None, description="Transcript text (if no completed transcription exists)")
    session_type: str = Field(default="follow_up", description="Type of session (new_patient, follow_up)")
    medication_plan: Optional[list[dict]] = Field(default=None, description="Optional medication plan to store")
    additional_notes: Optional[str] = None


@router.post("/generate-session")
async def generate_report_db_backed(
    request: ReportGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Persist a Report linked to the given session and (if needed) create a Transcription.
    Returns an accepted response with the database report_id for async generation.
    """
    try:
        # Validate and load session (ensures ownership)
        session_obj = SessionService.get_session_by_id(
            db=db,
            session_id=request.session_id,
            doctor_id=current_user.id
        )

        # Find completed transcription for the session
        transcription = db.query(Transcription).filter(
            Transcription.session_id == session_obj.id,
            Transcription.processing_status == TranscriptionStatus.COMPLETED.value
        ).first()

        # If none and a transcript was provided, create a completed transcription entry
        if not transcription:
            if not (request.transcription and request.transcription.strip()):
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No completed transcription found and no transcript provided")

            transcription = Transcription(
                session_id=session_obj.id,
                transcript_text=request.transcription,
                original_transcript=request.transcription,
                processing_status=TranscriptionStatus.COMPLETED.value,
                processing_started_at=datetime.now(timezone.utc).isoformat(),
                processing_completed_at=datetime.now(timezone.utc).isoformat()
            )
            db.add(transcription)
            db.commit()
            db.refresh(transcription)

        # Create report row (PENDING)
        report = ReportService.create_report(
            db=db,
            session_id=session_obj.id,
            transcription_id=transcription.id,
            doctor_id=current_user.id,
            report_type="consultation"
        )

        # Optionally stash meds/notes into structured_data
        if request.medication_plan or request.additional_notes:
            ReportService.update_report(
                db=db,
                report_id=report.id,
                doctor_id=current_user.id,
                structured_data={
                    "medication_plan": request.medication_plan or [],
                    "additional_notes": request.additional_notes or "",
                    "session_type": request.session_type,
                },
                status="pending"
            )

        # TODO: trigger async AI generation task; for now just acknowledge
        return {
            "status": "accepted",
            "data": {
                "report_id": report.id,
                "session_id": request.session_id
            }
        }

    except SynapseAIException as e:
        # Let custom exception handlers format the response
        db.rollback()
        raise e
    except HTTPException:
        # Propagate FastAPI HTTP errors
        db.rollback()
        raise
    except Exception as e:
        logger.exception("Report generation persistence error")
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to create report")


@router.post("/generate")
async def generate_report(
    report_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Generate AI report from transcript and return the generated content.
    This is a direct generation endpoint (does not persist to DB automatically).
    
    Expected payload:
    {
      "transcription": "transcript text",
      "session_id": "uuid",
      "patient_id": "uuid",
      "session_type": "follow_up" | "new_patient"
    }
    """
    try:
        import traceback
        
        # Validate required fields
        if not report_data.get('transcription'):
            raise HTTPException(status_code=400, detail="Missing required field: transcription")
        
        session_type = report_data.get('session_type', 'follow_up')
        transcription = report_data.get('transcription')
        
        logger.info(f"🤖 Generating {session_type} report from transcript ({len(transcription)} chars)")
        
        # Generate report using Gemini service
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure Gemini API key."
            )
        
        report_result = await gemini_service.generate_medical_report(
            transcription=transcription,
            session_type=session_type
        )
        
        if report_result.get('status') == 'error':
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {report_result.get('error')}"
            )
        
        logger.info(f"✅ Report generated successfully using {report_result.get('model_used')}")
        
        return {
            "status": "success",
            "data": {
                "report": report_result.get('report'),
                "model_used": report_result.get('model_used'),
                "session_type": report_result.get('session_type'),
                "transcription_length": report_result.get('transcription_length'),
                "generated_at": report_result.get('generated_at')
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Report generation error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate report: {str(e)}"
        )


@router.post("/save")
async def save_report(
    report_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Save generated report to database.
    
    Expected payload:
    {
      "session_id": "uuid",
      "patient_id": "uuid",
      "generated_content": "report markdown text",
      "report_type": "follow_up" | "new_patient",
      "status": "DRAFT" | "COMPLETED",
      "medication_plan": [...]  # optional
    }
    """
    try:
        import traceback
        from datetime import datetime
        
        # Validate required fields
        required_fields = ['session_id', 'patient_id', 'generated_content']
        for field in required_fields:
            if not report_data.get(field):
                raise HTTPException(
                    status_code=400,
                    detail=f"Missing required field: {field}"
                )
        
        session_id = report_data.get('session_id')
        patient_id = report_data.get('patient_id')
        
        # Verify session exists and belongs to current user
        session_obj = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id,
            ConsultationSession.doctor_id == current_user.id
        ).first()
        
        if not session_obj:
            raise HTTPException(
                status_code=404,
                detail="Session not found or access denied"
            )
        
        # Get or create transcription for this session
        transcription = db.query(Transcription).filter(
            Transcription.session_id == session_obj.id
        ).first()
        
        if not transcription:
            # Create a transcription record if none exists
            transcription = Transcription(
                session_id=session_obj.id,
                transcript_text="",
                processing_status=TranscriptionStatus.COMPLETED.value,
                processing_completed_at=datetime.now(timezone.utc).isoformat()
            )
            db.add(transcription)
            db.commit()
            db.refresh(transcription)
        
        # Create report record
        report = Report(
            id=str(uuid.uuid4()),
            session_id=session_obj.id,
            transcription_id=transcription.id,
            generated_content=report_data.get('generated_content'),
            report_type=report_data.get('report_type', 'consultation'),
            status=report_data.get('status', 'completed'),
            patient_status=report_data.get('patient_status'),
            ai_model="gemini-2.5-flash",
            structured_data={
                'medication_plan': report_data.get('medication_plan', []),
                'additional_notes': report_data.get('additional_notes', ''),
                'session_type': report_data.get('report_type', 'follow_up')
            },
            generation_started_at=datetime.now(timezone.utc).isoformat(),
            generation_completed_at=datetime.now(timezone.utc).isoformat(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc)
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"✅ Report saved successfully: {report.id} for patient {patient_id}")
        
        return {
            "status": "success",
            "message": "Report saved successfully",
            "data": {
                "report": {
                    "id": report.id,
                    "session_id": session_id,
                    "patient_id": patient_id,
                    "report_type": report.report_type,
                    "status": report.status,
                    "generated_at": report.generation_completed_at,
                    "created_at": report.created_at.isoformat() if report.created_at else None
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Report save error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save report: {str(e)}"
        )


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


# ============================================================================
# REPORT LIST ENDPOINT (P0-2 - PRODUCTION READY)
# ============================================================================

@router.get("/list")
async def list_reports(
    patient_id: Optional[str] = Query(None, description="Filter by patient ID"),
    status_filter: Optional[str] = Query(
        None,
        alias="status",
        description="Filter by status",
        pattern="^(pending|generating|completed|failed)$"
    ),
    session_type: Optional[str] = Query(None, description="Filter by session type"),
    date_from: Optional[str] = Query(
        None,
        description="Filter reports created after this date (ISO format: YYYY-MM-DDTHH:MM:SSZ)"
    ),
    date_to: Optional[str] = Query(
        None,
        description="Filter reports created before this date (ISO format: YYYY-MM-DDTHH:MM:SSZ)"
    ),
    limit: int = Query(20, le=100, ge=1, description="Number of reports to return"),
    offset: int = Query(0, ge=0, description="Number of reports to skip"),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all reports for the current doctor with optional filters and pagination.
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(
            f"[{request_id}] Report list request - Doctor: {current_user_id}, "
            f"Filters: patient={patient_id}, status={status_filter}, session_type={session_type}"
        )
        
        # Base query - join with consultation_sessions to filter by doctor
        query = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).options(
            joinedload(Report.session)
        ).filter(
            ConsultationSession.doctor_id == current_user_id
        )
        
        # Apply filters
        if patient_id:
            query = query.filter(ConsultationSession.patient_id == patient_id)
        
        if status_filter:
            query = query.filter(Report.status == status_filter)
        
        if session_type:
            query = query.filter(ConsultationSession.session_type == session_type)
        
        if date_from:
            try:
                date_from_obj = datetime.fromisoformat(date_from.replace('Z', '+00:00'))
                query = query.filter(Report.created_at >= date_from_obj)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid date_from format: {str(e)}")
        
        if date_to:
            try:
                date_to_obj = datetime.fromisoformat(date_to.replace('Z', '+00:00'))
                query = query.filter(Report.created_at <= date_to_obj)
            except ValueError as e:
                raise HTTPException(status_code=400, detail=f"Invalid date_to format: {str(e)}")
        
        # Apply ordering
        query = query.order_by(Report.created_at.desc())
        
        # Transform function for reports - returns ReportResponse with auto camelCase
        def transform_report(report):
            session = report.session
            
            # Fetch patient info
            patient = db.query(IntakePatient).filter(
                IntakePatient.id == session.patient_id
            ).first()
            
            return ReportResponse(
                id=str(report.id),
                session_id=str(report.session_id),
                session_identifier=session.session_id,
                patient_id=str(session.patient_id),
                patient_name=patient.name if patient else "Unknown Patient",
                patient_age=patient.age if patient else None,
                patient_sex=patient.sex if patient else None,
                created_at=report.created_at if report.created_at else datetime.utcnow(),
                updated_at=report.updated_at,
                status=report.status,
                report_type=report.report_type,
                ai_model=report.ai_model,
                confidence_score=float(report.confidence_score) if report.confidence_score else None,
                generation_duration=report.generation_duration,
                session_type=session.session_type,
                chief_complaint=session.chief_complaint,
                session_started_at=session.started_at,
                session_ended_at=session.ended_at,
                session_duration=session.total_duration,
                has_been_signed=report.signed_by is not None,
                signed_at=report.signed_at
            )
        
        # Use pagination helper
        result = paginate_query(query, limit, offset, transform_report)
        
        logger.info(
            f"[{request_id}] SUCCESS - Returned {len(result['items'])} reports "
            f"(Total: {result['pagination']['total']}, Page: {result['pagination']['current_page']}/{result['pagination']['total_pages']})"
        )
        
        return {
            "status": "success",
            "data": {
                **result,
                "filters_applied": {
                    "patient_id": patient_id,
                    "status": status_filter,
                    "session_type": session_type,
                    "date_from": date_from,
                    "date_to": date_to
                }
            },
            "request_id": request_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"[{request_id}] ERROR listing reports: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to retrieve report list", "request_id": request_id}
        )


# ============================================================================
# REPORT STATS ENDPOINT (BONUS - FOR DASHBOARD)
# ============================================================================

@router.get("/stats")
async def get_report_stats(
    patient_id: Optional[str] = Query(None, description="Filter stats by patient ID"),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """Get report statistics for dashboard."""
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(f"[{request_id}] Report stats request - Doctor: {current_user_id}")
        
        # Base query
        query = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).filter(
            ConsultationSession.doctor_id == current_user_id
        )
        
        if patient_id:
            query = query.filter(ConsultationSession.patient_id == patient_id)
        
        # Get counts by status
        total_reports = query.count()
        completed = query.filter(Report.status == "completed").count()
        pending = query.filter(Report.status == "pending").count()
        generating = query.filter(Report.status == "generating").count()
        failed = query.filter(Report.status == "failed").count()
        
        # Get recent reports (last 7 days)
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_reports = query.filter(Report.created_at >= seven_days_ago).count()
        
        # Average confidence score
        avg_confidence = db.query(func.avg(Report.confidence_score)).join(
            ConsultationSession
        ).filter(
            ConsultationSession.doctor_id == current_user_id,
            Report.status == "completed",
            Report.confidence_score.isnot(None)
        )
        
        if patient_id:
            avg_confidence = avg_confidence.filter(ConsultationSession.patient_id == patient_id)
        
        avg_confidence_value = avg_confidence.scalar() or 0.0
        
        logger.info(f"[{request_id}] SUCCESS - Stats: Total={total_reports}, Recent={recent_reports}")
        
        return {
            "status": "success",
            "data": {
                "total_reports": total_reports,
                "by_status": {
                    "completed": completed,
                    "pending": pending,
                    "generating": generating,
                    "failed": failed
                },
                "recent_reports": recent_reports,
                "average_confidence": round(float(avg_confidence_value), 2)
            },
            "request_id": request_id
        }
    
    except Exception as e:
        logger.error(f"[{request_id}] ERROR getting report stats: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to retrieve report statistics", "request_id": request_id}
        )


# ============================================================================
# REPORT DETAIL ENDPOINT (P1-2 - GET FULL REPORT)
# IMPORTANT: This must be AFTER /list and /stats to avoid route conflicts
# ============================================================================

@router.get("/{report_id}")
async def get_report_detail(
    report_id: str,
    include_transcription: bool = Query(True, description="Include full transcription"),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get complete report details by ID.
    
    Includes:
    - All report sections
    - Patient demographics
    - Session information
    - Diagnoses, medications, recommendations
    - Transcription (optional)
    - Signature information
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(
            f"[{request_id}] Fetching report detail - Report: {report_id}, "
            f"User: {current_user_id}, Include transcription: {include_transcription}"
        )
        
        # Get report with all relationships
        report = db.query(Report)\
            .options(
                joinedload(Report.session),
                joinedload(Report.transcription)
            )\
            .filter(Report.id == report_id)\
            .first()
        
        if not report:
            logger.warning(
                f"[{request_id}] Report not found - Report: {report_id}, User: {current_user_id}"
            )
            raise HTTPException(status_code=404, detail="Report not found")
        
        # Verify access - must be doctor of this session
        if str(report.session.doctor_id) != current_user_id:
            logger.warning(
                f"[{request_id}] Unauthorized report access attempt - "
                f"Report: {report_id}, User: {current_user_id}, Owner: {report.session.doctor_id}"
            )
            raise HTTPException(status_code=403, detail="Access denied to this report")
        
        # Get patient information
        patient = db.query(IntakePatient).filter(
            IntakePatient.id == report.session.patient_id
        ).first()
        
        if not patient:
            logger.error(
                f"[{request_id}] Patient not found for report - "
                f"Report: {report_id}, Patient: {report.session.patient_id}"
            )
            raise HTTPException(status_code=500, detail="Patient data not found")
        
        # Parse structured data from report
        structured_data = report.structured_data or {}
        
        # Build diagnoses list
        diagnoses = [
            DiagnosisItem(
                diagnosis=d.get('diagnosis', ''),
                icd_code=d.get('icd_code'),
                severity=d.get('severity'),
                notes=d.get('notes')
            )
            for d in structured_data.get('diagnoses', [])
        ]
        
        # Build medication plan
        medications = [
            MedicationItem(
                drug_name=m.get('drug_name', ''),
                dosage=m.get('dosage', ''),
                frequency=m.get('frequency', ''),
                duration=m.get('duration', ''),
                instructions=m.get('instructions')
            )
            for m in structured_data.get('medication_plan', [])
        ]
        
        # Build recommendations
        recommendations = [
            RecommendationItem(
                category=r.get('category', ''),
                recommendation=r.get('recommendation', ''),
                priority=r.get('priority')
            )
            for r in structured_data.get('recommendations', [])
        ]
        
        # Get signature information
        signature_user = None
        if report.signed_by:
            signature_user = db.query(User).filter(
                User.id == report.signed_by
            ).first()
        
        # Build response
        response_data = ReportDetailResponse(
            # Metadata
            id=str(report.id),
            session_id=str(report.session_id),
            session_identifier=report.session.session_id,
            status=report.status,
            created_at=report.created_at if report.created_at else datetime.utcnow(),
            updated_at=report.updated_at if report.updated_at else datetime.utcnow(),
            
            # Patient info
            patient_id=str(patient.id),
            patient_name=patient.name,
            patient_age=patient.age,
            patient_sex=patient.sex,
            
            # Session info
            consultation_date=report.session.started_at or report.session.created_at,
            chief_complaint=report.session.chief_complaint,
            session_type=report.session.session_type,
            session_duration=report.session.total_duration,
            
            # Report content
            report_type=report.report_type,
            generated_content=report.generated_content or "",
            
            # Structured data
            diagnoses=diagnoses,
            medication_plan=medications,
            recommendations=recommendations,
            follow_up_plan=structured_data.get('follow_up_plan'),
            additional_notes=structured_data.get('additional_notes'),
            
            # AI info
            ai_model=report.ai_model or "gemini-1.5-flash",
            confidence_score=float(report.confidence_score) if report.confidence_score else None,
            generation_duration=report.generation_duration,
            
            # Signature
            signed_by=signature_user.email if signature_user else None,
            signed_at=report.signed_at,
            # signature_data=report.signature_data,  # TODO: Fix - field does not exist
            
            # Transcription
            transcription_id=str(report.transcription_id) if report.transcription_id else None,
            transcription_text=report.transcription.transcript_text if include_transcription and report.transcription else None
        )
        
        logger.info(
            f"[{request_id}] SUCCESS - Report detail retrieved - "
            f"Report: {report_id}, Diagnoses: {len(diagnoses)}, Medications: {len(medications)}"
        )
        
        return {
            "status": "success",
            "data": response_data.dict(),
            "request_id": request_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[{request_id}] ERROR retrieving report detail - Report: {report_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={"message": "Failed to retrieve report", "request_id": request_id}
        )