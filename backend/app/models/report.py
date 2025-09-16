"""
Report generation and template models.
Handles AI-generated medical reports and customizable templates.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime
from typing import Dict, Any, Optional, List

from .base import BaseModel, EncryptedType


class ReportStatus(str, Enum):
    """Report generation status."""
    PENDING = "pending"
    GENERATING = "generating"
    COMPLETED = "completed"
    FAILED = "failed"
    SIGNED = "signed"


class ReportType(str, Enum):
    """Report type options."""
    CONSULTATION = "consultation"
    FOLLOWUP = "followup"
    DIAGNOSTIC = "diagnostic"
    TREATMENT_PLAN = "treatment_plan"
    DISCHARGE = "discharge"
    REFERRAL = "referral"


class Report(BaseModel):
    """
    Medical report model for AI-generated consultation reports.
    Contains structured medical information extracted from transcriptions.
    """
    __tablename__ = "reports"
    
    # Relationships
    session_id = Column(String(36), ForeignKey("consultation_sessions.id"), nullable=False)
    template_id = Column(String(36), ForeignKey("report_templates.id"), nullable=True)
    transcription_id = Column(String(36), ForeignKey("transcriptions.id"), nullable=False)
    
    # Report identification
    report_type = Column(String(30), nullable=False, default=ReportType.CONSULTATION.value)
    status = Column(String(20), nullable=False, default=ReportStatus.PENDING.value)
    version = Column(Integer, nullable=False, default=1)
    
    # Generated content (encrypted)
    generated_content = Column(EncryptedType(20000), nullable=True)  # Main report content
    structured_data = Column(JSONB, nullable=True)  # Structured medical data
    
    # AI generation details
    ai_model = Column(String(100), nullable=True)  # gemini-2.5-flash
    ai_prompt_version = Column(String(20), nullable=True)
    generation_started_at = Column(String(50), nullable=True)
    generation_completed_at = Column(String(50), nullable=True)
    generation_duration = Column(Integer, nullable=True)  # Seconds
    
    # Quality and confidence
    confidence_score = Column(String(10), nullable=True)  # AI confidence 0-1
    quality_score = Column(String(10), nullable=True)  # Report quality assessment
    completeness_score = Column(String(10), nullable=True)  # How complete the report is
    
    # Manual review and signing
    reviewed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    signed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(String(50), nullable=True)
    signed_at = Column(String(50), nullable=True)
    
    # Manual corrections
    manual_corrections = Column(EncryptedType(5000), nullable=True)
    correction_notes = Column(Text, nullable=True)
    manually_edited = Column(Boolean, default=False)
    
    # Export and sharing
    exported_formats = Column(JSONB, nullable=True)  # List of exported formats
    shared_with = Column(JSONB, nullable=True)  # List of users/entities shared with
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Relationships
    session = relationship("ConsultationSession", back_populates="reports")
    template = relationship("ReportTemplate", back_populates="reports")
    transcription = relationship("Transcription")
    reviewed_by_user = relationship("User", foreign_keys=[reviewed_by])
    signed_by_user = relationship("User", foreign_keys=[signed_by], back_populates="generated_reports")
    
    def __repr__(self):
        return f"<Report(id='{self.id}', session_id='{self.session_id}', status='{self.status}')>"
    
    @property
    def is_completed(self) -> bool:
        """Check if report generation is completed."""
        return self.status == ReportStatus.COMPLETED.value
    
    @property
    def is_signed(self) -> bool:
        """Check if report is digitally signed."""
        return self.status == ReportStatus.SIGNED.value
    
    def get_report_summary(self) -> Dict[str, Any]:
        """Get report summary for API responses."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "report_type": self.report_type,
            "status": self.status,
            "version": self.version,
            "content_preview": self.generated_content[:300] + "..." if len(self.generated_content or "") > 300 else self.generated_content,
            "confidence_score": float(self.confidence_score) if self.confidence_score else None,
            "quality_score": float(self.quality_score) if self.quality_score else None,
            "manually_edited": self.manually_edited,
            "signed_by": self.signed_by,
            "signed_at": self.signed_at,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "generation_duration": self.generation_duration
        }
    
    def get_full_report(self) -> Dict[str, Any]:
        """Get full report data for viewing/editing."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "report_type": self.report_type,
            "status": self.status,
            "version": self.version,
            "content": self.generated_content,
            "structured_data": self.structured_data,
            "manual_corrections": self.manual_corrections,
            "correction_notes": self.correction_notes,
            "confidence_score": float(self.confidence_score) if self.confidence_score else None,
            "quality_score": float(self.quality_score) if self.quality_score else None,
            "completeness_score": float(self.completeness_score) if self.completeness_score else None,
            "ai_model": self.ai_model,
            "manually_edited": self.manually_edited,
            "reviewed_by": self.reviewed_by,
            "signed_by": self.signed_by,
            "reviewed_at": self.reviewed_at,
            "signed_at": self.signed_at,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ReportTemplate(BaseModel):
    """
    Customizable report templates for different types of medical reports.
    Allows doctors to create personalized report structures.
    """
    __tablename__ = "report_templates"
    
    # Ownership
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Template details
    template_name = Column(String(200), nullable=False)
    template_description = Column(Text, nullable=True)
    report_type = Column(String(30), nullable=False, default=ReportType.CONSULTATION.value)
    
    # Template structure (JSON schema)
    template_structure = Column(JSONB, nullable=False)
    
    # AI prompt configuration
    ai_prompt_template = Column(Text, nullable=False)
    prompt_variables = Column(JSONB, nullable=True)  # Variables used in prompt
    
    # Template settings
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    is_public = Column(Boolean, default=False)  # Shareable with other doctors
    
    # Usage statistics
    usage_count = Column(Integer, default=0)
    last_used_at = Column(String(50), nullable=True)
    
    # Version control
    version = Column(String(20), nullable=False, default="1.0")
    parent_template_id = Column(String(36), ForeignKey("report_templates.id"), nullable=True)
    
    # Relationships
    doctor = relationship("User")
    reports = relationship("Report", back_populates="template")
    parent_template = relationship("ReportTemplate", remote_side="ReportTemplate.id")
    
    def __repr__(self):
        return f"<ReportTemplate(id='{self.id}', name='{self.template_name}')>"
    
    def get_template_summary(self) -> Dict[str, Any]:
        """Get template summary for API responses."""
        return {
            "id": self.id,
            "name": self.template_name,
            "description": self.template_description,
            "report_type": self.report_type,
            "is_default": self.is_default,
            "is_active": self.is_active,
            "is_public": self.is_public,
            "usage_count": self.usage_count,
            "version": self.version,
            "last_used_at": self.last_used_at,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def get_full_template(self) -> Dict[str, Any]:
        """Get full template data for editing."""
        return {
            "id": self.id,
            "name": self.template_name,
            "description": self.template_description,
            "report_type": self.report_type,
            "structure": self.template_structure,
            "ai_prompt_template": self.ai_prompt_template,
            "prompt_variables": self.prompt_variables,
            "is_default": self.is_default,
            "is_active": self.is_active,
            "is_public": self.is_public,
            "version": self.version,
            "parent_template_id": self.parent_template_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def increment_usage(self):
        """Increment usage count and update last used timestamp."""
        self.usage_count = (self.usage_count or 0) + 1
        self.last_used_at = datetime.utcnow().isoformat()
    
    @classmethod
    def get_default_template_structure(cls) -> Dict[str, Any]:
        """Get default template structure for new templates."""
        return {
            "sections": [
                {
                    "id": "chief_complaint",
                    "title": "Chief Complaint",
                    "required": True,
                    "type": "text"
                },
                {
                    "id": "history_present_illness",
                    "title": "History of Present Illness",
                    "required": True,
                    "type": "text"
                },
                {
                    "id": "physical_examination",
                    "title": "Physical Examination",
                    "required": False,
                    "type": "structured",
                    "subsections": [
                        {"id": "vital_signs", "title": "Vital Signs"},
                        {"id": "general_appearance", "title": "General Appearance"},
                        {"id": "systems_review", "title": "Systems Review"}
                    ]
                },
                {
                    "id": "assessment",
                    "title": "Assessment",
                    "required": True,
                    "type": "text"
                },
                {
                    "id": "plan",
                    "title": "Plan",
                    "required": True,
                    "type": "structured",
                    "subsections": [
                        {"id": "medications", "title": "Medications"},
                        {"id": "follow_up", "title": "Follow-up"},
                        {"id": "patient_education", "title": "Patient Education"}
                    ]
                }
            ]
        }
    
    @classmethod
    def get_default_ai_prompt(cls) -> str:
        """Get default AI prompt template."""
        return """
You are a medical report generator. Convert the transcribed doctor-patient consultation into a structured medical report.

Transcription:
{transcript_text}

Template Structure:
{template_structure}

Instructions:
1. Extract relevant medical information from the transcription
2. Organize information according to the provided template structure
3. Use professional medical terminology
4. Maintain clinical accuracy and objectivity
5. Flag any critical findings or urgent concerns
6. If information is missing for required sections, note as "Not documented in consultation"

Generate a comprehensive medical report following the template structure.
"""
