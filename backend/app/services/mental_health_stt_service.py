"""
Enhanced Speech-to-Text service specifically designed for mental health practitioners.
Supports Marathi (primary), English (India), and Hindi (India) with mental health terminology.
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
from app.core.config import settings

logger = logging.getLogger(__name__)

class MentalHealthSTTService:
    """Enhanced STT service for mental health practitioners with multi-language support."""
    
    def __init__(self):
        # Initialize Google Cloud Speech client with service account
        credentials = service_account.Credentials.from_service_account_file(
            "gcp-credentials.json",
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        self.client = speech.SpeechClient(credentials=credentials)
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
        self.project_id = "synapse-product-1"
        
        # Mental Health Terminology Database
        self.mental_health_terminology = self._build_mental_health_database()
        
    def _build_mental_health_database(self) -> Dict[str, list]:
        """Build comprehensive mental health terminology database for all supported languages."""
        
        return {
            # English Mental Health Terms & Abbreviations
            "english": [
                # Core Mental Health Conditions
                "anxiety", "depression", "bipolar disorder", "schizophrenia", "PTSD", "OCD", "ADHD", "ADD",
                "panic disorder", "GAD", "social anxiety", "phobia", "agoraphobia", "claustrophobia",
                "eating disorder", "anorexia", "bulimia", "BED", "body dysmorphia",
                "personality disorder", "BPD", "borderline", "narcissistic", "antisocial",
                "autism", "ASD", "Asperger's", "developmental disorder",
                "substance abuse", "addiction", "alcoholism", "drug dependency",
                "dementia", "Alzheimer's", "cognitive decline", "memory loss",
                
                # Symptoms & Clinical Terms
                "delusions", "hallucinations", "paranoia", "mania", "hypomania", "psychosis",
                "suicidal ideation", "self-harm", "self-injury", "cutting", "suicide attempt",
                "dissociation", "flashbacks", "nightmares", "intrusive thoughts",
                "compulsions", "obsessions", "rumination", "catastrophizing",
                "mood swings", "irritability", "agitation", "restlessness", "fatigue",
                "insomnia", "hypersomnia", "sleep disturbance", "appetite changes",
                "concentration problems", "memory issues", "cognitive fog",
                "emotional numbness", "anhedonia", "hopelessness", "worthlessness",
                
                # Treatment & Therapy
                "psychotherapy", "counseling", "therapy session", "CBT", "DBT", "EMDR",
                "cognitive behavioral therapy", "dialectical behavior therapy", "exposure therapy",
                "mindfulness", "meditation", "breathing exercises", "grounding techniques",
                "coping strategies", "stress management", "relaxation techniques",
                "behavioral activation", "thought challenging", "cognitive restructuring",
                "medication", "antidepressant", "antipsychotic", "mood stabilizer", "anxiolytic",
                "SSRI", "SNRI", "benzodiazepine", "lithium", "quetiapine", "sertraline",
                
                # Assessment & Evaluation  
                "mental status exam", "MSE", "risk assessment", "suicide risk", "safety plan",
                "GAF", "PHQ-9", "GAD-7", "beck depression inventory", "hamilton rating scale",
                "DSM-5", "ICD-11", "diagnosis", "differential diagnosis", "comorbidity",
                "treatment plan", "therapy goals", "progress note", "discharge plan",
                
                # Professional Roles
                "psychiatrist", "psychologist", "therapist", "counselor", "social worker",
                "psychiatric nurse", "mental health professional", "case manager",
                "crisis intervention", "emergency psychiatric", "involuntary hold",
                
                # Recovery & Support
                "recovery", "resilience", "coping skills", "support system", "family therapy",
                "group therapy", "peer support", "rehabilitation", "community mental health",
                "therapeutic alliance", "rapport", "transference", "countertransference"
            ],
            
            # Marathi Mental Health Terms (मराठी)
            "marathi": [
                # मुख्य मानसिक आरोग्य स्थिती
                "चिंता", "नैराश्य", "द्विध्रुवीय विकार", "स्किझोफ्रेनिया", "पीटीएसडी", "ओसीडी", "एडीएचडी",
                "पॅनिक डिसऑर्डर", "सामाजिक चिंता", "फोबिया", "खाण्याचा विकार",
                "व्यक्तिमत्व विकार", "सीमारेषा व्यक्तिमत्व विकार", "ऑटिझम",
                "पदार्थ गैरवापर", "व्यसन", "मद्यपान", "स्मृतिभ्रंश", "अल्झायमर",
                
                # लक्षणे आणि क्लिनिकल संज्ञा
                "भ्रम", "मतिभ्रम", "संशयवाद", "उन्माद", "अतिउन्माद", "मनोविकृती",
                "आत्महत्येचे विचार", "स्व-हानी", "स्व-इजा", "आत्महत्येचा प्रयत्न",
                "वियोग", "फ्लॅशबॅक", "दुःस्वप्न", "घुसखोर विचार",
                "सक्ती", "वेड", "रुमिनेशन", "मूड स्विंग", "चिडचिड", "अस्वस्थता",
                "निद्रानाश", "अतिनिद्रा", "झोपेचा त्रास", "भूक बदल",
                "एकाग्रतेची समस्या", "स्मृती समस्या", "भावनिक सुन्नता", "निराशा",
                
                # उपचार आणि थेरपी
                "मनोचिकित्सा", "समुपदेशन", "थेरपी सत्र", "सीबीटी", "डीबीटी", "ईएमडीआर",
                "संज्ञानात्मक वर्तनविषयक थेरपी", "द्वंद्वात्मक वर्तन थेरपी", "एक्स्पोजर थेरपी",
                "माइंडफुलनेस", "ध्यान", "श्वसन व्यायाम", "ग्राउंडिंग तंत्र",
                "सामना धोरणे", "तणाव व्यवस्थापन", "विश्रांति तंत्र", "औषध",
                "अवसादनाशक", "मनोविकारनाशक", "मूड स्टेबलायझर", "चिंतानाशक",
                
                # मूल्यांकन आणि मूल्यमापन
                "मानसिक स्थिती परीक्षा", "जोखीम मूल्यांकन", "आत्महत्या जोखीम", "सुरक्षा योजना",
                "डीएसएम-५", "आयसीडी-११", "निदान", "विभेदक निदान", "सहरुग्णता",
                "उपचार योजना", "थेरपी लक्ष्ये", "प्रगती टीप", "डिस्चार्ज योजना",
                
                # व्यावसायिक भूमिका
                "मनोचिकित्सक", "मनोशास्त्रज्ञ", "थेरपिस्ट", "समुपदेशक", "समाजसेवक",
                "मानसिक आरोग्य व्यावसायिक", "केस मॅनेजर", "संकट हस्तक्षेप",
                
                # पुनर्प्राप्ती आणि समर्थन
                "पुनर्प्राप्ती", "लवचिकता", "सामना कौशल्ये", "समर्थन प्रणाली",
                "कुटुंब थेरपी", "गट थेरपी", "समवयस्क समर्थन", "पुनर्वसन",
                "समुदायिक मानसिक आरोग्य", "उपचारात्मक युती", "तालमेळ"
            ],
            
            # Hindi Mental Health Terms (हिंदी)
            "hindi": [
                # मुख्य मानसिक स्वास्थ्य स्थितियां
                "चिंता", "अवसाद", "द्विध्रुवी विकार", "स्किज़ोफ्रेनिया", "पीटीएसडी", "ओसीडी", "एडीएचडी",
                "पैनिक डिसऑर्डर", "सामाजिक चिंता", "फोबिया", "खाने का विकार",
                "व्यक्तित्व विकार", "सीमा व्यक्तित्व विकार", "ऑटिज्म",
                "नशे की लत", "व्यसन", "शराबखोरी", "स्मृतिभ्रंश", "अल्जाइमर",
                
                # लक्षण और क्लिनिकल शब्द
                "भ्रम", "मतिभ्रम", "संदेह", "उन्माद", "अति उन्माद", "मनोविकृति",
                "आत्महत्या के विचार", "स्व-नुकसान", "स्व-चोट", "आत्महत्या का प्रयास",
                "वियोग", "फ्लैशबैक", "बुरे सपने", "घुसपैठिए विचार",
                "मजबूरी", "जुनून", "रुमिनेशन", "मूड स्विंग", "चिड़चिड़ाहट", "बेचैनी",
                "अनिद्रा", "अतिनिद्रा", "नींद की परेशानी", "भूख में बदलाव",
                "एकाग्रता की समस्याएं", "याददाश्त की समस्याएं", "भावनात्मक सुन्नता", "निराशा",
                
                # उपचार और थेरेपी
                "मनोचिकित्सा", "परामर्श", "थेरेपी सत्र", "सीबीटी", "डीबीटी", "ईएमडीआर",
                "संज्ञानात्मक व्यवहार चिकित्सा", "द्वंद्वात्मक व्यवहार चिकित्सा", "एक्सपोज़र थेरेपी",
                "माइंडफुलनेस", "ध्यान", "सांस की एक्सरसाइज़", "ग्राउंडिंग तकनीक",
                "सामना करने की रणनीतियां", "तनाव प्रबंधन", "विश्राम तकनीक", "दवा",
                "अवसादरोधी", "मनोविकाररोधी", "मूड स्टेबलाइज़र", "चिंतारोधी",
                
                # मूल्यांकन और निदान
                "मानसिक स्थिति परीक्षा", "जोखिम मूल्यांकन", "आत्महत्या का जोखिम", "सुरक्षा योजना",
                "डीएसएम-५", "आईसीडी-११", "निदान", "विभेदक निदान", "सह-रुग्णता",
                "उपचार योजना", "थेरेपी लक्ष्य", "प्रगति नोट", "डिस्चार्ज योजना",
                
                # पेशेवर भूमिकाएं
                "मनोचिकित्सक", "मनोवैज्ञानिक", "थेरेपिस्ट", "परामर्शदाता", "समाजसेवक",
                "मानसिक स्वास्थ्य पेशेवर", "केस मैनेजर", "संकट हस्तक्षेप",
                
                # रिकवरी और सहायता
                "रिकवरी", "लचीलापन", "मुकाबला कौशल", "सहायता प्रणाली",
                "पारिवारिक चिकित्सा", "समूह चिकित्सा", "साथी सहायता", "पुनर्वास",
                "सामुदायिक मानसिक स्वास्थ्य", "चिकित्सीय गठबंधन", "तालमेल"
            ]
        }
    
    def get_streaming_config(self) -> StreamingRecognitionConfig:
        """Get streaming recognition configuration optimized for mental health practice."""
        
        # Combine all mental health terms for speech context
        all_mental_health_terms = []
        for language_terms in self.mental_health_terminology.values():
            all_mental_health_terms.extend(language_terms)
        
        config = RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
            sample_rate_hertz=48000,
            language_code=settings.GOOGLE_STT_PRIMARY_LANGUAGE,  # Marathi (India)
            alternative_language_codes=settings.GOOGLE_STT_ALTERNATE_LANGUAGES,  # English, Hindi
            model=settings.GOOGLE_STT_MODEL,  # latest_long
            use_enhanced=True,
            enable_automatic_punctuation=True,
            enable_spoken_punctuation=True,
            enable_spoken_emojis=True,
            # Mental health specific speech contexts with high boost
            speech_contexts=[
                speech.SpeechContext(
                    phrases=all_mental_health_terms,
                    boost=30.0  # Very high boost for mental health terminology
                )
            ]
        )
        
        return StreamingRecognitionConfig(
            config=config,
            interim_results=True,  # Enable interim results for live feedback
            single_utterance=False,  # Continuous recognition
        )
    
    def start_session(self, session_id: str, patient_id: str = None) -> Dict[str, Any]:
        """Start a new STT session for mental health consultation."""
        
        session_info = {
            "session_id": session_id,
            "patient_id": patient_id,
            "started_at": datetime.now(timezone.utc),
            "language_support": ["mr-IN", "en-IN", "hi-IN"],
            "model": settings.GOOGLE_STT_MODEL,
            "mental_health_optimized": True,
            "status": "active"
        }
        
        self.active_sessions[session_id] = session_info
        
        logger.info(f"Started mental health STT session: {session_id}")
        return session_info
    
    def end_session(self, session_id: str) -> Dict[str, Any]:
        """End an STT session and return session summary."""
        
        if session_id in self.active_sessions:
            session_info = self.active_sessions[session_id]
            session_info["ended_at"] = datetime.now(timezone.utc)
            session_info["status"] = "completed"
            session_info["duration_minutes"] = (
                session_info["ended_at"] - session_info["started_at"]
            ).total_seconds() / 60
            
            # Remove from active sessions
            del self.active_sessions[session_id]
            
            logger.info(f"Ended mental health STT session: {session_id}")
            return session_info
        
        return {"error": "Session not found", "session_id": session_id}
    
    async def stream_transcribe(self, session_id: str, audio_stream: AsyncGenerator) -> AsyncGenerator:
        """
        Stream audio to Google STT optimized for mental health conversations.
        Yields transcription results with language detection.
        """
        try:
            streaming_config = self.get_streaming_config()
            
            # Convert audio stream to request stream
            async def audio_request_generator():
                # First request with configuration
                yield speech.StreamingRecognizeRequest(streaming_config=streaming_config)
                
                # Subsequent requests with audio data
                async for audio_chunk in audio_stream:
                    yield speech.StreamingRecognizeRequest(audio_content=audio_chunk)
            
            # Stream recognition
            responses = self.client.streaming_recognize(audio_request_generator())
            
            for response in responses:
                if not response.results:
                    continue
                
                result = response.results[0]
                if not result.alternatives:
                    continue
                
                # Extract transcription details
                transcript = result.alternatives[0].transcript
                confidence = result.alternatives[0].confidence
                is_final = result.is_final
                
                # Detect language if available
                detected_language = None
                if hasattr(result, 'language_code'):
                    detected_language = result.language_code
                
                yield {
                    "transcript": transcript,
                    "confidence": confidence,
                    "is_final": is_final,
                    "detected_language": detected_language,
                    "session_id": session_id,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "mental_health_optimized": True
                }
                
        except Exception as e:
            logger.error(f"Mental health STT streaming error for session {session_id}: {str(e)}")
            yield {
                "error": str(e),
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
    
    def get_supported_languages(self) -> Dict[str, str]:
        """Return supported languages with their codes."""
        return {
            "mr-IN": "Marathi (India) - Primary",
            "en-IN": "English (India) - Alternate", 
            "hi-IN": "Hindi (India) - Alternate"
        }
    
    def get_mental_health_terms(self, language: str = "all") -> Dict[str, list]:
        """Get mental health terminology for specified language or all languages."""
        if language == "all":
            return self.mental_health_terminology
        elif language in self.mental_health_terminology:
            return {language: self.mental_health_terminology[language]}
        else:
            return {"error": f"Language '{language}' not supported"}

# Global service instance
try:
    mental_health_stt_service = MentalHealthSTTService()
    logger.info("Mental Health STT service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Mental Health STT service: {str(e)}")
    mental_health_stt_service = None
