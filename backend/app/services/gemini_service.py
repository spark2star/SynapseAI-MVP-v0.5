"""
Gemini AI service for medical report generation using Google service account.
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
                
                logger.info("✅ Gemini 2.5 Flash initialized successfully (Mumbai region)")
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
            
            # Call real Gemini 2.5 Flash API
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
            import traceback
            logger.error(f"❌ Full traceback: {traceback.format_exc()}")
            return {
                "status": "error",
                "error": str(e),
                "model_used": "gemini-2.5-flash",
                "region": "asia-south1"
            }
    
    def _get_follow_up_prompt(self, transcription: str) -> str:
        """
        Specialized prompt for follow-up mental health sessions
        """
        return f"""
You are an experienced mental health professional reviewing a follow-up consultation transcript. 

IMPORTANT LANGUAGE CONTEXT:
- The transcript contains code-mixed language (Hindi/Marathi words written in Roman English alongside English)
- Examples: "bahut", "zyada", "pareshaan", "tension", "lagta", "chahta", "nahi", etc.
- Understand the context and meaning, then provide your analysis entirely in professional English

TRANSCRIPT TO ANALYZE:
{transcription}

TASK: Generate a CONCISE follow-up mental health assessment report with the following structure:

## CURRENT SITUATION
- Present concerns and symptoms (brief summary)
- Current stressors and triggers
- Functional impact on daily life

## MENTAL STATUS EXAMINATION
- Mood and affect
- Thought process and insight
- Risk assessment (if applicable)

## SLEEP & PHYSICAL HEALTH
- Sleep patterns and disturbances
- Appetite and energy levels
- Physical symptoms

## MEDICATION & TREATMENT
- Current medications (if mentioned)
- Treatment compliance and concerns

## RECOMMENDATIONS
- Immediate intervention needs
- Treatment adjustments suggested
- Follow-up requirements

GUIDELINES:
1. Keep each section to 2-3 bullet points maximum
2. Use professional but concise language
3. Only include information from the transcript
4. Skip sections if no relevant information is provided
5. Focus on key clinical findings and actionable insights
6. No placeholder text or template language

Provide a clean, structured report without extra formatting or placeholders.
"""

    def _get_new_patient_prompt(self, transcription: str) -> str:
        """
        Specialized prompt for new patient mental health sessions
        """
        return f"""
You are an experienced mental health professional conducting an initial consultation assessment.

IMPORTANT LANGUAGE CONTEXT:
- The transcript contains code-mixed language (Hindi/Marathi words in Roman English)
- Understand context and meaning, provide analysis entirely in professional English

TRANSCRIPT TO ANALYZE:
{transcription}

TASK: Generate a comprehensive initial mental health assessment report:

## CHIEF COMPLAINT
- Primary reason for seeking consultation
- Patient's own description of concerns

## HISTORY OF PRESENT ILLNESS
- Onset and duration of symptoms
- Precipitating factors
- Course and progression
- Impact on functioning

## MENTAL STATUS EXAMINATION
- Appearance, behavior, and attitude
- Speech and language
- Mood and affect
- Thought process and content
- Perceptual disturbances
- Cognitive assessment
- Insight and judgment

## RISK ASSESSMENT
- Suicidal ideation or intent
- Self-harm behaviors
- Risk to others
- Protective factors

## PROVISIONAL ASSESSMENT
- Clinical impressions based on presentation
- Differential diagnoses to consider
- Severity assessment

## RECOMMENDATIONS
- Immediate interventions needed
- Treatment planning considerations
- Follow-up requirements
- Safety planning if indicated

GUIDELINES: Use professional terminology, be objective, highlight urgent concerns, maintain confidentiality.
"""

# Global instance
try:
    gemini_service = GeminiService()
    logger.info("✅ Global Gemini service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize global Gemini service: {str(e)}")
    gemini_service = None
