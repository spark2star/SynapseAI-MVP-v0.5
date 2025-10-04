"""
Report schemas with automatic camelCase conversion.
"""

from app.schemas.base import CamelCaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime


class ReportResponse(CamelCaseModel):
    """
    Report response with automatic camelCase conversion.
    
    All snake_case fields automatically convert to camelCase:
    - session_id → sessionId
    - session_identifier → sessionIdentifier
    - patient_id → patientId
    - patient_name → patientName
    - patient_age → patientAge
    - patient_sex → patientSex
    - created_at → createdAt
    - updated_at → updatedAt
    - report_type → reportType
    - ai_model → aiModel
    - confidence_score → confidenceScore
    - generation_duration → generationDuration
    - session_type → sessionType
    - chief_complaint → chiefComplaint
    - session_started_at → sessionStartedAt
    - session_ended_at → sessionEndedAt
    - session_duration → sessionDuration
    - has_been_signed → hasBeenSigned
    - signed_at → signedAt
    - signed_by → signedBy
    """
    id: str
    session_id: str
    session_identifier: str
    patient_id: str
    patient_name: str
    patient_age: Optional[int] = None
    patient_sex: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    status: str
    report_type: str
    ai_model: Optional[str] = None
    confidence_score: Optional[float] = None
    generation_duration: Optional[int] = None
    session_type: str
    chief_complaint: str
    session_started_at: Optional[datetime] = None
    session_ended_at: Optional[datetime] = None
    session_duration: Optional[int] = None
    has_been_signed: bool = False
    signed_at: Optional[datetime] = None


class GenerateReportRequest(CamelCaseModel):
    """Request to generate report - accepts both camelCase and snake_case"""
    session_id: str
    transcription: str
    medication_plan: Optional[list] = None
    additional_notes: Optional[str] = None
    patient_progress: Optional[str] = None
    session_type: str = "consultation"


class MedicationItem(CamelCaseModel):
    """Individual medication in treatment plan"""
    drug_name: str
    dosage: str
    frequency: str
    duration: str
    instructions: Optional[str] = None


class DiagnosisItem(CamelCaseModel):
    """Individual diagnosis"""
    diagnosis: str
    icd_code: Optional[str] = None
    severity: Optional[str] = None
    notes: Optional[str] = None


class RecommendationItem(CamelCaseModel):
    """Treatment recommendation"""
    category: str
    recommendation: str
    priority: Optional[str] = None


class ReportDetailResponse(CamelCaseModel):
    """
    Complete report with all sections.
    
    Includes:
    - Report metadata (id, status, created_at, etc.)
    - Patient information
    - Session details
    - Full generated content
    - Structured data (diagnoses, medications, recommendations)
    - AI model information
    """
    # Report metadata
    id: str
    session_id: str
    session_identifier: str
    status: str
    created_at: datetime
    updated_at: datetime
    
    # Patient information
    patient_id: str
    patient_name: str
    patient_age: int
    patient_sex: str
    
    # Session details
    consultation_date: datetime
    chief_complaint: str
    session_type: str
    session_duration: Optional[int] = None
    
    # Report content
    report_type: str
    generated_content: str  # Full markdown/text content
    
    # Structured data
    diagnoses: List[DiagnosisItem] = []
    medication_plan: List[MedicationItem] = []
    recommendations: List[RecommendationItem] = []
    follow_up_plan: Optional[str] = None
    additional_notes: Optional[str] = None
    
    # AI information
    ai_model: str
    confidence_score: Optional[float] = None
    generation_duration: Optional[int] = None
    
    # Signature information
    signed_by: Optional[str] = None
    signed_at: Optional[datetime] = None
    signature_data: Optional[str] = None
    
    # Transcription
    transcription_id: Optional[str] = None
    transcription_text: Optional[str] = None


class ReportTemplateCreate(CamelCaseModel):
    """Create report template request"""
    name: str
    description: Optional[str] = None
    template_type: str
    content: str
    is_active: bool = True


class ReportTemplateRead(CamelCaseModel):
    """Read report template response"""
    id: str
    name: str
    description: Optional[str] = None
    template_type: str
    content: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None


class ReportTemplateUpdate(CamelCaseModel):
    """Update report template request"""
    name: Optional[str] = None
    description: Optional[str] = None
    content: Optional[str] = None
    is_active: Optional[bool] = None


class TemplateSummaryResponse(CamelCaseModel):
    """Summary of report template"""
    id: str
    name: str
    template_type: str
    is_active: bool
    created_at: datetime