"""
Simple REST API for Speech-to-Text using Google Cloud Speech-to-Text V2
"""

from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
from google.cloud import speech_v2 as speech
from google.api_core.exceptions import GoogleAPIError
import logging
from datetime import datetime
from typing import Dict, Any
import base64

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.models.session import ConsultationSession, SessionStatus
from app.services.transcription_service import TranscriptionService

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Speech client once
try:
    speech_client = speech.SpeechClient()
    logger.info("Google Speech client initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Speech client: {e}")
    speech_client = None

@router.post("/chunk")
async def transcribe_audio_chunk(
    session_id: str = Form(...),
    audio_data: str = Form(...),  # Base64 encoded audio
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Transcribe a chunk of audio using Google Speech-to-Text V2.
    """
    
    if not speech_client:
        raise HTTPException(
            status_code=503,
            detail="Speech-to-Text service unavailable"
        )
    
    try:
        # Verify session exists and belongs to user
        session = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id,
            ConsultationSession.doctor_id == user.id,
            ConsultationSession.status.in_([SessionStatus.IN_PROGRESS, SessionStatus.PAUSED])
        ).first()
        
        if not session:
            raise HTTPException(
                status_code=404,
                detail=f"Active session {session_id} not found"
            )
        
        # Decode base64 audio data
        try:
            audio_bytes = base64.b64decode(audio_data)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid base64 audio data: {str(e)}"
            )
        
        logger.info(f"[STT] Processing {len(audio_bytes)} bytes for session {session_id}")
        # ✅ ADD THIS DEBUG CODE:
        # Check if audio is actually empty/silent
        import numpy as np
        audio_array = np.frombuffer(audio_bytes, dtype=np.int16)
        audio_mean = np.mean(np.abs(audio_array))
        audio_max = np.max(np.abs(audio_array))
        logger.info(f"[STT DEBUG] Audio stats - Mean: {audio_mean}, Max: {audio_max}")

        if audio_max < 100:
            logger.warning(f"[STT] Audio appears to be silent or very quiet!")

        # Configure recognition
        recognition_config = speech.RecognitionConfig(
            explicit_decoding_config=speech.ExplicitDecodingConfig(
                encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                audio_channel_count=1,
            ),
            model=settings.GOOGLE_STT_MODEL,
            language_codes=[settings.GOOGLE_STT_PRIMARY_LANGUAGE],
        )
        
        # Create recognition request
        request = speech.RecognizeRequest(
            recognizer=f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{settings.VERTEX_AI_LOCATION}/recognizers/_",
            config=recognition_config,
            content=audio_bytes
        )
        
        # Call Google Speech API
        response = speech_client.recognize(request=request)
        
        # Extract transcript
        transcript = ""
        confidence = 0.0
        
        if response.results:
            result = response.results[0]
            if result.alternatives:
                alternative = result.alternatives[0]
                transcript = alternative.transcript
                confidence = alternative.confidence if hasattr(alternative, 'confidence') else 0.0
        
        logger.info(f"[STT] Got transcript: '{transcript}' (confidence: {confidence})")
        
        # Update transcription in database
        if transcript.strip():
            transcription = TranscriptionService.get_or_create_transcription(
                db=db,
                session_id=session_id
            )
            
            # Append new transcript
            current_transcript = transcription.transcript_text or ""
            updated_transcript = (current_transcript + " " + transcript).strip()
            
            TranscriptionService.update_transcription(
                db=db,
                transcription_id=transcription.id,
                transcript_text=updated_transcript,
                confidence_score=confidence
            )
        
        return {
            "transcript": transcript,
            "confidence": confidence,
            "language_code": settings.GOOGLE_STT_PRIMARY_LANGUAGE,
            "timestamp": datetime.utcnow().isoformat(),
            "success": True
        }
        
    except GoogleAPIError as e:
        logger.error(f"Google Speech API error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Speech recognition failed: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Transcription error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Internal transcription error: {str(e)}"
        )

@router.get("/session/{session_id}")
async def get_session_transcript(
    session_id: str,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get complete transcript for a session.
    """
    
    # Verify session
    session = db.query(ConsultationSession).filter(
        ConsultationSession.session_id == session_id,
        ConsultationSession.doctor_id == user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=404,
            detail=f"Session {session_id} not found"
        )
    
    # Get transcription
    transcription = TranscriptionService.get_transcription_by_session(
        db=db,
        session_id=session_id
    )
    
    return {
        "session_id": session_id,
        "transcript": transcription.transcript_text if transcription else "",
        "confidence": transcription.confidence_score if transcription else 0.0,
        "status": transcription.status if transcription else "NOT_STARTED",
        "timestamp": datetime.utcnow().isoformat()
    }
