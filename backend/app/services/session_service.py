"""
Consultation session service layer.
Handles business logic for session management.
"""

from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import logging

from app.models.session import ConsultationSession, SessionStatus, SessionType, Transcription
from app.models.patient import Patient
from app.core.encryption import create_session_id
from app.core.exceptions import (
    SessionNotFoundException,
    PatientNotFoundException,
    SessionAlreadyActiveException,
    SessionNotActiveException,
    BusinessLogicException
)

logger = logging.getLogger(__name__)


class SessionService:
    """Service for managing consultation sessions."""
    
    @staticmethod
    def create_session(
        db: Session,
        patient_id: str,
        doctor_id: str,
        session_type: str = SessionType.CONSULTATION.value,
        chief_complaint: Optional[str] = None,
        notes: Optional[str] = None,
        recording_settings: Optional[Dict[str, Any]] = None,
        stt_settings: Optional[Dict[str, Any]] = None
    ) -> ConsultationSession:
        """
        Create a new consultation session.
        
        Args:
            db: Database session
            patient_id: Patient ID
            doctor_id: Doctor user ID
            session_type: Type of session
            chief_complaint: Main reason for visit
            notes: Session notes
            recording_settings: Recording configuration
            stt_settings: STT configuration
            
        Returns:
            Created ConsultationSession
            
        Raises:
            PatientNotFoundException: If patient doesn't exist
            SessionAlreadyActiveException: If active session exists for patient
        """
        # Verify patient exists
        patient = db.query(Patient).filter(Patient.id == patient_id).first()
        if not patient:
            raise PatientNotFoundException(patient_id)
        
        # Check for active sessions
        active_session = db.query(ConsultationSession).filter(
            ConsultationSession.patient_id == patient_id,
            ConsultationSession.status.in_([
                SessionStatus.IN_PROGRESS.value,
                SessionStatus.PAUSED.value
            ])
        ).first()
        
        if active_session:
            raise SessionAlreadyActiveException(patient_id)
        
        # Create session
        session = ConsultationSession(
            session_id=create_session_id(),
            patient_id=patient_id,
            doctor_id=doctor_id,
            session_type=session_type,
            status=SessionStatus.IN_PROGRESS.value,
            started_at=datetime.now(timezone.utc).isoformat(),
            chief_complaint=chief_complaint,
            notes=notes,
            recording_settings=recording_settings,
            stt_settings=stt_settings
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        logger.info(f"Created session {session.session_id} for patient {patient_id}")
        return session
    
    @staticmethod
    def get_session_by_id(
        db: Session,
        session_id: str,
        doctor_id: Optional[str] = None
    ) -> ConsultationSession:
        """
        Get session by ID with optional doctor access control.
        
        Args:
            db: Database session
            session_id: Session ID (UUID or session_id)
            doctor_id: Optional doctor ID for access control
            
        Returns:
            ConsultationSession
            
        Raises:
            SessionNotFoundException: If session not found or access denied
        """
        query = db.query(ConsultationSession).filter(
            (ConsultationSession.id == session_id) | 
            (ConsultationSession.session_id == session_id)
        )
        
        if doctor_id:
            query = query.filter(ConsultationSession.doctor_id == doctor_id)
        
        session = query.first()
        if not session:
            raise SessionNotFoundException(session_id)
        
        return session
    
    @staticmethod
    def update_session(
        db: Session,
        session_id: str,
        doctor_id: str,
        **updates
    ) -> ConsultationSession:
        """
        Update session fields.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            **updates: Fields to update
            
        Returns:
            Updated ConsultationSession
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        for field, value in updates.items():
            if hasattr(session, field) and value is not None:
                setattr(session, field, value)
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Updated session {session_id}")
        return session
    
    @staticmethod
    def pause_session(
        db: Session,
        session_id: str,
        doctor_id: str
    ) -> ConsultationSession:
        """
        Pause an in-progress session.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            
        Returns:
            Updated ConsultationSession
            
        Raises:
            SessionNotActiveException: If session is not in progress
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        if session.status != SessionStatus.IN_PROGRESS.value:
            raise SessionNotActiveException(session_id)
        
        session.status = SessionStatus.PAUSED.value
        session.paused_at = datetime.now(timezone.utc).isoformat()
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Paused session {session_id}")
        return session
    
    @staticmethod
    def resume_session(
        db: Session,
        session_id: str,
        doctor_id: str
    ) -> ConsultationSession:
        """
        Resume a paused session.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            
        Returns:
            Updated ConsultationSession
            
        Raises:
            BusinessLogicException: If session is not paused
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        if session.status != SessionStatus.PAUSED.value:
            raise BusinessLogicException(
                f"Session {session_id} is not paused (status: {session.status})"
            )
        
        session.status = SessionStatus.IN_PROGRESS.value
        session.resumed_at = datetime.now(timezone.utc).isoformat()
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Resumed session {session_id}")
        return session
    
    @staticmethod
    def complete_session(
        db: Session,
        session_id: str,
        doctor_id: str
    ) -> ConsultationSession:
        """
        Complete a session and calculate duration.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            
        Returns:
            Completed ConsultationSession
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        if session.status not in [SessionStatus.IN_PROGRESS.value, SessionStatus.PAUSED.value]:
            raise BusinessLogicException(
                f"Session {session_id} cannot be completed (status: {session.status})"
            )
        
        # Complete session
        ended_at = datetime.now(timezone.utc)
        session.status = SessionStatus.COMPLETED.value
        session.ended_at = ended_at.isoformat()
        
        # Calculate duration
        if session.started_at:
            try:
                started = datetime.fromisoformat(session.started_at.replace('Z', '+00:00'))
                duration_seconds = (ended_at - started).total_seconds()
                session.total_duration = duration_seconds / 60  # Convert to minutes
            except ValueError:
                logger.warning(f"Could not calculate duration for session {session_id}")
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Completed session {session_id} (duration: {session.total_duration:.2f} minutes)")
        return session
    
    @staticmethod
    def cancel_session(
        db: Session,
        session_id: str,
        doctor_id: str,
        reason: Optional[str] = None
    ) -> ConsultationSession:
        """
        Cancel a session.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            reason: Cancellation reason
            
        Returns:
            Cancelled ConsultationSession
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        session.status = SessionStatus.CANCELLED.value
        session.ended_at = datetime.now(timezone.utc).isoformat()
        
        if reason:
            session.notes = f"{session.notes or ''}\n\nCancellation reason: {reason}".strip()
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Cancelled session {session_id}")
        return session
    
    @staticmethod
    def upload_audio(
        db: Session,
        session_id: str,
        doctor_id: str,
        audio_file_url: str,
        audio_file_size: int,
        audio_format: str,
        audio_duration: Optional[float] = None
    ) -> ConsultationSession:
        """
        Update session with audio file information.
        
        Args:
            db: Database session
            session_id: Session ID
            doctor_id: Doctor ID for access control
            audio_file_url: Cloud storage URL
            audio_file_size: File size in bytes
            audio_format: Audio format (mp3, wav, etc.)
            audio_duration: Duration in seconds
            
        Returns:
            Updated ConsultationSession
        """
        session = SessionService.get_session_by_id(db, session_id, doctor_id)
        
        session.audio_file_url = audio_file_url
        session.audio_file_size = audio_file_size
        session.audio_format = audio_format
        session.audio_duration = audio_duration
        
        db.commit()
        db.refresh(session)
        
        logger.info(f"Uploaded audio for session {session_id}")
        return session
    
    @staticmethod
    def list_sessions_by_doctor(
        db: Session,
        doctor_id: str,
        skip: int = 0,
        limit: int = 100,
        status: Optional[str] = None
    ) -> List[ConsultationSession]:
        """
        List sessions for a doctor with optional filtering.
        
        Args:
            db: Database session
            doctor_id: Doctor user ID
            skip: Number of records to skip
            limit: Maximum records to return
            status: Optional status filter
            
        Returns:
            List of ConsultationSession
        """
        query = db.query(ConsultationSession).filter(
            ConsultationSession.doctor_id == doctor_id
        )
        
        if status:
            query = query.filter(ConsultationSession.status == status)
        
        sessions = query.order_by(
            ConsultationSession.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return sessions
    
    @staticmethod
    def list_sessions_by_patient(
        db: Session,
        patient_id: str,
        doctor_id: str,
        skip: int = 0,
        limit: int = 100
    ) -> List[ConsultationSession]:
        """
        List sessions for a patient.
        
        Args:
            db: Database session
            patient_id: Patient ID
            doctor_id: Doctor ID for access control
            skip: Number of records to skip
            limit: Maximum records to return
            
        Returns:
            List of ConsultationSession
        """
        sessions = db.query(ConsultationSession).filter(
            ConsultationSession.patient_id == patient_id,
            ConsultationSession.doctor_id == doctor_id
        ).order_by(
            ConsultationSession.created_at.desc()
        ).offset(skip).limit(limit).all()
        
        return sessions
