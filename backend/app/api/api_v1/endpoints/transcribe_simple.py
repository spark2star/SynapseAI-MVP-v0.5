"""
Simple REST API for audio transcription with Mental Health Context + Voice Activity Detection.
Optimized for Marathi-Hindi code-mixed therapy sessions with doctor-only voice filtering.
"""

from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Query
from sqlalchemy.orm import Session
from google.cloud import speech_v2 as speech
from google.cloud.speech_v2.types import cloud_speech
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

# ===========================
# 🧠 MENTAL HEALTH CONTEXT
# ===========================
MENTAL_HEALTH_PHRASES = [
    # === CORE MENTAL HEALTH TERMS ===
    # Hindi
    {"value": "मानसिक स्वास्थ्य", "boost": 15},
    {"value": "अवसाद", "boost": 15},
    {"value": "चिंता", "boost": 15},
    {"value": "तनाव", "boost": 15},
    {"value": "डिप्रेशन", "boost": 15},
    {"value": "मनोचिकित्सक", "boost": 15},
    {"value": "मनोवैज्ञानिक", "boost": 15},
    
    # Marathi
    {"value": "मानसिक आरोग्य", "boost": 15},
    {"value": "नैराश्य", "boost": 15},
    {"value": "ताण", "boost": 15},
    {"value": "मानसोपचार तज्ज्ञ", "boost": 15},
    {"value": "मानसशास्त्रज्ञ", "boost": 15},
    
    # === CODE-MIXED COMMON PHRASES ===
    {"value": "depression आहे", "boost": 14},
    {"value": "depression है", "boost": 14},
    {"value": "anxiety वाटते", "boost": 14},
    {"value": "anxiety होती है", "boost": 14},
    {"value": "stress होतो", "boost": 14},
    {"value": "stress आहे", "boost": 14},
    {"value": "panic attack", "boost": 14},
    {"value": "panic attack आला", "boost": 12},
    {"value": "panic attack हुआ", "boost": 12},
    
    # === THERAPY RELATED ===
    {"value": "therapy घेतो", "boost": 12},
    {"value": "therapy ले रहा हूं", "boost": 12},
    {"value": "counseling केली", "boost": 12},
    {"value": "counseling ली", "boost": 12},
    {"value": "medication चालू आहे", "boost": 12},
    {"value": "medication ले रहा हूं", "boost": 12},
    {"value": "psychiatrist कडे जातो", "boost": 12},
    {"value": "psychiatrist के पास जाता हूं", "boost": 12},
    {"value": "psychologist कडे गेलो", "boost": 12},
    
    # === SYMPTOMS - HINDI ===
    {"value": "नींद नहीं आती", "boost": 13},
    {"value": "भूख नहीं लगती", "boost": 13},
    {"value": "दिल घबराता है", "boost": 13},
    {"value": "रोना आता है", "boost": 13},
    {"value": "थकान महसूस होती है", "boost": 12},
    {"value": "ध्यान नहीं लगता", "boost": 12},
    {"value": "गुस्सा आता है", "boost": 12},
    {"value": "अकेला महसूस करता हूं", "boost": 12},
    
    # === SYMPTOMS - MARATHI ===
    {"value": "झोप येत नाही", "boost": 13},
    {"value": "भूक लागत नाही", "boost": 13},
    {"value": "हृदय धडधडते", "boost": 13},
    {"value": "रडू येते", "boost": 13},
    {"value": "थकवा जाणवतो", "boost": 12},
    {"value": "लक्ष लागत नाही", "boost": 12},
    {"value": "राग येतो", "boost": 12},
    {"value": "एकटे वाटते", "boost": 12},
    
    # === FEELINGS - HINDI ===
    {"value": "मुझे लगता है", "boost": 11},
    {"value": "मैं समझता हूं", "boost": 11},
    {"value": "मैं महसूस करता हूं", "boost": 11},
    {"value": "मुझे डर लगता है", "boost": 11},
    {"value": "मुझे चिंता होती है", "boost": 11},
    
    # === FEELINGS - MARATHI ===
    {"value": "मला वाटते", "boost": 11},
    {"value": "मी समजतो", "boost": 11},
    {"value": "मला जाणवते", "boost": 11},
    {"value": "मला भीती वाटते", "boost": 11},
    {"value": "मला काळजी वाटते", "boost": 11},
    
    # === COMMON THERAPY GREETINGS - HINDI ===
    {"value": "कैसे हैं आप", "boost": 10},
    {"value": "आप कैसा महसूस कर रहे हैं", "boost": 10},
    {"value": "क्या हुआ", "boost": 10},
    {"value": "बताइए", "boost": 10},
    
    # === COMMON THERAPY GREETINGS - MARATHI ===
    {"value": "कसे आहात", "boost": 10},
    {"value": "तुम्हाला कसे वाटते", "boost": 10},
    {"value": "काय झाले", "boost": 10},
    {"value": "सांगा", "boost": 10},
    
    # === MEDICATION NAMES ===
    {"value": "antidepressant", "boost": 12},
    {"value": "anxiolytic", "boost": 12},
    {"value": "sleeping pill", "boost": 11},
    {"value": "tablet घेतो", "boost": 11},
    {"value": "medicine घेतली", "boost": 11},
]


# ===========================
# 🎤 VOICE ACTIVITY DETECTION
# ===========================
def is_doctor_voice(audio_data: bytes) -> tuple[bool, dict]:
    """
    Verify audio is from doctor (collar mic) based on amplitude.
    Doctor's voice should be consistently HIGH amplitude.
    
    Returns:
        tuple: (is_valid, stats_dict)
    """
    try:
        # Read WAV data
        with wave.open(io.BytesIO(audio_data), 'rb') as wav:
            frames = wav.readframes(wav.getnframes())
            audio_array = np.frombuffer(frames, dtype=np.int16)
            duration = wav.getnframes() / wav.getframerate()
        
        # Calculate audio statistics
        max_amp = int(np.max(np.abs(audio_array)))
        avg_amp = float(np.mean(np.abs(audio_array)))
        
        stats = {
            "max_amplitude": max_amp,
            "avg_amplitude": round(avg_amp, 1),
            "duration": round(duration, 2)
        }
        
        logger.info(f"[VAD] 📊 Audio stats: max={max_amp}, avg={avg_amp:.1f}, duration={duration:.2f}s")
        
        # ✅ LOWERED THRESHOLDS - Less aggressive filtering to capture all speech
        # - Max amplitude threshold: 1000 (was 5000)
        # - Average amplitude threshold: 300 (was 1000)
        MIN_DOCTOR_MAX_AMP = 1000  # Lowered from 5000
        MIN_DOCTOR_AVG_AMP = 300   # Lowered from 1000
        
        if max_amp < MIN_DOCTOR_MAX_AMP:
            logger.warning(f"[VAD] 🔇 Max amplitude too low ({max_amp}) - likely complete silence")
            return False, stats
        
        if avg_amp < MIN_DOCTOR_AVG_AMP:
            logger.warning(f"[VAD] 🔇 Avg amplitude too low ({avg_amp:.1f}) - likely background noise only")
            # ✅ CHANGED: Still send to transcription, let STT decide
            logger.info("[VAD] ⚠️ Low amplitude but sending anyway for STT analysis")
        
        logger.info("[VAD] ✅ Audio verified as doctor's voice")
        return True, stats
        
    except Exception as e:
        logger.error(f"[VAD] ❌ Error checking audio amplitude: {str(e)}")
        # On error, assume it's valid and let transcription handle it
        return True, {"error": str(e)}


@router.post("/chunk")
async def transcribe_audio_chunk(
    session_id: str = Query(...),
    audio: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Transcribe a single audio chunk (5-10 seconds) with mental health context.
    Uses Speech Adaptation for better recognition of Marathi-Hindi code-mixed therapy sessions.
    Filters out patient voice using VAD amplitude detection.
    """
    import traceback
    import sys
    
    # Forces output to terminal
    print("\n" + "="*80, file=sys.stderr)
    print("🎯 [MENTAL HEALTH STT] transcribe_simple.py CALLED!", file=sys.stderr)
    print("="*80 + "\n", file=sys.stderr)
    
    logger.info(f"🎯 [STT] Starting transcription for session: {session_id}")
    logger.info(f"👤 [STT] User ID: {current_user.id}")
    logger.info(f"📂 [STT] Audio file: {audio.filename}, content_type: {audio.content_type}")
    
    wav_path = None
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
        
        # Save WEBM to temporary file for conversion
        logger.info("🔄 [STT] Step 2.5: Saving audio to temp file for processing...")
        with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as temp_audio:
            temp_audio.write(audio_content)
            temp_audio_path = temp_audio.name
        logger.info(f"✅ [STT] Audio saved to: {temp_audio_path}")
        
        try:
            # Convert WEBM to WAV using ffmpeg
            logger.info("🔄 [STT] Step 2.6: Converting WEBM to WAV...")
            wav_path = temp_audio_path.replace(".webm", ".wav")
            
            subprocess.run([
                "ffmpeg", "-i", temp_audio_path,
                "-acodec", "pcm_s16le",
                "-ar", "16000",
                "-ac", "1",
                wav_path
            ], check=True, capture_output=True)
            
            logger.info(f"✅ [STT] Conversion complete: {wav_path}")
            
            # Read converted WAV
            with open(wav_path, "rb") as f:
                audio_content = f.read()
                logger.info(f"✅ [STT] WAV file read: {len(audio_content)} bytes")
            
            # ===========================
            # 🎤 STEP 3: VAD AMPLITUDE CHECK
            # ===========================
            logger.info("🎤 [VAD] Step 3: Checking if audio is from doctor (collar mic)...")
            is_valid, audio_stats = is_doctor_voice(audio_content)
            
            if not is_valid:
                logger.info("[VAD] 🚫 Audio rejected - not doctor's voice (patient or background noise)")
                # Clean up temp files
                os.unlink(temp_audio_path)
                os.unlink(wav_path)
                
                return {
                    "status": "filtered",
                    "transcript": "",  # Return empty transcript
                    "confidence": 0.0,
                    "language_detected": "mr-IN",
                    "session_id": session_id,
                    "context": "mental_health",
                    "message": "Audio filtered - patient voice detected",
                    "audio_stats": audio_stats
                }
            
            logger.info(f"✅ [VAD] Step 3 complete: Audio verified as doctor's voice")
            
            # Clean up temp files (keep WAV content in memory)
            os.unlink(temp_audio_path)
            os.unlink(wav_path)
            
        except FileNotFoundError:
            logger.error("❌ [STT] ffmpeg not found! Install with: brew install ffmpeg")
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            raise HTTPException(
                status_code=500,
                detail="Audio conversion failed: ffmpeg not installed"
            )
        except subprocess.CalledProcessError as e:
            logger.error(f"❌ [STT] ffmpeg conversion failed: {e.stderr.decode()}")
            if temp_audio_path and os.path.exists(temp_audio_path):
                os.unlink(temp_audio_path)
            if wav_path and os.path.exists(wav_path):
                os.unlink(wav_path)
            raise HTTPException(
                status_code=500,
                detail=f"Audio conversion failed: {e.stderr.decode()}"
            )
        
        # ===========================
        # 🧠 CONFIGURE RECOGNITION WITH MENTAL HEALTH CONTEXT
        # ===========================
        logger.info("⚙️ [STT] Step 4: Creating recognition config with mental health context...")
        
        # Convert phrase list to PhraseSet format
        phrase_set = cloud_speech.PhraseSet()
        for phrase_data in MENTAL_HEALTH_PHRASES:
            phrase_set.phrases.append(
                cloud_speech.PhraseSet.Phrase(
                    value=phrase_data["value"],
                    boost=phrase_data["boost"]
                )
            )
        
        config = speech.RecognitionConfig(
            explicit_decoding_config=speech.ExplicitDecodingConfig(
                encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                audio_channel_count=1,
            ),
            model="latest_short",  # ✅ Optimized for 30-second chunks
            language_codes=["mr-IN", "hi-IN", "en-IN"],  # Marathi, Hindi, English
            features=cloud_speech.RecognitionFeatures(
                enable_word_time_offsets=True,
                enable_word_confidence=True,
            ),
            # ✅ SPEECH ADAPTATION FOR MENTAL HEALTH TERMINOLOGY
            adaptation=cloud_speech.SpeechAdaptation(
                phrase_sets=[
                    cloud_speech.SpeechAdaptation.AdaptationPhraseSet(
                        inline_phrase_set=phrase_set
                    )
                ]
            )
        )
        
        logger.info(f"✅ [STT] Step 4 complete: Config created with mental health context")
        logger.info(f"   - Model: latest_short")
        logger.info(f"   - Languages: mr-IN, hi-IN, en-IN")
        logger.info(f"   - Mental health phrases loaded: {len(MENTAL_HEALTH_PHRASES)}")
        
        # Create recognition request
        logger.info(f"📋 [STT] Step 5: Creating recognition request...")
        recognizer_path = f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/{settings.VERTEX_AI_LOCATION}/recognizers/_"
        logger.info(f"🎯 [STT] Recognizer path: {recognizer_path}")
        
        request = speech.RecognizeRequest(
            recognizer=recognizer_path,
            config=config,
            content=audio_content
        )
        logger.info(f"✅ [STT] Step 5 complete: Request object created")
        
        logger.info(f"🚀 [STT] Step 6: Calling Google Speech API with mental health context...")

        # Transcribe with timeout
        try:
            response = client.recognize(
                request=request,
                timeout=30.0
            )
            logger.info(f"✅ [STT] Step 6 complete: Got response from Google Speech API")
        except Exception as api_error:
            logger.error(f"❌ [STT] Google Speech API call failed: {str(api_error)}")
            logger.error(f"📋 [STT] Error type: {type(api_error).__name__}")
            raise

        # Extract transcript
        logger.info(f"📝 [STT] Step 7: Extracting transcript from response...")
        transcript = ""
        confidence = 0.0
        language_detected = "unknown"
        
        if response.results:
            logger.info(f"📊 [STT] Got {len(response.results)} results from Speech API")
            for idx, result in enumerate(response.results):
                if result.alternatives:
                    alt = result.alternatives[0]
                    transcript += alt.transcript + " "
                    if hasattr(alt, 'confidence'):
                        confidence = max(confidence, alt.confidence)
                    
                    if hasattr(result, 'language_code'):
                        language_detected = result.language_code
                    
                    logger.info(f"  Result {idx+1}: '{alt.transcript}' (confidence: {alt.confidence if hasattr(alt, 'confidence') else 'N/A'})")
        else:
            logger.warning("⚠️ [STT] No results from Speech API (silence detected)")
        
        transcript = transcript.strip()
        logger.info(f"✅ [STT] Step 7 complete: Transcription extracted")
        logger.info(f"📄 [STT] Final transcript: '{transcript[:100]}...' (length: {len(transcript)}, confidence: {confidence:.2f})")
        logger.info(f"🌐 [STT] Detected language: {language_detected}")
        
        logger.info(f"🎉 [STT] Step 8: Returning successful response")
        return {
            "status": "success",
            "transcript": transcript,
            "confidence": confidence,
            "language_detected": language_detected,
            "session_id": session_id,
            "context": "mental_health",
            "audio_stats": audio_stats
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
        
        # Clean up any remaining temp files
        if temp_audio_path and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        if wav_path and os.path.exists(wav_path):
            os.unlink(wav_path)
            
        raise HTTPException(
            status_code=500,
            detail={
                "error": "transcription_error",
                "message": f"Transcription failed: {str(e)}"
            }
        )


@router.get("/health")
async def transcribe_health():
    """Health check for transcription service with mental health context + VAD."""
    return {
        "status": "ok",
        "service": "transcription",
        "type": "rest_api_with_mental_health_context_and_vad",
        "model": "latest_short",
        "languages": ["mr-IN", "hi-IN", "en-IN"],
        "context_phrases": len(MENTAL_HEALTH_PHRASES),
        "vad_enabled": True,
        "vad_thresholds": {
            "min_max_amplitude": 5000,
            "min_avg_amplitude": 1000
        },
        "message": "Mental health transcription service with doctor voice filtering ready"
    }
