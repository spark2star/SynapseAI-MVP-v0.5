"""
Report and template schemas for API validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.models.report import ReportStatus, ReportType


# Report Schemas
class ReportBase(BaseModel):
    """Base schema for report."""
    session_id: str
    transcription_id: str
    report_type: str = ReportType.CONSULTATION.value
    template_id: Optional[str] = None


class ReportCreate(ReportBase):
    """Schema for creating a new report."""
    pass


class ReportUpdate(BaseModel):
    """Schema for updating a report (all fields optional)."""
    status: Optional[str] = None
    generated_content: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    manual_corrections: Optional[str] = None
    correction_notes: Optional[str] = None
    manually_edited: Optional[bool] = None


class ReportRead(ReportBase):
    """Schema for reading report data."""
    id: str
    status: str
    version: int
    generated_content: Optional[str] = None
    structured_data: Optional[Dict[str, Any]] = None
    ai_model: Optional[str] = None
    ai_prompt_version: Optional[str] = None
    generation_started_at: Optional[str] = None
    generation_completed_at: Optional[str] = None
    generation_duration: Optional[int] = None
    confidence_score: Optional[str] = None
    quality_score: Optional[str] = None
    completeness_score: Optional[str] = None
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    signed_by: Optional[str] = None
    signed_at: Optional[str] = None
    manual_corrections: Optional[str] = None
    correction_notes: Optional[str] = None
    manually_edited: bool = False
    exported_formats: Optional[List[str]] = None
    shared_with: Optional[List[str]] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportSign(BaseModel):
    """Schema for signing a report."""
    signature_password: Optional[str] = None
    signature_notes: Optional[str] = None


class ReportExport(BaseModel):
    """Schema for exporting a report."""
    format: str = Field(..., description="Export format: pdf, docx")
    include_attachments: bool = False


class ReportShare(BaseModel):
    """Schema for sharing a report."""
    recipient_email: str = Field(..., description="Email address to share report with")
    message: Optional[str] = Field(None, max_length=500)
    expiry_days: int = Field(7, ge=1, le=365)


# Template Schemas
class ReportTemplateBase(BaseModel):
    """Base schema for report template."""
    template_name: str = Field(..., min_length=1, max_length=200)
    template_description: Optional[str] = None
    report_type: str = ReportType.CONSULTATION.value
    template_structure: Dict[str, Any]
    ai_prompt_template: str = Field(..., min_length=10)


class ReportTemplateCreate(ReportTemplateBase):
    """Schema for creating a new report template."""
    is_default: bool = False
    is_active: bool = True
    is_public: bool = False
    prompt_variables: Optional[Dict[str, Any]] = None


class ReportTemplateUpdate(BaseModel):
    """Schema for updating a report template (all fields optional)."""
    template_name: Optional[str] = Field(None, min_length=1, max_length=200)
    template_description: Optional[str] = None
    template_structure: Optional[Dict[str, Any]] = None
    ai_prompt_template: Optional[str] = Field(None, min_length=10)
    is_default: Optional[bool] = None
    is_active: Optional[bool] = None
    is_public: Optional[bool] = None
    prompt_variables: Optional[Dict[str, Any]] = None


class ReportTemplateRead(ReportTemplateBase):
    """Schema for reading report template data."""
    id: str
    doctor_id: str
    is_default: bool
    is_active: bool
    is_public: bool
    usage_count: int
    last_used_at: Optional[str] = None
    version: str
    parent_template_id: Optional[str] = None
    prompt_variables: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Response Schemas
class ReportSummaryResponse(BaseModel):
    """Simplified report summary for lists."""
    id: str
    session_id: str
    report_type: str
    status: str
    version: int
    content_preview: Optional[str] = None
    confidence_score: Optional[float] = None
    manually_edited: bool = False
    signed_by: Optional[str] = None
    signed_at: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class TemplateSummaryResponse(BaseModel):
    """Simplified template summary for lists."""
    id: str
    name: str
    report_type: str
    is_default: bool
    is_active: bool
    usage_count: int
    created_at: datetime

    class Config:
        from_attributes = True
