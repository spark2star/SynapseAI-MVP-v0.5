"""
Report generation service layer.
Handles business logic for AI-generated medical reports.
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging
import hashlib
import json

from app.models.report import Report, ReportTemplate, ReportStatus, ReportType
from app.models.session import ConsultationSession, Transcription, TranscriptionStatus
from app.core.exceptions import (
    ReportNotFoundException,
    TemplateNotFoundException,
    SessionNotFoundException,
    TranscriptionNotFoundException,
    ReportNotSignedException,
    BusinessLogicException
)

logger = logging.getLogger(__name__)


class ReportService:
    """Service for managing medical reports and templates."""
    
    @staticmethod
    def create_report(
        db: Session,
        session_id: str,
        transcription_id: str,
        doctor_id: str,
        report_type: str = ReportType.CONSULTATION.value,
        template_id: Optional[str] = None
    ) -> Report:
        """
        Create a new report for a session.
        
        Args:
            db: Database session
            session_id: Consultation session ID
            transcription_id: Transcription ID
            doctor_id: Doctor user ID
            report_type: Type of report
            template_id: Optional template ID
            
        Returns:
            Created Report
            
        Raises:
            SessionNotFoundException: If session doesn't exist
            TranscriptionNotFoundException: If transcription doesn't exist
            BusinessLogicException: If transcription is not completed
        """
        # Verify session exists and belongs to doctor
        session = db.query(ConsultationSession).filter(
            (ConsultationSession.id == session_id) | 
            (ConsultationSession.session_id == session_id),
            ConsultationSession.doctor_id == doctor_id
        ).first()
        
        if not session:
            raise SessionNotFoundException(session_id)
        
        # Verify transcription exists and is completed
        transcription = db.query(Transcription).filter(
            Transcription.id == transcription_id,
            Transcription.session_id == session.id
        ).first()
        
        if not transcription:
            raise TranscriptionNotFoundException(transcription_id)
        
        if transcription.processing_status != TranscriptionStatus.COMPLETED.value:
            raise BusinessLogicException(
                f"Transcription {transcription_id} is not completed (status: {transcription.processing_status})"
            )
        
        # Get template if specified
        if template_id:
            template = db.query(ReportTemplate).filter(
                ReportTemplate.id == template_id,
                ReportTemplate.doctor_id == doctor_id,
                ReportTemplate.is_active == True
            ).first()
            
            if not template:
                raise TemplateNotFoundException(template_id)
        else:
            # Get default template
            template = db.query(ReportTemplate).filter(
                ReportTemplate.doctor_id == doctor_id,
                ReportTemplate.is_default == True,
                ReportTemplate.is_active == True
            ).first()
        
        # Create report
        report = Report(
            session_id=session.id,
            transcription_id=transcription.id,
            template_id=template.id if template else None,
            report_type=report_type,
            status=ReportStatus.PENDING.value,
            version=1,
            ai_model="gemini-2.5-flash",
            generation_started_at=datetime.now(timezone.utc).isoformat()
        )
        
        db.add(report)
        db.commit()
        db.refresh(report)
        
        logger.info(f"Created report {report.id} for session {session_id}")
        return report
    
    @staticmethod
    def get_report_by_id(
        db: Session,
        report_id: str,
        doctor_id: Optional[str] = None
    ) -> Report:
        """
        Get report by ID with optional doctor access control.
        
        Args:
            db: Database session
            report_id: Report ID
            doctor_id: Optional doctor ID for access control
            
        Returns:
            Report
            
        Raises:
            ReportNotFoundException: If report not found or access denied
        """
        query = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).filter(Report.id == report_id)
        
        if doctor_id:
            query = query.filter(ConsultationSession.doctor_id == doctor_id)
        
        report = query.first()
        if not report:
            raise ReportNotFoundException(report_id)
        
        return report
    
    @staticmethod
    def update_report(
        db: Session,
        report_id: str,
        doctor_id: str,
        **updates
    ) -> Report:
        """
        Update report fields.
        
        Args:
            db: Database session
            report_id: Report ID
            doctor_id: Doctor ID for access control
            **updates: Fields to update
            
        Returns:
            Updated Report
        """
        report = ReportService.get_report_by_id(db, report_id, doctor_id)
        
        # Mark as manually edited if content is updated
        if 'generated_content' in updates or 'manual_corrections' in updates:
            report.manually_edited = True
            report.reviewed_by = doctor_id
            report.reviewed_at = datetime.now(timezone.utc).isoformat()
        
        for field, value in updates.items():
            if hasattr(report, field) and value is not None:
                setattr(report, field, value)
        
        db.commit()
        db.refresh(report)
        
        logger.info(f"Updated report {report_id}")
        return report
    
    @staticmethod
    def sign_report(
        db: Session,
        report_id: str,
        doctor_id: str
    ) -> Report:
        """
        Digitally sign a report.
        
        Args:
            db: Database session
            report_id: Report ID
            doctor_id: Doctor ID
            
        Returns:
            Signed Report
            
        Raises:
            BusinessLogicException: If report is not completed
        """
        report = ReportService.get_report_by_id(db, report_id, doctor_id)
        
        if report.status != ReportStatus.COMPLETED.value:
            raise BusinessLogicException(
                f"Report {report_id} must be completed before signing (status: {report.status})"
            )
        
        # Generate digital signature
        signature_payload = {
            "report_id": report.id,
            "doctor_id": doctor_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "content_hash": hashlib.sha256(
                (report.generated_content or "").encode()
            ).hexdigest()
        }
        
        # In production, use asymmetric cryptography
        digital_signature = hashlib.sha256(
            json.dumps(signature_payload, sort_keys=True).encode()
        ).hexdigest()
        
        # Update report
        report.status = ReportStatus.SIGNED.value
        report.signed_by = doctor_id
        report.signed_at = datetime.now(timezone.utc).isoformat()
        
        db.commit()
        db.refresh(report)
        
        logger.info(f"Signed report {report_id}")
        return report
    
    @staticmethod
    def list_reports_by_doctor(
        db: Session,
        doctor_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[Report]:
        """
        List reports for a doctor.
        
        Args:
            db: Database session
            doctor_id: Doctor user ID
            skip: Number of records to skip
            limit: Maximum records to return
            status: Optional status filter
            
        Returns:
            List of Report
        """
        query = db.query(Report).join(
            ConsultationSession,
            Report.session_id == ConsultationSession.id
        ).filter(ConsultationSession.doctor_id == doctor_id)
        
        if status:
            query = query.filter(Report.status == status)
        
        reports = query.order_by(
            Report.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return reports
    
    # Template Management
    @staticmethod
    def create_template(
        db: Session,
        doctor_id: str,
        template_name: str,
        template_structure: Dict[str, Any],
        ai_prompt_template: str,
        report_type: str = ReportType.CONSULTATION.value,
        **kwargs
    ) -> ReportTemplate:
        """
        Create a new report template.
        
        Args:
            db: Database session
            doctor_id: Doctor user ID
            template_name: Template name
            template_structure: JSON template structure
            ai_prompt_template: AI prompt template
            report_type: Type of report
            **kwargs: Additional template fields
            
        Returns:
            Created ReportTemplate
        """
        template = ReportTemplate(
            doctor_id=doctor_id,
            template_name=template_name,
            template_structure=template_structure,
            ai_prompt_template=ai_prompt_template,
            report_type=report_type,
            **kwargs
        )
        
        db.add(template)
        db.commit()
        db.refresh(template)
        
        logger.info(f"Created template {template.id} for doctor {doctor_id}")
        return template
    
    @staticmethod
    def get_template_by_id(
        db: Session,
        template_id: str,
        doctor_id: Optional[str] = None
    ) -> ReportTemplate:
        """
        Get template by ID.
        
        Args:
            db: Database session
            template_id: Template ID
            doctor_id: Optional doctor ID for access control
            
        Returns:
            ReportTemplate
            
        Raises:
            TemplateNotFoundException: If template not found
        """
        query = db.query(ReportTemplate).filter(
            ReportTemplate.id == template_id
        )
        
        if doctor_id:
            # Allow access to doctor's own templates or public templates
            query = query.filter(
                (ReportTemplate.doctor_id == doctor_id) | 
                (ReportTemplate.is_public == True)
            )
        
        template = query.first()
        if not template:
            raise TemplateNotFoundException(template_id)
        
        return template
    
    @staticmethod
    def list_templates_by_doctor(
        db: Session,
        doctor_id: str,
        skip: int = 0,
        limit: int = 100,
        is_active: Optional[bool] = True
    ) -> List[ReportTemplate]:
        """
        List templates for a doctor.
        
        Args:
            db: Database session
            doctor_id: Doctor user ID
            skip: Number of records to skip
            limit: Maximum records to return
            is_active: Filter by active status
            
        Returns:
            List of ReportTemplate
        """
        query = db.query(ReportTemplate).filter(
            ReportTemplate.doctor_id == doctor_id
        )
        
        if is_active is not None:
            query = query.filter(ReportTemplate.is_active == is_active)
        
        templates = query.order_by(
            ReportTemplate.is_default.desc(),
            ReportTemplate.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return templates
    
    @staticmethod
    def set_default_template(
        db: Session,
        template_id: str,
        doctor_id: str
    ) -> ReportTemplate:
        """
        Set a template as the default for a doctor.
        
        Args:
            db: Database session
            template_id: Template ID to set as default
            doctor_id: Doctor user ID
            
        Returns:
            Updated ReportTemplate
        """
        # Remove default flag from all doctor's templates
        db.query(ReportTemplate).filter(
            ReportTemplate.doctor_id == doctor_id,
            ReportTemplate.is_default == True
        ).update({"is_default": False})
        
        # Set new default
        template = ReportService.get_template_by_id(db, template_id, doctor_id)
        template.is_default = True
        
        db.commit()
        db.refresh(template)
        
        logger.info(f"Set template {template_id} as default for doctor {doctor_id}")
        return template
