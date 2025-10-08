"""
OLD WEBSOCKET IMPLEMENTATION - DEPRECATED
Use REST API endpoint instead: app/api/api_v1/endpoints/transcribe.py
Keeping this file for reference only.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, status
from sqlalchemy.orm import Session
from google.cloud import speech_v2 as speech
from google.api_core.exceptions import GoogleAPIError
from google.auth import default as google_auth_default
from datetime import datetime
import asyncio
import json
import logging
import os
from typing import AsyncIterator, Optional, Dict, Any, List

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user_from_websocket
from app.models.user import User
from app.models.session import ConsultationSession, SessionStatus
from app.services.transcription_service import TranscriptionService

router = APIRouter()
logger = logging.getLogger(__name__)

# Set Google credentials
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = settings.GOOGLE_APPLICATION_CREDENTIALS


@router.websocket("/transcribe")
async def transcribe_websocket(
    websocket: WebSocket,
    token: str,
    session_id: str
):
    """
    Real-time audio transcription WebSocket endpoint.
    
    Query Parameters:
        - token: JWT authentication token
        - session_id: Active ConsultationSession ID
    
    Protocol:
        Client -> Server: Binary audio chunks (WEBM_OPUS format)
        Server -> Client: JSON transcription results
            {
                "transcript": "transcribed text",
                "is_final": true/false,
                "confidence": 0.95,
                "language_code": "hi-IN",
                "speaker_tag": 1,
                "words": [
                    {
                        "word": "hello",
                        "start_time": 0.0,
                        "end_time": 0.5,
                        "confidence": 0.95,
                        "speaker_tag": 1
                    }
                ],
                "timestamp": "2025-09-30T12:00:00.000Z"
            }
    
    Error Messages:
        {
            "error": "error description",
            "code": "ERROR_CODE",
            "detail": "detailed error message"
        }
    """
    
    await websocket.accept()
    logger.info(f"WebSocket connection request for session {session_id}")
    
    # Database session management
    db: Optional[Session] = None
    user: Optional[User] = None
    transcription = None
    full_transcript = ""
    segment_buffer: List[Dict[str, Any]] = []
    
    try:
        # Get database session
        db = next(get_db())
        
        # Authenticate user via WebSocket
        user = await get_current_user_from_websocket(websocket, token, db)
        
        # Verify session belongs to user and is active
        session = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id,
            ConsultationSession.doctor_id == user.id,
            ConsultationSession.status.in_([SessionStatus.IN_PROGRESS, SessionStatus.PAUSED])
        ).first()
        
        if not session:
            await websocket.send_json({
                "error": "Session not found or not active",
                "code": "SESSION_NOT_FOUND",
                "detail": f"No active session found with ID {session_id} for user {user.id}"
            })
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        logger.info(f"WebSocket authenticated for user {user.id}, session {session_id}")
        
        # Send connection success message
        await websocket.send_json({
            "status": "connected",
            "message": "Transcription service ready",
            "session_id": session_id
        })
        
        # Create or get transcription record
        transcription = TranscriptionService.get_or_create_transcription(
            db=db,
            session_id=session_id
        )
        
        logger.info(f"Using transcription ID {transcription.id} for session {session_id}")
        
        # Initialize Vertex AI Speech client
        try:
            client = speech.SpeechClient()
            logger.info("Vertex AI Speech client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI client: {str(e)}")
            await websocket.send_json({
                "error": "Transcription service unavailable",
                "code": "SERVICE_INIT_FAILED",
                "detail": str(e)
            })
            await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
            return
        
        # Configure recognition
        # Configure recognition
        recognition_config = speech.RecognitionConfig(
            explicit_decoding_config=speech.ExplicitDecodingConfig(
                encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,  # Fixed for browser microphone
                audio_channel_count=1,
            ),
            model=settings.GOOGLE_STT_MODEL,
            language_codes=[settings.GOOGLE_STT_PRIMARY_LANGUAGE],
            # REMOVED features - not supported for Marathi with latest_long
        )

        
        streaming_config = speech.StreamingRecognitionConfig(
            config=recognition_config,
            streaming_features=speech.StreamingRecognitionFeatures(
                interim_results=settings.GOOGLE_STT_INTERIM_RESULTS
            )
        )
        
        logger.info(f"Recognition configured: model={settings.GOOGLE_STT_MODEL}, language={settings.GOOGLE_STT_PRIMARY_LANGUAGE}")
        
        try:
            running_loop = asyncio.get_running_loop()
        except RuntimeError:
            logger.error("No running event loop found")
            await websocket.send_json({
                "error": "Internal server error",
                "code": "NO_EVENT_LOOP"
            })
            return


        def audio_stream_generator():
            """
            Synchronous generator for gRPC - bridges async WebSocket to sync gRPC.
            """
            import queue
            import threading
            
            audio_queue = queue.Queue(maxsize=100)
            stop_event = threading.Event()
            exception_holder = [None]
            
            # Get the main event loop (where websocket lives)
            main_loop = running_loop
            
            async def receive_audio_chunk():
                """Single audio chunk receiver (runs in main loop)"""
                try:
                    return await asyncio.wait_for(websocket.receive_bytes(), timeout=10.0)
                except asyncio.TimeoutError:
                    return None
                except Exception as e:
                    logger.error(f"Error receiving audio: {e}")
                    return None
            
            def receiver_worker():
                """Background thread that schedules async receives"""
                chunk_count = 0
                try:
                    while not stop_event.is_set():
                        # Schedule the async receive in the main loop
                        future = asyncio.run_coroutine_threadsafe(receive_audio_chunk(), main_loop)
                        try:
                            audio_chunk = future.result(timeout=15.0)
                        except Exception as e:
                            logger.error(f"Future error: {e}")
                            break
                        
                        if audio_chunk is None or len(audio_chunk) == 0:
                            logger.warning("No audio received, stopping")
                            break
                        
                        audio_queue.put(audio_chunk)
                        chunk_count += 1
                        
                        if chunk_count % 100 == 0:
                            logger.info(f"Received {chunk_count} audio chunks")
                            
                except Exception as e:
                    logger.error(f"Receiver error: {e}")
                    exception_holder[0] = e
                finally:
                    audio_queue.put(None)
                    logger.info(f"Receiver ended: {chunk_count} chunks")
            
            # Start receiver thread
            receiver_thread = threading.Thread(target=receiver_worker, daemon=True)
            receiver_thread.start()
            
            # First yield: config
            yield speech.StreamingRecognizeRequest(
                recognizer=f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{settings.VERTEX_AI_LOCATION}/recognizers/_",
                streaming_config=streaming_config
            )
            logger.info("Sent initial config to Vertex AI")
            
            # Subsequent yields: audio chunks
            chunk_count = 0
            while True:
                try:
                    audio_chunk = audio_queue.get(timeout=20.0)
                    if audio_chunk is None:
                        break
                    
                    chunk_count += 1
                    if chunk_count % 50 == 0:
                        logger.info(f"Streamed {chunk_count} chunks to Vertex AI")
                    
                    yield speech.StreamingRecognizeRequest(audio=audio_chunk)
                    
                except queue.Empty:
                    logger.warning("Audio queue timeout")
                    break
            
            stop_event.set()
            receiver_thread.join(timeout=2.0)
            logger.info(f"Audio stream completed: {chunk_count} chunks sent to Vertex AI")
            
            if exception_holder[0]:
                raise exception_holder[0]



        

        
        # Start streaming recognition
        logger.info("Starting Vertex AI streaming recognition...")
        
        try:
            responses = client.streaming_recognize(
            requests=audio_stream_generator()  # This is now async!
            )

            
            # Process transcription responses
            response_count = 0
            
            for response in responses:
                response_count += 1
                
                if not response.results:
                    continue
                
                result = response.results[0]
                
                if not result.alternatives:
                    continue
                
                alternative = result.alternatives[0]
                transcript = alternative.transcript
                is_final = result.is_final
                confidence = alternative.confidence if hasattr(alternative, 'confidence') else 0.0
                language_code = result.language_code if hasattr(result, 'language_code') else settings.GOOGLE_STT_PRIMARY_LANGUAGE
                
                # Extract word-level timing and speaker info
                words_data = []
                if hasattr(alternative, 'words') and alternative.words:
                    for word_info in alternative.words:
                        word_data = {
                            "word": word_info.word,
                            "start_time": word_info.start_offset.total_seconds() if hasattr(word_info, 'start_offset') and word_info.start_offset else 0.0,
                            "end_time": word_info.end_offset.total_seconds() if hasattr(word_info, 'end_offset') and word_info.end_offset else 0.0,
                            "confidence": word_info.confidence if hasattr(word_info, 'confidence') else 0.0,
                        }
                        
                        # Add speaker tag if diarization is enabled
                        if hasattr(word_info, 'speaker_label'):
                            word_data["speaker_tag"] = word_info.speaker_label
                        
                        words_data.append(word_data)
                
                # Determine speaker tag (use first word's speaker if available)
                speaker_tag = words_data[0].get("speaker_tag") if words_data else None
                
                # Send result to client
                result_data = {
                    "transcript": transcript,
                    "is_final": is_final,
                    "confidence": confidence,
                    "language_code": language_code,
                    "speaker_tag": speaker_tag,
                    "words": words_data,
                    "timestamp": datetime.utcnow().isoformat()
                }
                
                await websocket.send_json(result_data)
                
                # Update transcription in database for final results
                if is_final:
                    full_transcript += transcript + " "
                    
                    segment_data = {
                        "transcript": transcript,
                        "confidence": confidence,
                        "language_code": language_code,
                        "speaker_tag": speaker_tag,
                        "words": words_data,
                        "timestamp": datetime.utcnow().isoformat(),
                        "is_final": True
                    }
                    
                    segment_buffer.append(segment_data)
                    
                    # Update transcription record
                    TranscriptionService.update_transcription(
                        db=db,
                        transcription_id=transcription.id,
                        transcript_text=full_transcript.strip(),
                        segments=segment_buffer,
                        confidence_score=confidence,
                        status=None  # Keep status as IN_PROGRESS
                    )
                    
                    logger.debug(f"Updated transcription with final result #{response_count}")
            
            # Mark transcription as completed
            if transcription:
                TranscriptionService.update_transcription(
                    db=db,
                    transcription_id=transcription.id,
                    status="COMPLETED"
                )
            
            logger.info(f"Transcription completed for session {session_id}. Total responses: {response_count}")
            
            # Send completion message
            await websocket.send_json({
                "status": "completed",
                "message": "Transcription finished successfully",
                "total_responses": response_count,
                "full_transcript": full_transcript.strip()
            })
        
        except GoogleAPIError as e:
            logger.error(f"Vertex AI API error: {str(e)}")
            await websocket.send_json({
                "error": "Transcription service error",
                "code": "VERTEX_AI_ERROR",
                "detail": str(e)
            })
            
            if transcription:
                TranscriptionService.update_transcription(
                    db=db,
                    transcription_id=transcription.id,
                    status="FAILED",
                    error_message=f"Vertex AI error: {str(e)}"
                )
    
    except WebSocketDisconnect:
        logger.info(f"Client disconnected for session {session_id}")
        
        # Update transcription status on disconnect
        if transcription and db:
            try:
                TranscriptionService.update_transcription(
                    db=db,
                    transcription_id=transcription.id,
                    status="PAUSED"
                )
            except Exception as e:
                logger.error(f"Error updating transcription on disconnect: {str(e)}")
    
    except Exception as e:
        logger.error(f"Unexpected error in transcription WebSocket: {str(e)}", exc_info=True)
        try:
            await websocket.send_json({
                "error": "Internal server error",
                "code": "INTERNAL_ERROR",
                "detail": str(e)
            })
        except:
            pass
        
        # Update transcription status on error
        if transcription and db:
            try:
                TranscriptionService.update_transcription(
                    db=db,
                    transcription_id=transcription.id,
                    status="FAILED",
                    error_message=f"Unexpected error: {str(e)}"
                )
            except Exception as update_error:
                logger.error(f"Error updating transcription on failure: {str(update_error)}")
    
    finally:
        # Cleanup
        try:
            if websocket.client_state.value == 1:  # CONNECTED
                await websocket.close()
        except:
            pass
        
        # Close database session
        if db:
            try:
                db.close()
            except:
                pass
        
        logger.info(f"WebSocket closed and cleaned up for session {session_id}")
