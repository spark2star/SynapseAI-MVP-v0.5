from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging
import asyncio
from queue import Queue
import threading
from typing import Optional

from google.cloud import speech_v2 as speech

from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Speech client
# speech_client = speech.SpeechClient()



# Lazy initialization of Speech client (initialized on first use)
_speech_client: Optional[speech.SpeechClient] = None

def get_speech_client() -> speech.SpeechClient:
    """
    Get or create Speech client instance.
    Uses lazy initialization to defer client creation until after credentials are set.
    Thread-safe singleton pattern.
    """
    global _speech_client
    if _speech_client is None:
        try:
            _speech_client = speech.SpeechClient()
            logger.info("✅ Speech client initialized successfully")
        except Exception as e:
            logger.error(f"❌ Failed to initialize Speech client: {e}")
            raise
    return _speech_client


@router.websocket("/stream/{session_id}")
async def transcribe_stream(
    websocket: WebSocket,
    session_id: str,
):
    """
    WebSocket endpoint for real-time streaming transcription
    """
    await websocket.accept()
    logger.info(f"[STREAM] WebSocket connected for session {session_id}")
    
    # Queue to bridge async websocket and sync Google API
    audio_queue = Queue()
    
    try:
        # Configuration
        recognizer = f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/global/recognizers/_"
        
        config = speech.StreamingRecognitionConfig(
            config=speech.RecognitionConfig(
                explicit_decoding_config=speech.ExplicitDecodingConfig(
                    encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                    sample_rate_hertz=16000,
                    audio_channel_count=1,
                ),
                language_codes=["hi-IN", "mr-IN", "en-IN"],  # Max 3
                model="long",
                features=speech.RecognitionFeatures(
                    enable_word_time_offsets=False,
                ),
            ),
            streaming_features=speech.StreamingRecognitionFeatures(
                interim_results=True,
                enable_voice_activity_events=True,
            ),
        )

        
        # ✅ SYNCHRONOUS generator for Google API
        def audio_generator():
            # First request: config
            yield speech.StreamingRecognizeRequest(
                recognizer=recognizer,
                streaming_config=config,
            )
            
            # Subsequent requests: audio data from queue
            while True:
                chunk = audio_queue.get()
                if chunk is None:  # Sentinel to stop
                    break
                logger.info(f"[STREAM] Sending {len(chunk)} bytes to Google")
                yield speech.StreamingRecognizeRequest(audio=chunk)
        
        # Task to receive audio from websocket and put in queue
        async def receive_audio():
            try:
                while True:
                    data = await websocket.receive_bytes()
                    logger.info(f"[STREAM] Received {len(data)} bytes from frontend")
                    audio_queue.put(data)
            except WebSocketDisconnect:
                logger.info(f"[STREAM] WebSocket disconnected")
                audio_queue.put(None)  # Signal end
        

        # Task to process Google responses and send to frontend
        async def process_responses():
            try:
                # Run Google streaming_recognize in thread pool (it's synchronous)
                loop = asyncio.get_event_loop()
                responses = await loop.run_in_executor(
                    None,
                    lambda: get_speech_client().streaming_recognize(requests=audio_generator())
                )
                
                # Process responses
                for response in responses:
                    logger.info(f"[STREAM] Got response from Google")
                    
                    # ✅ HANDLE VAD EVENTS (Voice Activity Detection)
                    if response.speech_event_type:
                        event_type = response.speech_event_type
                        logger.info(f"[STREAM] 🎤 VAD Event: {event_type}")
                        
                        if event_type == speech.StreamingRecognizeResponse.SpeechEventType.SPEECH_ACTIVITY_BEGIN:
                            # User started speaking
                            await websocket.send_json({
                                "type": "vad_event",
                                "event": "speech_start",
                                "message": "Speech detected"
                            })
                            
                        elif event_type == speech.StreamingRecognizeResponse.SpeechEventType.SPEECH_ACTIVITY_END:
                            # User stopped speaking - can finalize here
                            await websocket.send_json({
                                "type": "vad_event",
                                "event": "speech_end",
                                "message": "Speech ended"
                            })
                            logger.info("[STREAM] 🎤 User stopped speaking")
                    
                    # Process transcript results
                    for result in response.results:
                        if not result.alternatives:
                            continue
                        
                        transcript = result.alternatives[0].transcript
                        is_final = result.is_final
                        confidence = getattr(result.alternatives[0], 'confidence', 0.0)
                        
                        logger.info(f"[STREAM] Transcript: '{transcript}' (final: {is_final}, confidence: {confidence:.2f})")
                        
                        # Send to frontend
                        await websocket.send_json({
                            "type": "transcript",
                            "transcript": transcript,
                            "is_final": is_final,
                            "confidence": confidence,
                        })
                        
            except Exception as e:
                logger.error(f"[STREAM] Error in process_responses: {e}", exc_info=True)
                try:
                    await websocket.send_json({
                        "type": "error",
                        "message": str(e)
                    })
                except:
                    pass

        
        # Run both tasks concurrently
        await asyncio.gather(
            receive_audio(),
            process_responses(),
        )
        
    except WebSocketDisconnect:
        logger.info(f"[STREAM] WebSocket disconnected for session {session_id}")
    except Exception as e:
        logger.error(f"[STREAM] Error: {e}", exc_info=True)
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
    finally:
        audio_queue.put(None)  # Clean shutdown
        logger.info(f"[STREAM] Closing session {session_id}")
