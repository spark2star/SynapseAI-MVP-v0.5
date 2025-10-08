"""
Transcription Service for managing audio transcriptions.
Handles database operations for transcription records.
"""

from sqlalchemy.orm import Session
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging

from app.models.session import Transcription, TranscriptionStatus, ConsultationSession, SessionStatus
from app.core.exceptions import NotFoundException, ValidationException

logger = logging.getLogger(__name__)


class TranscriptionService:
    """Service for managing transcription operations."""
    
    @staticmethod
    def get_or_create_transcription(
        db: Session,
        session_id: str
    ) -> Transcription:
        """
        Get existing in-progress transcription or create new one.
        
        Args:
            db: Database session
            session_id: Consultation session ID
            
        Returns:
            Transcription object
            
        Raises:
            NotFoundException: If session not found
        """
        # Verify session exists and is active
        session = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id
        ).first()
        
        if not session:
            raise ValueError(f"Consultation session {session_id} not found")

        
        if session.status not in [SessionStatus.IN_PROGRESS, SessionStatus.PAUSED]:
            raise ValidationException(
                f"Session {session_id} is not active. Status: {session.status}"
            )
        
        # Check for existing in-progress transcription
        transcription = db.query(Transcription).filter(
            Transcription.session_id == str(session.id),
            Transcription.processing_status.in_([
                TranscriptionStatus.PENDING,
                TranscriptionStatus.PROCESSING
            ])
        ).first()
        
        if transcription:
            logger.info(f"Found existing transcription {transcription.id} for session {session_id}")
            return transcription
        
        # Create new transcription
        transcription = Transcription(
            session_id=str(session.id),
            transcript_text="",
            original_transcript="",
            transcript_segments=[],
            processing_status=TranscriptionStatus.PROCESSING,
            stt_service="vertex-ai",
            stt_model="latest_long",
            stt_language="hi-IN",
            confidence_score=0.0,
            word_count=0,
            character_count=0,
            manually_corrected=False,
            retry_count=0,
            processing_started_at=datetime.utcnow()
        )
        
        db.add(transcription)
        db.commit()
        db.refresh(transcription)
        
        logger.info(f"Created new transcription {transcription.id} for session {session_id}")
        return transcription
    
    @staticmethod
    def update_transcription(
        db: Session,
        transcription_id: str,
        transcript_text: Optional[str] = None,
        segments: Optional[List[Dict[str, Any]]] = None,
        confidence_score: Optional[float] = None,
        status: Optional[TranscriptionStatus] = None,
        language_code: Optional[str] = None,
        error_message: Optional[str] = None
    ) -> Transcription:
        """
        Update transcription with new data.
        
        Args:
            db: Database session
            transcription_id: Transcription ID
            transcript_text: Full transcript text
            segments: List of transcript segments with timing
            confidence_score: Overall confidence score
            status: Processing status
            language_code: Detected language
            error_message: Error message if processing failed
            
        Returns:
            Updated Transcription object
            
        Raises:
            NotFoundException: If transcription not found
        """
        transcription = db.query(Transcription).filter(
            Transcription.id == transcription_id
        ).first()
        
        if not transcription:
            raise NotFoundException(f"Transcription {transcription_id} not found")
        
        # Update transcript text
        if transcript_text is not None:
            transcription.transcript_text = transcript_text
            transcription.word_count = len(transcript_text.split())
            transcription.character_count = len(transcript_text)
        
        # Update segments
        if segments is not None:
            transcription.transcript_segments = segments
        
        # Update confidence score
        if confidence_score is not None:
            transcription.confidence_score = confidence_score
        
        # Update language
        if language_code is not None:
            transcription.stt_language = language_code
        
        # Update status
        if status is not None:
            transcription.processing_status = status
            
            if status == TranscriptionStatus.COMPLETED:
                transcription.processing_completed_at = datetime.utcnow()
                if transcription.processing_started_at:
                    transcription.processing_duration = (
                        transcription.processing_completed_at - transcription.processing_started_at
                    ).total_seconds()
                logger.info(f"Transcription {transcription_id} completed")
            
            elif status == TranscriptionStatus.FAILED:
                if error_message:
                    transcription.error_message = error_message
                logger.error(f"Transcription {transcription_id} failed: {error_message}")
        
        # Update error message
        if error_message is not None:
            transcription.error_message = error_message
        
        transcription.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transcription)
        
        return transcription
    
    @staticmethod
    def get_transcription_by_session(
        db: Session,
        session_id: str
    ) -> Optional[Transcription]:
        """
        Get the most recent transcription for a session.
        
        Args:
            db: Database session
            session_id: Consultation session ID
            
        Returns:
            Transcription object or None
        """
        return db.query(Transcription).filter(
            Transcription.session_id == session_id
        ).order_by(Transcription.created_at.desc()).first()
    
    @staticmethod
    def append_segment(
        db: Session,
        transcription_id: str,
        segment: Dict[str, Any]
    ) -> Transcription:
        """
        Append a new segment to the transcription.
        
        Args:
            db: Database session
            transcription_id: Transcription ID
            segment: Segment data with transcript, timing, confidence, etc.
            
        Returns:
            Updated Transcription object
        """
        transcription = db.query(Transcription).filter(
            Transcription.id == transcription_id
        ).first()
        
        if not transcription:
            raise NotFoundException(f"Transcription {transcription_id} not found")
        
        # Initialize segments list if None
        if transcription.transcript_segments is None:
            transcription.transcript_segments = []
        
        # Append new segment
        transcription.transcript_segments.append(segment)
        
        # Update full transcript
        if segment.get("transcript"):
            if transcription.transcript_text:
                transcription.transcript_text += " " + segment["transcript"]
            else:
                transcription.transcript_text = segment["transcript"]
            
            transcription.word_count = len(transcription.transcript_text.split())
            transcription.character_count = len(transcription.transcript_text)
        
        transcription.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transcription)
        
        return transcription
    
    @staticmethod
    def mark_as_manually_corrected(
        db: Session,
        transcription_id: str,
        corrected_text: str,
        corrected_by_user_id: str,
        correction_notes: Optional[str] = None
    ) -> Transcription:
        """
        Mark transcription as manually corrected.
        
        Args:
            db: Database session
            transcription_id: Transcription ID
            corrected_text: Manually corrected transcript
            corrected_by_user_id: User ID who made corrections
            correction_notes: Notes about corrections
            
        Returns:
            Updated Transcription object
        """
        transcription = db.query(Transcription).filter(
            Transcription.id == transcription_id
        ).first()
        
        if not transcription:
            raise NotFoundException(f"Transcription {transcription_id} not found")
        
        # Store original if not already stored
        if not transcription.original_transcript:
            transcription.original_transcript = transcription.transcript_text
        
        # Update with corrected text
        transcription.transcript_text = corrected_text
        transcription.manually_corrected = True
        transcription.corrected_by = corrected_by_user_id
        
        if correction_notes:
            transcription.correction_notes = correction_notes
        
        transcription.word_count = len(corrected_text.split())
        transcription.character_count = len(corrected_text)
        transcription.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transcription)
        
        logger.info(f"Transcription {transcription_id} manually corrected by user {corrected_by_user_id}")
        
        return transcription
    
    @staticmethod
    def retry_transcription(
        db: Session,
        transcription_id: str
    ) -> Transcription:
        """
        Retry a failed transcription.
        
        Args:
            db: Database session
            transcription_id: Transcription ID
            
        Returns:
            Updated Transcription object
        """
        transcription = db.query(Transcription).filter(
            Transcription.id == transcription_id
        ).first()
        
        if not transcription:
            raise NotFoundException(f"Transcription {transcription_id} not found")
        
        if transcription.processing_status != TranscriptionStatus.FAILED:
            raise ValidationException(
                f"Can only retry failed transcriptions. Current status: {transcription.processing_status}"
            )
        
        transcription.processing_status = TranscriptionStatus.PENDING
        transcription.retry_count += 1
        transcription.error_message = None
        transcription.processing_started_at = datetime.utcnow()
        transcription.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(transcription)
        
        logger.info(f"Retrying transcription {transcription_id} (attempt {transcription.retry_count})")
        
        return transcription
