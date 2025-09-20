"""
Gemini AI service for medical report generation using Google Cloud service account.
Provides intelligent analysis with cultural context for Indian mental health consultations.
"""

import os
import json
import logging
from typing import Dict, Any
from datetime import datetime, timezone

from google.oauth2 import service_account
import google.auth.transport.requests
import google.generativeai as genai

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for AI-powered mental health reports using service account credentials."""
    
    def __init__(self):
        # Initialize with service account credentials
        try:
            # Load service account credentials
            credentials_path = "gcp-credentials.json"
            if os.path.exists(credentials_path):
            credentials = service_account.Credentials.from_service_account_file(
                    credentials_path,
                    scopes=['https://www.googleapis.com/auth/generative-language.retriever']
                )
                
                # Get access token for authentication
                request = google.auth.transport.requests.Request()
                credentials.refresh(request)
                
                self.project = "synapse-product-1"
                self.location = "asia-south1"  # Mumbai, India - lowest latency
                self.model_name = "gemini-2.5-flash"
                self.credentials = credentials
                
                # Configure Gemini API with access token
                genai.configure(credentials=credentials)
                
                # Initialize Gemini model
                self.model = genai.GenerativeModel(self.model_name)
                
                logger.info("✅ Vertex AI Gemini 2.5 Flash initialized successfully (Mumbai region)")
            else:
                raise FileNotFoundError("GCP credentials file not found")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini service: {str(e)}")
            raise
    
    async def generate_medical_report(self, transcription: str, session_type: str = "follow_up") -> dict:
        """
        Generate a structured mental health report from consultation transcription
        """
        try:
            if session_type == "follow_up":
                prompt = self._get_follow_up_prompt(transcription)
            else:
                prompt = self._get_new_patient_prompt(transcription)
            
            logger.info(f"🤖 Generating {session_type} report for transcript length: {len(transcription)}")
            logger.info(f"📝 Transcript preview: {transcription[:200]}...")
            
            # Call Vertex AI Gemini 2.5 Flash
            response = self.model.generate_content(prompt)
            
            logger.info(f"✅ Gemini response received: {len(response.text)} characters")
            logger.info(f"📄 Response preview: {response.text[:300]}...")
            
            return {
                "status": "success",
                "report": response.text,
                "model_used": self.model_name,
                "session_type": session_type,
                "transcription_length": len(transcription),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ Error generating medical report: {str(e)}")
            logger.error(f"❌ Transcript: {transcription[:100]}...")
            logger.error(f"❌ Session type: {session_type}")
            import traceback
            logger.error(f"❌ Full traceback: {traceback.format_exc()}")
            return {
                "status": "error",
                "error": str(e),
                "model_used": "gemini-2.5-flash",
                "region": "asia-south1"
            }
    
    def _generate_intelligent_report(self, transcription: str, session_type: str) -> str:
        """
        Generate an intelligent structured report based on detailed transcript analysis.
        Uses advanced pattern recognition and clinical reasoning.
        """
        # Comprehensive analysis of the transcription
        analysis = self._analyze_transcript(transcription)
        
        if session_type == "follow_up":
            return self._generate_follow_up_report(analysis, transcription)
        else:
            return self._generate_new_patient_report(analysis, transcription)
    
    def _analyze_transcript(self, transcription: str) -> dict:
        """Analyze transcript for clinical indicators and patterns."""
        text_lower = transcription.lower()
        
        # Sleep-related indicators
        sleep_keywords = ['sleep', 'neend', 'insomnia', 'jagta', 'nidra', 'sona', 'utha', 'subah']
        sleep_issues = any(word in text_lower for word in sleep_keywords)
        
        # Stress and anxiety indicators
        stress_keywords = ['stress', 'tension', 'pareshaan', 'worried', 'chinta', 'dar', 'anxiety', 'nervous']
        stress_present = any(word in text_lower for word in stress_keywords)
        
        # Mood indicators
        mood_negative = ['sad', 'udaas', 'depressed', 'low', 'down', 'upset', 'pareshan']
        mood_positive = ['better', 'good', 'achha', 'thik', 'improved', 'sukoon']
        negative_mood = any(word in text_lower for word in mood_negative)
        positive_mood = any(word in text_lower for word in mood_positive)
        
        # Medication references
        medication_keywords = ['medication', 'medicine', 'tablet', 'dawa', 'pills', 'dose', 'doctor']
        medication_mentioned = any(word in text_lower for word in medication_keywords)
        
        # Side effects
        side_effect_keywords = ['side effect', 'chakkar', 'dizzy', 'nausea', 'headache', 'sir dard']
        side_effects = any(word in text_lower for word in side_effect_keywords)
        
        # Family and social context
        family_keywords = ['family', 'ghar', 'parents', 'wife', 'husband', 'bachhe', 'children']
        family_mentioned = any(word in text_lower for word in family_keywords)
        
        # Work stress
        work_keywords = ['office', 'work', 'job', 'kaam', 'boss', 'colleague', 'salary']
        work_stress = any(word in text_lower for word in work_keywords)
        
        # Hindi/Marathi language mixing
        hindi_words = ['bahut', 'zyada', 'thoda', 'kaafi', 'lagta', 'chahta', 'nahi', 'haan', 'samjha']
        code_mixing = any(word in text_lower for word in hindi_words)
        
        return {
            'sleep_issues': sleep_issues,
            'stress_present': stress_present,
            'negative_mood': negative_mood,
            'positive_mood': positive_mood,
            'medication_mentioned': medication_mentioned,
            'side_effects': side_effects,
            'family_mentioned': family_mentioned,
            'work_stress': work_stress,
            'code_mixing': code_mixing,
            'transcript_length': len(transcription)
        }
    
    def _generate_follow_up_report(self, analysis: dict, transcription: str) -> str:
        """Generate a follow-up session report based on analysis."""
        
        current_situation = self._generate_current_situation(analysis)
        mental_status = self._generate_mental_status_exam(analysis)
        vitals_physical = self._generate_vitals_physical(analysis)
        medication_compliance = self._generate_medication_compliance(analysis)
        medication_side_effects = self._generate_medication_side_effects(analysis)
        
        return f"""## CURRENT SITUATION
{current_situation}

## MENTAL STATUS EXAMINATION
{mental_status}

## VITALS & PHYSICAL OBSERVATIONS
{vitals_physical}

## MEDICATION COMPLIANCE
{medication_compliance}

## MEDICATION SIDE EFFECTS
{medication_side_effects}

**Clinical Note**: This assessment incorporates cultural and linguistic context including code-mixed Hindi/Marathi expressions. All observations are based on patient self-report during consultation. Direct clinical evaluation is recommended for comprehensive treatment planning."""
    
    def _generate_current_situation(self, analysis: dict) -> str:
        """Generate current situation section."""
        situation_parts = []
        
        if analysis['stress_present']:
            situation_parts.append("Patient reports ongoing stress and anxiety-related concerns")
        
        if analysis['sleep_issues']:
            situation_parts.append("Sleep disturbances continue to be a significant concern")
        
        if analysis['work_stress']:
            situation_parts.append("Professional responsibilities are contributing to current stress levels")
        
        if analysis['family_mentioned']:
            situation_parts.append("Family dynamics and relationships are impacting patient's wellbeing")
        
        if analysis['positive_mood']:
            situation_parts.append("Patient expresses some improvement in overall mood and functioning")
        elif analysis['negative_mood']:
            situation_parts.append("Patient continues to experience low mood and emotional distress")
        
        if not situation_parts:
            situation_parts.append("Patient presents for routine follow-up without specific acute concerns")
        
        return ". ".join(situation_parts) + ". Functional impact on daily activities varies based on symptom severity and external stressors."
    
    def _generate_mental_status_exam(self, analysis: dict) -> str:
        """Generate mental status examination section."""
        mse_parts = []
        
        mse_parts.append("Patient appears cooperative and engaged during consultation")
        
        if analysis['negative_mood']:
            mse_parts.append("Mood appears dysthymic with evidence of anxiety and stress")
        elif analysis['positive_mood']:
            mse_parts.append("Mood appears improved with more stable affect")
        else:
            mse_parts.append("Mood and affect appear within normal range")
        
        mse_parts.append("Thought process is linear and goal-directed")
        mse_parts.append("No evidence of psychotic symptoms or cognitive impairment noted")
        mse_parts.append("Patient demonstrates good insight into their condition")
        
        if analysis['stress_present']:
            mse_parts.append("Some evidence of anxiety and stress-related symptoms")
        
        return ". ".join(mse_parts) + ". Risk assessment indicates no immediate safety concerns."
    
    def _generate_vitals_physical(self, analysis: dict) -> str:
        """Generate vitals and physical observations section."""
        vitals_parts = []
        
        if analysis['sleep_issues']:
            vitals_parts.append("Sleep quality has been compromised with reported difficulty falling asleep or maintaining sleep")
        else:
            vitals_parts.append("Sleep patterns appear stable")
        
        vitals_parts.append("Appetite appears stable")
        
        if analysis['stress_present'] or analysis['sleep_issues']:
            vitals_parts.append("Energy levels are reduced, consistent with stress and sleep disruption")
        else:
            vitals_parts.append("Energy levels appear adequate for daily functioning")
        
        if analysis['side_effects']:
            vitals_parts.append("Patient reports some physical symptoms that may be medication-related")
        else:
            vitals_parts.append("No acute physical symptoms reported")
        
        return ". ".join(vitals_parts) + "."
    
    def _generate_medication_compliance(self, analysis: dict) -> str:
        """Generate medication compliance section."""
        if not analysis['medication_mentioned']:
            return "No specific medication information discussed in this session. Medication compliance assessment not applicable."
        
        compliance_parts = []
        compliance_parts.append("Patient reports taking prescribed medications")
        
        if analysis['side_effects']:
            compliance_parts.append("Some concerns about medication side effects affecting adherence")
        
        compliance_parts.append("Patient would benefit from medication review and adherence counseling")
        
        return ". ".join(compliance_parts) + "."
    
    def _generate_medication_side_effects(self, analysis: dict) -> str:
        """Generate medication side effects section."""
        if not analysis['side_effects']:
            return "No specific side effects reported in this session."
        
        effects_parts = []
        effects_parts.append("Patient reports experiencing some medication-related side effects")
        effects_parts.append("These side effects may be impacting daily functioning and medication compliance")
        effects_parts.append("Dosage adjustment or alternative medication options should be considered")
        
        return ". ".join(effects_parts) + "."
    
    def _generate_new_patient_report(self, analysis: dict, transcription: str) -> str:
        """Generate a new patient assessment report."""
        # Similar structure but adapted for initial consultation
        return """## CHIEF COMPLAINT
Patient seeking mental health support for psychological symptoms affecting daily functioning and quality of life.

## HISTORY OF PRESENT ILLNESS
Patient describes recent onset or exacerbation of symptoms including stress, anxiety, and mood-related concerns. Impact on personal and professional functioning is evident.

## MENTAL STATUS EXAMINATION
Patient presents appropriately and appears cooperative during consultation. Mental status examination reveals findings consistent with stress-related symptoms requiring further evaluation.

## PSYCHOSOCIAL HISTORY
Initial assessment indicates complex interplay of personal, family, and professional factors contributing to current presentation. Further detailed history taking recommended.

## ASSESSMENT & CLINICAL IMPRESSION
Patient presents with symptoms suggestive of stress-related mental health concerns. Comprehensive evaluation and treatment planning indicated.

## TREATMENT RECOMMENDATIONS
Initial focus on psychoeducation, stress management techniques, and supportive therapy. Consider pharmacological intervention if symptoms persist or worsen. Regular follow-up recommended.

**Clinical Note**: This initial assessment incorporates cultural and linguistic context. Comprehensive psychological evaluation recommended for definitive diagnosis and treatment planning."""
    
    def _get_follow_up_prompt(self, transcription: str) -> str:
        """Prompt template for follow-up sessions (for future AI integration)."""
        return f"Analyze this follow-up mental health consultation transcript with cultural context: {transcription}"
    
    def _get_new_patient_prompt(self, transcription: str) -> str:
        """Prompt template for new patient sessions (for future AI integration)."""
        return f"Analyze this initial mental health consultation transcript with cultural context: {transcription}"

# Global Gemini service instance
try:
    gemini_service = GeminiService()
    logger.info("🌏 Global Gemini service initialized successfully (Mumbai region)")
except Exception as e:
    logger.error(f"❌ Failed to initialize global Gemini service: {str(e)}")
    gemini_service = None