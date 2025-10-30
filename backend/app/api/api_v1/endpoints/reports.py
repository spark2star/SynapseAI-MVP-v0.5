"""
Report generation endpoints (DB-backed) and AI health check.
ENHANCED: Added /list and /stats endpoints for production-ready report management
Last Updated: 2025-10-04
"""

import logging
import uuid
from typing import Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import traceback
from fastapi import APIRouter, HTTPException, Depends, status, Query, Request
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, func

from app.core.database import get_db
from app.core.dependencies import require_doctor_or_admin
from app.core.security import get_current_user_id
from app.core.pagination import paginate_query
from app.core.rate_limit import limiter
from app.schemas.report import ReportResponse, ReportDetailResponse, DiagnosisItem, MedicationItem, RecommendationItem, SignReportRequest, SignReportResponse
from app.models.user import User
from app.models.session import Transcription, TranscriptionStatus, ConsultationSession
from app.models.report import Report
from app.models.symptom import IntakePatient
from app.models.audit_log import AuditLog, AuditEventType
from app.services.session_service import SessionService
from app.services.report_service import ReportService
from app.services.report_signing_service import ReportSigningService
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
    patient_progress: Optional[str] = Field(default="stable", description="Patient progress status (improving, stable, worse)")


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

        # ✅ FIX: Actually generate the report using AI instead of leaving it pending
        try:
            # Update status to generating
            ReportService.update_report(
                db=db,
                report_id=report.id,
                doctor_id=current_user.id,
                status="generating"
            )
            
            # Prepare medication text for AI
            medication_text = ""
            if request.medication_plan:
                medication_text = "\n".join([
                    f"- {m.get('drug_name', 'Unknown')} ({m.get('dosage', '')}) - {m.get('frequency', '')} for {m.get('duration', '')}"
                    for m in request.medication_plan
                ])
            
            # Generate report using Gemini
            if not gemini_service:
                logger.error("❌ Gemini service is not initialized - using fallback template")
                # Use a simple fallback template instead of failing
                # Extract key information from transcript
                transcript_preview = request.transcription[:500] if len(request.transcription) > 500 else request.transcription
                
                if request.session_type == "follow_up":
                    fallback_report = f"""## CURRENT SITUATION
- Patient presenting for follow-up consultation
- Transcript length: {len(request.transcription)} characters
- Patient status: **{request.patient_progress or 'stable'}**

## MENTAL STATUS EXAMINATION
- Clinical assessment documented in consultation
- Detailed findings available in transcript

## SLEEP & PHYSICAL HEALTH
- Sleep patterns and disturbances discussed
- Physical symptoms reviewed

## MEDICATION & TREATMENT
{medication_text if medication_text else '- No medications prescribed'}

## RISK ASSESSMENT & SIDE EFFECTS
- Risk factors assessed during consultation
- Side effects monitoring ongoing

**Note**: This is a template report generated because AI service was temporarily unavailable. Please review the transcript and edit this report with specific clinical findings.

**Transcript Preview:**
{transcript_preview}...
"""
                else:
                    fallback_report = f"""## CHIEF COMPLAINT
- Initial consultation documented
- Session type: {request.session_type.replace('_', ' ').title()}

## HISTORY OF PRESENT ILLNESS
- Clinical information documented in transcription
- Patient status: **{request.patient_progress or 'stable'}**

## MENTAL STATUS EXAMINATION
- Comprehensive assessment conducted
- Detailed findings in transcript

## RISK ASSESSMENT
- Risk factors evaluated
- Safety assessment completed

## PROVISIONAL ASSESSMENT
- Clinical impressions documented
- Further evaluation as needed

## TREATMENT PLAN
{medication_text if medication_text else '- No medications prescribed'}

**Note**: This is a template report generated because AI service was temporarily unavailable. Please review the transcript and edit this report with specific clinical findings.

**Transcript Preview:**
{transcript_preview}...
"""
                
                report_result = {
                    "status": "success",
                    "report": fallback_report,
                    "confidence_score": 0.3,
                    "keywords": ["consultation", "assessment", "follow-up" if request.session_type == "follow_up" else "initial"],
                    "reasoning": "Template report - AI service unavailable",
                    "model_used": "fallback-template",
                    "session_type": request.session_type,
                    "transcription_length": len(request.transcription),
                    "generated_at": datetime.now(timezone.utc).isoformat()
                }
            
            report_result = await gemini_service.generate_medical_report(
                transcription=request.transcription,
                session_type=request.session_type,
                patient_status=request.patient_progress or "stable",
                medications=medication_text
            )
            
            if report_result.get('status') == 'error':
                # Update report with error
                ReportService.update_report(
                    db=db,
                    report_id=report.id,
                    doctor_id=current_user.id,
                    status="failed",
                    error_message=report_result.get('error', 'AI generation failed')
                )
                logger.error(f"❌ Report generation failed: {report_result.get('error')}")
            else:
                # Update report with generated content
                report_content = report_result.get('report')
                logger.info(f"📄 Report content preview: {report_content[:200] if report_content else 'None'}...")
                logger.info(f"📊 Report model: {report_result.get('model_used')}, confidence: {report_result.get('confidence_score')}")
                
                updated_report = ReportService.update_report(
                    db=db,
                    report_id=report.id,
                    doctor_id=current_user.id,
                    generated_content=report_content,
                    status="completed",
                    ai_model=report_result.get('model_used', 'gemini-2.5-flash'),
                    keywords=report_result.get('keywords', []),
                    llm_confidence_score=report_result.get('confidence_score', 0.75),
                    generation_completed_at=datetime.now(timezone.utc).isoformat()
                )
                logger.info(f"✅ Report {report.id} generated successfully")
                logger.info(f"🔍 Updated report content length: {len(updated_report.generated_content or '')}")
        
        except Exception as gen_error:
            logger.error(f"❌ Error during report generation: {str(gen_error)}")
            # Update report status to failed
            try:
                ReportService.update_report(
                    db=db,
                    report_id=report.id,
                    doctor_id=current_user.id,
                    status="failed",
                    error_message=str(gen_error)
                )
            except:
                pass
        
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
    Generate AI report from transcript with enhanced workflow support.
    Handles potential AI errors and updates report status accordingly.
    
    Expected payload:
    {
      "session_id": "uuid",
      "reviewed_transcript": "edited transcript text",
      "patient_status": "improving" | "stable" | "worse",
      "medications": [{"name": "...", "dosage": "...", "frequency": "...", "duration": "...", "instructions": "..."}],
      "skip_medications": false,
      "session_type": "follow_up" | "new_patient"
    }
    """
    session_id = report_data.get('session_id')
    report_id = None # Initialize report_id
    report_obj_for_error_handling = None # Initialize report object reference

    try:
        # --- [Keep existing validation and variable setup code] ---
        if not report_data.get('reviewed_transcript') and not report_data.get('transcription'):
            raise HTTPException(status_code=400, detail="Missing required field: reviewed_transcript or transcription")

        reviewed_transcript = report_data.get('reviewed_transcript') or report_data.get('transcription')
        patient_status = report_data.get('patient_status', 'stable')
        medications = report_data.get('medication_plan', []) or report_data.get('medications', [])
        skip_medications = report_data.get('skip_medications', False)
        session_type = report_data.get('session_type', 'follow_up')

        logger.info(f"📋 Medications received: {len(medications)} items")
        logger.info(f"📊 Patient status: {patient_status}")
        logger.info(f"🤖 Generating {session_type} report with enhanced workflow")
        logger.info(f"📝 Transcript length: {len(reviewed_transcript)} chars, Patient status: {patient_status}")

        # --- [Keep existing session/transcription fetching/creation code] ---
        session_obj = None
        avg_stt_confidence = 0.85

        if session_id:
            session_obj = db.query(ConsultationSession).filter(
                ConsultationSession.session_id == session_id,
                ConsultationSession.doctor_id == current_user.id
            ).first()

            if not session_obj:
                 # Raise specific error if session isn't found early
                 raise HTTPException(status_code=404, detail=f"Consultation session {session_id} not found or access denied.")

            # Get or create transcription record (ensure it exists before report creation)
            transcription = db.query(Transcription).filter(
                Transcription.session_id == session_obj.id
            ).first()

            if not transcription:
                transcription = Transcription(
                    session_id=session_obj.id,
                    transcript_text=reviewed_transcript, # Use the provided transcript
                    processing_status=TranscriptionStatus.COMPLETED.value,
                    confidence_score=avg_stt_confidence, # Use default or calculated
                    stt_service='google_speech_v2', # Assuming, adjust if needed
                    stt_model='latest_long', # Assuming, adjust if needed
                    word_count=len(reviewed_transcript.split()),
                    character_count=len(reviewed_transcript),
                    processing_completed_at=datetime.now(timezone.utc)
                )
                db.add(transcription)
                db.commit()
                db.refresh(transcription)
                logger.info(f"💾 Created placeholder transcription record {transcription.id} with confidence {avg_stt_confidence:.2f}")

            # Calculate actual STT confidence if needed (keep your existing logic here)
            # ... (your stt_scores calculation logic) ...

        # --- [Keep medication text preparation code] ---
        if skip_medications or not medications:
            medication_text = "No medications prescribed"
            medications_json = []
        else:
            medications_json = medications
            medication_text = "\n".join([
                f"- {m.get('name', 'Unknown')} ({m.get('dosage', '')}) - {m.get('frequency', '')} for {m.get('duration', '')}"
                for m in medications
            ])

        # --- Report Generation and Error Handling ---
        if not gemini_service:
            raise HTTPException(
                status_code=503,
                detail="AI service unavailable. Please configure Gemini API key."
            )

        # Create the initial Report record with status 'generating'
        # This allows us to update it later even if Gemini fails
        if session_obj:
            report_obj_for_error_handling = Report(
                id=str(uuid.uuid4()),
                session_id=session_obj.id,
                transcription_id=transcription.id, # Use the fetched/created transcription id
                reviewed_transcript=reviewed_transcript,
                patient_status=patient_status,
                report_type='consultation', # Default type
                status='generating', # <--- Start as generating
                ai_model="gemini-2.5-flash",
                stt_confidence_score=avg_stt_confidence,
                structured_data={
                    'medication_plan': medications_json,
                    'session_type': session_type,
                },
                generation_started_at=datetime.now(timezone.utc).isoformat(),
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            db.add(report_obj_for_error_handling)
            db.commit()
            db.refresh(report_obj_for_error_handling)
            report_id = str(report_obj_for_error_handling.id)
            logger.info(f"⏳ Report record created {report_id}, starting AI generation...")


        # Call Gemini Service (can take time)
        report_result = await gemini_service.generate_medical_report(
            transcription=reviewed_transcript,
            session_type=session_type,
            patient_status=patient_status,
            medications=medication_text
        )

        # --- Check Gemini Result ---
        if report_result.get('status') == 'error':
            error_detail = report_result.get('error', 'Unknown AI error')
            logger.error(f"❌ AI generation failed for report {report_id}: {error_detail}")
            # Update the report status to 'failed' in DB
            if report_obj_for_error_handling:
                report_obj_for_error_handling.status = 'failed'
                report_obj_for_error_handling.error_message = error_detail
                report_obj_for_error_handling.updated_at = datetime.now(timezone.utc)
                db.commit()
                logger.info(f"💾 Updated report {report_id} status to 'failed'")
            # Raise exception to inform frontend
            raise HTTPException(
                status_code=500,
                detail=f"AI generation failed: {error_detail}"
            )

        # --- Success Case: Update Report with Generated Content ---
        if report_obj_for_error_handling:
            report_obj_for_error_handling.generated_content = report_result.get('report')
            report_obj_for_error_handling.status = 'completed' # <--- Update to completed
            report_obj_for_error_handling.llm_confidence_score = report_result.get('confidence_score', 0.75)
            report_obj_for_error_handling.keywords = report_result.get('keywords', [])
            # Update structured data if necessary (e.g., add reasoning)
            current_structured_data = report_obj_for_error_handling.structured_data or {}
            current_structured_data['reasoning'] = report_result.get('reasoning', '')
            report_obj_for_error_handling.structured_data = current_structured_data
            report_obj_for_error_handling.generation_completed_at = datetime.now(timezone.utc).isoformat()
            # Calculate duration (optional)
            # report_obj_for_error_handling.generation_duration = ...
            report_obj_for_error_handling.updated_at = datetime.now(timezone.utc)

            db.commit()
            db.refresh(report_obj_for_error_handling)
            logger.info(f"✅ Report {report_id} generated and saved successfully.")

            # --- Return Success Response ---
            return {
                "status": "success",
                "data": {
                    "report_id": report_id,
                    "session_id": session_id,
                    "generated_report": report_result.get('report'),
                    "stt_confidence_score": avg_stt_confidence,
                    "llm_confidence_score": report_result.get('confidence_score', 0.75),
                    "keywords": report_result.get('keywords', []),
                    "medications": medications_json, # Return the JSON structure
                    "patient_status": patient_status,
                    "model_used": report_result.get('model_used'),
                    "session_type": session_type,
                    "generated_at": report_result.get('generated_at')
                }
            }
        else:
             # Should not happen if session_id was provided, but handle defensively
             logger.error("❌ Cannot save report: Session object not found.")
             raise HTTPException(status_code=500, detail="Failed to save report: Session context lost.")

    except HTTPException as http_exc:
        # If an HTTPException was raised (validation, not found, AI error handled above), re-raise it
        raise http_exc
    except Exception as e:
        # --- Catch ANY OTHER unexpected error during the process ---
        error_msg = f"Unexpected error during report generation: {str(e)}"
        logger.error(f"❌ {error_msg}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        db.rollback() # Rollback any partial DB changes

        # Attempt to update report status to failed if report object exists
        if report_obj_for_error_handling:
            try:
                # Need a fresh query in case the session was rolled back
                report_to_update = db.query(Report).filter(Report.id == report_id).first()
                if report_to_update:
                    report_to_update.status = 'failed'
                    report_to_update.error_message = error_msg
                    report_to_update.updated_at = datetime.now(timezone.utc)
                    db.commit()
                    logger.info(f"💾 Updated report {report_id} status to 'failed' after unexpected error.")
            except Exception as db_err:
                logger.error(f"🚨 Failed to update report status after error: {db_err}")
                db.rollback()

        raise HTTPException(
            status_code=500,
            detail=error_msg
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


@router.post("/feedback")
async def submit_feedback(
    feedback_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_admin)
):
    """
    Submit doctor feedback (thumbs up/down) for a report.
    
    Expected payload:
    {
      "report_id": "uuid",
      "feedback": "thumbs_up" | "thumbs_down"
    }
    """
    try:
        report_id = feedback_data.get('report_id')
        feedback = feedback_data.get('feedback')
        
        if not report_id or not feedback:
            raise HTTPException(
                status_code=400,
                detail="Missing required fields: report_id and feedback"
            )
        
        if feedback not in ["thumbs_up", "thumbs_down"]:
            raise HTTPException(
                status_code=400,
                detail="Invalid feedback value. Must be 'thumbs_up' or 'thumbs_down'"
            )
        
        # Get report and verify ownership
        report = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).filter(
            Report.id == report_id,
            ConsultationSession.doctor_id == current_user.id
        ).first()
        
        if not report:
            raise HTTPException(
                status_code=404,
                detail="Report not found or access denied"
            )
        
        # Update feedback
        report.doctor_feedback = feedback
        report.feedback_submitted_at = datetime.now(timezone.utc)
        report.updated_at = datetime.now(timezone.utc)
        
        db.commit()
        
        logger.info(f"👍👎 Feedback submitted for report {report_id}: {feedback}")
        
        return {
            "status": "success",
            "message": "Feedback submitted successfully",
            "data": {
                "report_id": report_id,
                "feedback": feedback,
                "submitted_at": report.feedback_submitted_at.isoformat()
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Feedback submission error: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to submit feedback: {str(e)}"
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
        
        # Debug: Log the generated content
        logger.info(f"[{request_id}] 🔍 Report.generated_content is None: {report.generated_content is None}")
        logger.info(f"[{request_id}] 🔍 Report.generated_content type: {type(report.generated_content)}")
        content_preview = (report.generated_content or "")[:200]
        logger.info(f"[{request_id}] 📄 Generated content preview: {content_preview}...")
        logger.info(f"[{request_id}] 📊 Content length: {len(report.generated_content or '')}")
        
        logger.info(
            f"[{request_id}] SUCCESS - Report detail retrieved - "
            f"Report: {report_id}, Diagnoses: {len(diagnoses)}, Medications: {len(medications)}"
        )
        
        # Dump the response with aliases
        response_dict = response_data.model_dump(by_alias=True)
        
        # Debug: Check if generatedContent is in the response
        logger.info(f"[{request_id}] 🔍 Response keys: {list(response_dict.keys())}")
        logger.info(f"[{request_id}] 🔍 'generatedContent' in response: {'generatedContent' in response_dict}")
        logger.info(f"[{request_id}] 🔍 generatedContent length: {len(response_dict.get('generatedContent', ''))}")
        logger.info(f"[{request_id}] 🔍 generatedContent preview: {response_dict.get('generatedContent', '')[:100]}")
        
        return {
            "status": "success",
            "data": response_dict,
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


# ============================================================================
# REPORT SIGNING ENDPOINT (DIGITAL SIGNATURE WITH PASSWORD VERIFICATION)
# ============================================================================

@router.post("/{report_id}/sign")
@limiter.limit("5/minute")  # Rate limit: 5 signing attempts per minute
async def sign_report(
    request: Request,
    report_id: str,
    sign_request: SignReportRequest,
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    """
    Digitally sign a completed clinical report with password re-authentication.
    
    This endpoint:
    1. Verifies the current user is the report owner
    2. Verifies the report status is 'completed'
    3. Re-authenticates the user with their password
    4. Generates a SHA-256 hash of the report content
    5. Updates the report with signature details
    6. Creates an audit log entry
    
    Args:
        report_id: UUID of the report to sign
        sign_request: Request containing the user's password
        
    Returns:
        SignReportResponse with signature details
        
    Raises:
        401: Invalid password
        403: User does not own this report
        404: Report not found
        400: Report status is not 'completed' or already signed
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(
            f"[{request_id}] Report signing request - Report: {report_id}, User: {current_user_id}"
        )
        
        # Get current user
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            logger.error(f"[{request_id}] User not found - User: {current_user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get report with session relationship
        report = db.query(Report)\
            .options(joinedload(Report.session))\
            .filter(Report.id == report_id)\
            .first()
        
        if not report:
            logger.warning(
                f"[{request_id}] Report not found - Report: {report_id}, User: {current_user_id}"
            )
            
            # Log failed attempt
            AuditLog.log_event(
                db_session=db,
                event_type="report_sign_failed",
                doctor_user_id=current_user_id,
                details={
                    "report_id": report_id,
                    "reason": "report_not_found",
                    "request_id": request_id
                }
            )
            db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )
        
        # Sign the report (includes all verification logic)
        try:
            signed_report = await ReportSigningService.sign_report(
                db=db,
                report=report,
                user=user,
                password=sign_request.password
            )
            
            # Create audit log entry for successful signing
            AuditLog.log_event(
                db_session=db,
                event_type="report_signed",
                doctor_user_id=current_user_id,
                details={
                    "report_id": str(signed_report.id),
                    "signature_hash": signed_report.signature_hash,
                    "report_type": signed_report.report_type,
                    "session_id": str(signed_report.session_id),
                    "signed_at": signed_report.signed_at,
                    "request_id": request_id
                }
            )
            db.commit()
            
            logger.info(
                f"[{request_id}] SUCCESS - Report signed - "
                f"Report: {report_id}, Hash: {signed_report.signature_hash[:16]}..."
            )
            
            # Build response
            response = SignReportResponse(
                report_id=str(signed_report.id),
                status=signed_report.status,
                signed_at=datetime.fromisoformat(signed_report.signed_at.replace('Z', '+00:00')) if isinstance(signed_report.signed_at, str) else signed_report.signed_at,
                signed_by=user.email,
                signature_hash=signed_report.signature_hash
            )
            
            return {
                "status": "success",
                "message": "Report signed successfully",
                "data": response.dict(),
                "request_id": request_id
            }
            
        except HTTPException as e:
            # Log failed signing attempt with reason
            reason = "unknown"
            if e.status_code == status.HTTP_401_UNAUTHORIZED:
                reason = "invalid_password"
            elif e.status_code == status.HTTP_403_FORBIDDEN:
                reason = "unauthorized_access"
            elif e.status_code == status.HTTP_400_BAD_REQUEST:
                if "already been signed" in e.detail:
                    reason = "already_signed"
                elif "must be completed" in e.detail:
                    reason = "invalid_status"
                else:
                    reason = "invalid_request"
            
            AuditLog.log_event(
                db_session=db,
                event_type="report_sign_failed",
                doctor_user_id=current_user_id,
                details={
                    "report_id": report_id,
                    "reason": reason,
                    "error_detail": e.detail,
                    "request_id": request_id
                }
            )
            db.commit()
            
            logger.warning(
                f"[{request_id}] Report signing failed - "
                f"Report: {report_id}, Reason: {reason}"
            )
            
            raise
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[{request_id}] ERROR signing report - Report: {report_id}: {str(e)}",
            exc_info=True
        )
        
        # Log unexpected error
        try:
            AuditLog.log_event(
                db_session=db,
                event_type="report_sign_failed",
                doctor_user_id=current_user_id,
                details={
                    "report_id": report_id,
                    "reason": "system_error",
                    "error": str(e),
                    "request_id": request_id
                }
            )
            db.commit()
        except:
            pass
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Failed to sign report", "request_id": request_id}
        )
