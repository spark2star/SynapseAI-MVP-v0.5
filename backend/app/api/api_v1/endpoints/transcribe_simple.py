"""
Simple REST API for audio transcription.
Replaces complex WebSocket streaming with straightforward HTTP requests.
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
from google.cloud import speech_v2 as speech
from google.api_core.exceptions import GoogleAPIError
import logging
import io
import tempfile
import os
import subprocess
import wave
import numpy as np

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.models.user import User
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)


@router.post("/chunk")
async def transcribe_audio_chunk(
    session_id: str,
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe a single audio chunk (5-10 seconds).
    Returns transcription immediately via simple HTTP response.
    
    Much simpler than WebSocket - no async/threading complexity.
    """
    import traceback
    import sys
    
    # Forces output to terminal
    print("\n" + "="*80, file=sys.stderr)
    print("🎯 [SIMPLE] transcribe_simple.py CALLED!", file=sys.stderr)
    print("="*80 + "\n", file=sys.stderr)
    
    logger.info(f"🎯 [STT] Starting transcription for session: {session_id}")
    logger.info(f"👤 [STT] User ID: {current_user.id}")
    logger.info(f"📂 [STT] Audio file: {audio.filename}, content_type: {audio.content_type}")
    
    wav_path = None  # 🔥 DEFINE THIS AT TOP SCOPE
    temp_audio_path = None
    
    try:
        logger.info(f"📥 [STT] Step 1: Reading audio data...")
        audio_content = await audio.read()
        logger.info(f"✅ [STT] Step 1 complete: Audio read successfully - {len(audio_content)} bytes")
        
        if len(audio_content) == 0:
            logger.warning("⚠️ [STT] Empty audio chunk received")
            return {
                "status": "success",
                "transcript": "",
                "confidence": 0.0,
                "session_id": session_id,
                "message": "Empty audio chunk"
            }
        
        # Initialize Speech client
        logger.info("🔌 [STT] Step 2: Initializing Google Speech client...")
        client = speech.SpeechClient()
        logger.info("✅ [STT] Step 2 complete: Speech client initialized")
        
        # Save WEBM to temporary file for conversion (Google needs WAV/FLAC/MP3)
        logger.info("🔄 [STT] Step 2.5: Saving audio to temp file for processing...")
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
            temp_audio.write(audio_content)
            temp_audio_path = temp_audio.name
        logger.info(f"✅ [STT] Audio saved to: {temp_audio_path}")
        
        try:
            # Convert WEBM to WAV using ffmpeg (install with: brew install ffmpeg)
            logger.info("🔄 [STT] Step 2.6: Converting WEBM to WAV...")
            wav_path = temp_audio_path.replace(".webm", ".wav")
            
            subprocess.run([
                "ffmpeg", "-i", temp_audio_path,
                "-acodec", "pcm_s16le",
                "-ar", "16000",  # 16kHz sample rate
                "-ac", "1",      # Mono
                wav_path
            ], check=True, capture_output=True)
            
            logger.info(f"✅ [STT] Conversion complete: {wav_path}")
            
            # 🔥 CHECK AUDIO LEVELS BEFORE READING
            try:
                with wave.open(wav_path, 'rb') as wf:
                    frames = wf.readframes(wf.getnframes())
                    audio_data = np.frombuffer(frames, dtype=np.int16)
                    max_amplitude = np.max(np.abs(audio_data))
                    avg_amplitude = np.mean(np.abs(audio_data))
                    duration = wf.getnframes() / wf.getframerate()
                    
                    logger.info(f"🎤 [STT] Audio amplitude check: max={max_amplitude}, avg={avg_amplitude:.1f}, duration={duration:.2f}s")
                    
                    if max_amplitude < 100:
                        logger.warning("⚠️ [STT] Audio amplitude is TOO LOW - microphone might be muted or not selected!")
                    else:
                        logger.info(f"✅ [STT] Audio levels OK - microphone is working!")
            except Exception as amp_err:
                logger.warning(f"⚠️ [STT] Could not check audio amplitude: {str(amp_err)}")
            
            # Read converted WAV
            with open(wav_path, "rb") as f:
                audio_content = f.read()
            logger.info(f"✅ [STT] WAV file read: {len(audio_content)} bytes")
            
            # Clean up temp files
            os.unlink(temp_audio_path)
            os.unlink(wav_path)
            
        except FileNotFoundError:
            logger.error("❌ [STT] ffmpeg not found! Install with: brew install ffmpeg (macOS) or apt install ffmpeg (Linux)")
            if temp_audio_path:
                os.unlink(temp_audio_path)
            raise HTTPException(
                status_code=500,
                detail="Audio conversion failed: ffmpeg not installed"
            )
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ [STT] ffmpeg conversion failed: {e.stderr.decode()}")
            if temp_audio_path:
                os.unlink(temp_audio_path)
            raise HTTPException(
                status_code=500,
                detail=f"Audio conversion failed: {e.stderr.decode()}"
            )
        
        # Configure recognition for WAV (LINEAR16)
        logger.info("⚙️ [STT] Step 3: Creating recognition config...")
        config = speech.RecognitionConfig(
            explicit_decoding_config=speech.ExplicitDecodingConfig(
                encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,  # WAV format
                sample_rate_hertz=16000,  # Converted to 16kHz
                audio_channel_count=1,
            ),
            model="latest_long",
            language_codes=["mr-IN", "hi-IN", "en-IN"],  # Marathi, Hindi, English
        )
        logger.info(f"✅ [STT] Step 3 complete: Config created (model=long, languages=mr-IN,hi-IN,en-IN, encoding=LINEAR16)")
        
        # Create recognition request
        logger.info(f"📋 [STT] Step 4: Creating recognition request...")
        recognizer_path = f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{settings.VERTEX_AI_LOCATION}/recognizers/_"
        logger.info(f"🎯 [STT] Recognizer path: {recognizer_path}")
        
        request = speech.RecognizeRequest(
            recognizer=recognizer_path,
            config=config,
            content=audio_content
        )
        logger.info(f"✅ [STT] Step 4 complete: Request object created")
        
        logger.info(f"🚀 [STT] Step 5: Calling Google Speech API...")

        # Transcribe with timeout
        try:
            response = client.recognize(
                request=request,
                timeout=30.0  # 30 second timeout
            )
            logger.info(f"✅ [STT] Step 5 complete: Got response from Google Speech API")
        except Exception as api_error:
            logger.error(f"❌ [STT] Google Speech API call failed: {str(api_error)}")
            logger.error(f"📋 [STT] Error type: {type(api_error).__name__}")
            raise

        # Extract transcript
        logger.info(f"📝 [STT] Step 6: Extracting transcript from response...")
        transcript = ""
        confidence = 0.0
        
        if response.results:
            logger.info(f"📊 [STT] Got {len(response.results)} results from Speech API")
            for idx, result in enumerate(response.results):
                if result.alternatives:
                    alt = result.alternatives[0]
                    transcript += alt.transcript + " "
                    if hasattr(alt, 'confidence'):
                        confidence = max(confidence, alt.confidence)
                    logger.info(f"  Result {idx+1}: '{alt.transcript}' (confidence: {alt.confidence if hasattr(alt, 'confidence') else 'N/A'})")
        else:
            logger.warning("⚠️ [STT] No results from Speech API (silence detected)")
        
        transcript = transcript.strip()
        logger.info(f"✅ [STT] Step 6 complete: Transcription extracted")
        logger.info(f"📄 [STT] Final transcript: '{transcript[:100]}...' (length: {len(transcript)}, confidence: {confidence:.2f})")
        
        logger.info(f"🎉 [STT] Step 7: Returning successful response")
        return {
            "status": "success",
            "transcript": transcript,
            "confidence": confidence,
            "session_id": session_id
        }
        
    except GoogleAPIError as e:
        error_traceback = traceback.format_exc()
        logger.error(f"❌ [STT] GOOGLE API ERROR: {str(e)}")
        logger.error(f"📋 [STT] Error type: {type(e).__name__}")
        logger.error(f"📋 [STT] Full traceback:\n{error_traceback}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "google_api_error",
                "message": f"Google Speech API error: {str(e)}"
            }
        )
    except Exception as e:
        error_traceback = traceback.format_exc()
        logger.error(f"❌ [STT] TRANSCRIPTION ERROR: {str(e)}")
        logger.error(f"📋 [STT] Error type: {type(e).__name__}")
        logger.error(f"📋 [STT] Full traceback:\n{error_traceback}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "transcription_error",
                "message": f"Transcription failed: {str(e)}"
            }
        )


@router.get("/health")
async def transcribe_health():
    """Health check for transcription service."""
    return {
        "status": "ok",
        "service": "transcription",
        "type": "rest_api",
        "message": "Simple REST transcription service ready"
    }
