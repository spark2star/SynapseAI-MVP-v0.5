"""
Consultation session and transcription models.
Handles audio recording, transcription, and session management.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean, Float, Integer
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime
from typing import Dict, Any, List, Optional

from .base import BaseModel, EncryptedType
from app.core.encryption import create_session_id


class SessionStatus(str, Enum):
    """Session status options."""
    IN_PROGRESS = "in_progress"
    PAUSED = "paused"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    ERROR = "error"


class SessionType(str, Enum):
    """Session type options."""
    NEW_PATIENT = "new_patient"
    FOLLOWUP = "followup"
    CONSULTATION = "consultation"
    EMERGENCY = "emergency"


class TranscriptionStatus(str, Enum):
    """Transcription processing status."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ConsultationSession(BaseModel):
    """
    Consultation session model for managing doctor-patient interactions.
    Tracks recording, transcription, and session metadata.
    """
    __tablename__ = "consultation_sessions"
    
    # Session identification
    session_id = Column(String(20), unique=True, nullable=False, index=True, default=create_session_id)
    
    # Relationships
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Session details
    session_type = Column(String(20), nullable=False, default=SessionType.CONSULTATION.value)
    status = Column(String(20), nullable=False, default=SessionStatus.IN_PROGRESS.value)
    
    # Timing information
    started_at = Column(String(50), nullable=False)  # ISO format timestamp
    ended_at = Column(String(50), nullable=True)
    paused_at = Column(String(50), nullable=True)
    resumed_at = Column(String(50), nullable=True)
    total_duration = Column(Float, default=0.0)  # Duration in minutes
    
    # Recording information
    audio_file_url = Column(String(500), nullable=True)  # GCS URL
    audio_file_size = Column(Integer, nullable=True)  # Size in bytes
    audio_format = Column(String(10), nullable=True)  # wav, mp3, etc.
    audio_duration = Column(Float, nullable=True)  # Duration in seconds
    
    # Session metadata
    chief_complaint = Column(EncryptedType(500), nullable=True)  # Main reason for visit
    notes = Column(EncryptedType(2000), nullable=True)  # Session notes
    
    # Quality metrics
    audio_quality_score = Column(Float, nullable=True)  # 0-1 score
    transcription_confidence = Column(Float, nullable=True)  # Average confidence
    
    # Settings used during session
    recording_settings = Column(JSONB, nullable=True)  # JSON recording configuration
    stt_settings = Column(JSONB, nullable=True)  # STT configuration used
    
    # Billing information
    billing_code = Column(String(20), nullable=True)  # CPT code or similar
    billing_amount = Column(Float, nullable=True)
    
    # Relationships
    patient = relationship("Patient", back_populates="consultation_sessions")
    doctor = relationship("User", back_populates="consultation_sessions")
    transcriptions = relationship("Transcription", back_populates="session", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="session")
    bills = relationship("Bill", back_populates="session")
    
    def __repr__(self):
        return f"<ConsultationSession(session_id='{self.session_id}', status='{self.status}')>"
    
    @property
    def is_active(self) -> bool:
        """Check if session is currently active."""
        return self.status in [SessionStatus.IN_PROGRESS.value, SessionStatus.PAUSED.value]
    
    @property
    def is_completed(self) -> bool:
        """Check if session is completed."""
        return self.status == SessionStatus.COMPLETED.value
    
    def get_session_summary(self) -> Dict[str, Any]:
        """Get session summary for API responses."""
        return {
            "session_id": self.session_id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "session_type": self.session_type,
            "status": self.status,
            "started_at": self.started_at,
            "ended_at": self.ended_at,
            "duration_minutes": self.total_duration,
            "chief_complaint": self.chief_complaint,
            "has_audio": bool(self.audio_file_url),
            "has_transcription": len(self.transcriptions) > 0,
            "transcription_status": self.transcriptions[0].processing_status if self.transcriptions else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Transcription(BaseModel):
    """
    Transcription model for storing speech-to-text results.
    Contains both raw and processed transcription data.
    """
    __tablename__ = "transcriptions"
    
    # Relationships
    session_id = Column(String(36), ForeignKey("consultation_sessions.id"), nullable=False)
    
    # Audio source
    raw_audio_url = Column(String(500), nullable=True)  # GCS URL to audio file
    audio_segment_start = Column(Float, nullable=True)  # Start time in seconds
    audio_segment_end = Column(Float, nullable=True)  # End time in seconds
    
    # Transcription content (encrypted)
    transcript_text = Column(EncryptedType(10000), nullable=False)
    original_transcript = Column(EncryptedType(10000), nullable=True)  # Before any processing
    
    # Transcription segments with timing
    transcript_segments = Column(JSONB, nullable=True)  # Detailed segment data
    
    # Processing information
    processing_status = Column(String(20), nullable=False, default=TranscriptionStatus.PENDING.value)
    stt_service = Column(String(50), nullable=True)  # google_stt, etc.
    stt_model = Column(String(100), nullable=True)  # Model used
    stt_language = Column(String(10), nullable=True)  # Language code
    
    # Quality metrics
    confidence_score = Column(Float, nullable=True)  # Overall confidence 0-1
    word_count = Column(Integer, nullable=True)
    character_count = Column(Integer, nullable=True)
    
    # Processing timing
    processing_started_at = Column(String(50), nullable=True)
    processing_completed_at = Column(String(50), nullable=True)
    processing_duration = Column(Float, nullable=True)  # Seconds
    
    # Manual corrections
    manually_corrected = Column(Boolean, default=False)
    corrected_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    correction_notes = Column(Text, nullable=True)
    
    # Error handling
    error_message = Column(Text, nullable=True)
    retry_count = Column(Integer, default=0)
    
    # Relationships
    session = relationship("ConsultationSession", back_populates="transcriptions")
    corrected_by_user = relationship("User", foreign_keys=[corrected_by])
    
    def __repr__(self):
        return f"<Transcription(session_id='{self.session_id}', status='{self.processing_status}')>"
    
    @property
    def is_completed(self) -> bool:
        """Check if transcription is completed."""
        return self.processing_status == TranscriptionStatus.COMPLETED.value
    
    @property
    def has_errors(self) -> bool:
        """Check if transcription has errors."""
        return self.processing_status == TranscriptionStatus.FAILED.value
    
    def get_transcript_summary(self) -> Dict[str, Any]:
        """Get transcription summary for API responses."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "status": self.processing_status,
            "text_preview": self.transcript_text[:200] + "..." if len(self.transcript_text or "") > 200 else self.transcript_text,
            "word_count": self.word_count,
            "confidence_score": self.confidence_score,
            "manually_corrected": self.manually_corrected,
            "processing_duration": self.processing_duration,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.processing_completed_at
        }
    
    def get_full_transcript(self) -> Dict[str, Any]:
        """Get full transcription data."""
        return {
            "id": self.id,
            "session_id": self.session_id,
            "transcript_text": self.transcript_text,
            "segments": self.transcript_segments,
            "status": self.processing_status,
            "confidence_score": self.confidence_score,
            "word_count": self.word_count,
            "character_count": self.character_count,
            "manually_corrected": self.manually_corrected,
            "correction_notes": self.correction_notes,
            "stt_service": self.stt_service,
            "stt_model": self.stt_model,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def update_segments(self, segments: List[Dict[str, Any]]):
        """Update transcription segments with timing information."""
        self.transcript_segments = segments
        
        # Calculate metrics from segments
        if segments:
            total_words = sum(len(segment.get("text", "").split()) for segment in segments)
            total_chars = sum(len(segment.get("text", "")) for segment in segments)
            avg_confidence = sum(segment.get("confidence", 0) for segment in segments) / len(segments)
            
            self.word_count = total_words
            self.character_count = total_chars
            self.confidence_score = avg_confidence
