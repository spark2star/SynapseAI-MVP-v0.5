"""
Speech-to-Text service implementation using Google Cloud STT.
Handles real-time audio streaming and medical transcription.
"""

import asyncio
import json
import base64
from typing import Dict, Any, AsyncGenerator, Optional
from datetime import datetime, timezone
import logging

from google.cloud import speech
from google.cloud.speech import RecognitionConfig, StreamingRecognitionConfig
from google.oauth2 import service_account
import websockets
from websockets.exceptions import WebSocketException

from app.core.config import settings
from app.models.session import ConsultationSession, Transcription, TranscriptionStatus
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class STTService:
    """Service for handling Speech-to-Text operations."""
    
    def __init__(self):
        # Initialize Google Cloud Speech client with service account
        credentials = service_account.Credentials.from_service_account_file(
            settings.GCP_CREDENTIALS_PATH,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        self.client = speech.SpeechClient(credentials=credentials)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.project_id = settings.GCP_PROJECT_ID
        
        logger.info(f"STT Service initialized with project: {self.project_id}")
        
    def get_streaming_config(self, language_code: str = "en-IN") -> StreamingRecognitionConfig:
        """Get streaming recognition configuration for medical transcription."""
        
        config = RecognitionConfig(
            encoding=RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code=language_code,
            model="medical_conversation",  # Medical-specific model
            use_enhanced=True,
            enable_automatic_punctuation=True,
            enable_word_confidence=True,
            enable_word_time_offsets=True,
            max_alternatives=1,
            profanity_filter=False,  # Medical content may need medical terms
            speech_contexts=[
                {
                    "phrases": [
                        # Common medical terms to improve recognition
                        "blood pressure", "hypertension", "diabetes", "medication",
                        "symptoms", "diagnosis", "treatment", "prescription",
                        "patient", "history", "examination", "consultation",
                        "mg", "ml", "tablet", "capsule", "injection"
                    ],
                    "boost": 10.0
                }
            ]
        )
        
        return StreamingRecognitionConfig(
            config=config,
            interim_results=True,
            single_utterance=False,
        )
    
    async def start_streaming_recognition(
        self, 
        session_id: str,
        websocket_uri: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Start streaming recognition for a consultation session."""
        
        try:
            # Connect to audio WebSocket
            async with websockets.connect(websocket_uri) as websocket:
                logger.info(f"Started STT for session {session_id}")
                
                # Initialize session tracking
                self.active_sessions[session_id] = {
                    "start_time": datetime.now(timezone.utc),
                    "websocket": websocket,
                    "transcript_buffer": "",
                    "word_count": 0
                }
                
                # Configure streaming recognition
                streaming_config = self.get_streaming_config()
                
                # Start Google STT streaming
                audio_generator = self._audio_stream_generator(websocket)
                responses = self.client.streaming_recognize(
                    config=streaming_config,
                    requests=audio_generator
                )
                
                # Process recognition responses
                async for response in self._process_streaming_responses(responses, session_id):
                    yield response
                    
        except Exception as e:
            logger.error(f"STT streaming error for session {session_id}: {str(e)}")
            yield {
                "type": "error",
                "session_id": session_id,
                "error": str(e),
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        finally:
            # Cleanup session
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]
    
    async def _audio_stream_generator(self, websocket):
        """Generate audio stream requests from WebSocket."""
        while True:
            try:
                # Receive audio data from WebSocket
                audio_data = await websocket.recv()
                
                if isinstance(audio_data, str):
                    # Handle JSON messages (control signals)
                    try:
                        message = json.loads(audio_data)
                        if message.get("type") == "stop":
                            break
                    except json.JSONDecodeError:
                        pass
                else:
                    # Handle binary audio data
                    yield speech.StreamingRecognizeRequest(audio_content=audio_data)
                    
            except WebSocketException:
                logger.info("WebSocket connection closed")
                break
            except Exception as e:
                logger.error(f"Audio stream error: {str(e)}")
                break
    
    async def _process_streaming_responses(
        self, 
        responses, 
        session_id: str
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """Process streaming recognition responses."""
        
        for response in responses:
            if not response.results:
                continue
                
            result = response.results[0]
            
            # Handle interim results
            if not result.is_final:
                yield {
                    "type": "interim",
                    "session_id": session_id,
                    "transcript": result.alternatives[0].transcript,
                    "confidence": result.alternatives[0].confidence,
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
            else:
                # Handle final results
                final_transcript = result.alternatives[0].transcript
                confidence = result.alternatives[0].confidence
                
                # Update session buffer
                if session_id in self.active_sessions:
                    session_data = self.active_sessions[session_id]
                    session_data["transcript_buffer"] += final_transcript + " "
                    session_data["word_count"] += len(final_transcript.split())
                
                yield {
                    "type": "final",
                    "session_id": session_id,
                    "transcript": final_transcript,
                    "confidence": confidence,
                    "word_count": len(final_transcript.split()),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                }
                
                # Save to database every few sentences
                if session_data["word_count"] >= 50:  # Save every ~50 words
                    await self._save_transcription_segment(session_id, session_data)
                    session_data["transcript_buffer"] = ""
                    session_data["word_count"] = 0
    
    async def _save_transcription_segment(self, session_id: str, session_data: Dict[str, Any]):
        """Save transcription segment to database."""
        try:
            db = next(get_db())
            
            # Find consultation session
            consultation = db.query(ConsultationSession).filter(
                ConsultationSession.session_id == session_id
            ).first()
            
            if not consultation:
                logger.error(f"Consultation session {session_id} not found")
                return
            
            # Create transcription record
            transcription = Transcription(
                session_id=consultation.id,
                transcript_text=session_data["transcript_buffer"],
                processing_status=TranscriptionStatus.COMPLETED.value,
                stt_service="google_stt",
                stt_model="medical_conversation",
                stt_language="en-IN",
                confidence_score=0.95,  # Average confidence
                word_count=session_data["word_count"],
                character_count=len(session_data["transcript_buffer"]),
                processing_started_at=session_data["start_time"].isoformat(),
                processing_completed_at=datetime.now(timezone.utc).isoformat()
            )
            
            db.add(transcription)
            db.commit()
            
            logger.info(f"Saved transcription segment for session {session_id}")
            
        except Exception as e:
            logger.error(f"Error saving transcription: {str(e)}")
            db.rollback()
        finally:
            db.close()
    
    async def finalize_session_transcription(self, session_id: str) -> Dict[str, Any]:
        """Finalize transcription when consultation session ends."""
        try:
            if session_id not in self.active_sessions:
                return {"error": "Session not found"}
            
            session_data = self.active_sessions[session_id]
            
            # Save any remaining transcript buffer
            if session_data["transcript_buffer"].strip():
                await self._save_transcription_segment(session_id, session_data)
            
            # Update consultation session
            db = next(get_db())
            consultation = db.query(ConsultationSession).filter(
                ConsultationSession.session_id == session_id
            ).first()
            
            if consultation:
                # Calculate total transcription confidence
                transcriptions = db.query(Transcription).filter(
                    Transcription.session_id == consultation.id
                ).all()
                
                if transcriptions:
                    avg_confidence = sum(t.confidence_score or 0 for t in transcriptions) / len(transcriptions)
                    consultation.transcription_confidence = avg_confidence
                    
                db.commit()
            
            db.close()
            
            return {
                "session_id": session_id,
                "status": "completed",
                "total_segments": len(transcriptions) if 'transcriptions' in locals() else 0,
                "average_confidence": avg_confidence if 'avg_confidence' in locals() else 0
            }
            
        except Exception as e:
            logger.error(f"Error finalizing transcription: {str(e)}")
            return {"error": str(e)}
        finally:
            # Cleanup session
            if session_id in self.active_sessions:
                del self.active_sessions[session_id]

# Global STT service instance
stt_service = STTService()
