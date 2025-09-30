"""
Transcription schemas for API validation and serialization.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.models.session import TranscriptionStatus


# Base Schemas
class TranscriptionBase(BaseModel):
    """Base schema for transcription."""
    session_id: str
    transcript_text: str = Field(..., min_length=1)
    stt_service: Optional[str] = Field(None, max_length=50)
    stt_model: Optional[str] = Field(None, max_length=100)
    stt_language: Optional[str] = Field(None, max_length=10)


class TranscriptionCreate(TranscriptionBase):
    """Schema for creating a new transcription."""
    raw_audio_url: Optional[str] = None
    audio_segment_start: Optional[float] = None
    audio_segment_end: Optional[float] = None
    transcript_segments: Optional[List[Dict[str, Any]]] = None


class TranscriptionUpdate(BaseModel):
    """Schema for updating a transcription (all fields optional)."""
    transcript_text: Optional[str] = Field(None, min_length=1)
    processing_status: Optional[str] = None
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    word_count: Optional[int] = Field(None, ge=0)
    character_count: Optional[int] = Field(None, ge=0)
    manually_corrected: Optional[bool] = None
    correction_notes: Optional[str] = None
    error_message: Optional[str] = None


class TranscriptionRead(TranscriptionBase):
    """Schema for reading transcription data."""
    id: str
    processing_status: str
    original_transcript: Optional[str] = None
    transcript_segments: Optional[List[Dict[str, Any]]] = None
    confidence_score: Optional[float] = None
    word_count: Optional[int] = None
    character_count: Optional[int] = None
    processing_started_at: Optional[str] = None
    processing_completed_at: Optional[str] = None
    processing_duration: Optional[float] = None
    manually_corrected: bool = False
    corrected_by: Optional[str] = None
    correction_notes: Optional[str] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class TranscriptionCorrection(BaseModel):
    """Schema for manual transcription correction."""
    corrected_text: str = Field(..., min_length=1)
    correction_notes: Optional[str] = Field(None, max_length=1000)


class TranscriptionSegment(BaseModel):
    """Schema for transcription segment with timing."""
    text: str
    start_time: float
    end_time: float
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0)
    speaker_tag: Optional[int] = None
    alternatives: Optional[List[str]] = None


# Response Schemas
class TranscriptionSummaryResponse(BaseModel):
    """Simplified transcription summary for lists."""
    id: str
    session_id: str
    status: str
    text_preview: str
    word_count: Optional[int] = None
    confidence_score: Optional[float] = None
    manually_corrected: bool = False
    created_at: datetime

    class Config:
        from_attributes = True
