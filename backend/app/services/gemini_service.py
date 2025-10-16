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
    
    async def generate_medical_report(self, transcription: str, session_type: str = "follow_up", patient_status: str = "stable", medications: str = "") -> dict:
        """
        Generate a structured mental health report from consultation transcription with quality metrics
        
        Returns:
        {
            "report": "...",
            "confidence_score": 0.85,
            "keywords": ["anxiety", "sleep", ...],
            "reasoning": "..."
        }
        """
        try:
            if session_type == "follow_up":
                prompt = self._get_follow_up_prompt(transcription, patient_status, medications)
            else:
                prompt = self._get_new_patient_prompt(transcription, patient_status, medications)
            
            logger.info(f"🤖 Generating {session_type} report for transcript length: {len(transcription)}")
            logger.info(f"📝 Transcript preview: {transcription[:200]}...")
            
            # Call real Gemini 2.5 Flash API with JSON response format
            generation_config = {
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json"
            }
            
            model_with_config = genai.GenerativeModel(
                self.model_name,
                generation_config=generation_config
            )
            
            response = model_with_config.generate_content(prompt)
            
            logger.info(f"✅ Gemini response received: {len(response.text)} characters")
            logger.info(f"📄 Response preview: {response.text[:300]}...")
            
            # Parse JSON response (handle markdown code blocks)
            import json
            import re
            
            response_text = response.text.strip()
            
            # Try to extract JSON from markdown code blocks
            if response_text.startswith('```'):
                # Extract content between ```json and ``` or just ``` and ```
                json_match = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', response_text, re.DOTALL)
                if json_match:
                    response_text = json_match.group(1)
            
            try:
                result = json.loads(response_text)
                
                # Ensure keywords are limited to 10
                if "keywords" in result and isinstance(result["keywords"], list):
                    result["keywords"] = result["keywords"][:10]
                
                return {
                    "status": "success",
                    "report": result.get("report", response.text),
                    "confidence_score": result.get("confidence_score", 0.75),
                    "keywords": result.get("keywords", []),
                    "reasoning": result.get("reasoning", ""),
                    "model_used": self.model_name,
                    "session_type": session_type,
                    "transcription_length": len(transcription),
                    "generated_at": datetime.now(timezone.utc).isoformat()
                }
            except json.JSONDecodeError as e:
                # Fallback: Extract keywords from transcript text
                logger.warning(f"⚠️ JSON parsing error: {str(e)}. Extracting keywords from transcript.")
                keywords = self._extract_keywords_from_transcript(transcription)
                
                return {
                    "status": "success",
                    "report": response.text,
                    "confidence_score": 0.5,
                    "keywords": keywords,
                    "reasoning": "JSON parsing failed - keywords extracted from transcript",
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
    
    def _get_follow_up_prompt(self, transcription: str, patient_status: str = "stable", medications: str = "") -> str:
        """
        Specialized prompt for follow-up mental health sessions with quality metrics
        """
        medication_text = medications if medications else "No medications prescribed"
        
        return f"""
You are an experienced mental health professional reviewing a follow-up consultation transcript. 

⚠️ CRITICAL LANGUAGE & CONTEXT INSTRUCTIONS:
- This transcript is from a doctor speaking to a patient during a clinical consultation
- The transcript contains multilingual content: **Hindi, Marathi, and English** (all written in Devanagari script)
- Due to speech-to-text limitations, the transcript may contain:
  * Misspelled words or incorrect transcriptions
  * Missing words or phrases
  * Grammatical errors
  * Code-switching between languages mid-sentence
- Your task is to UNDERSTAND THE CLINICAL INTENT despite these errors
- **Minimize hallucinations** - only include information that is clearly present or strongly implied
- Provide the entire report in professional English
- Use **bold** (markdown **text**) for important clinical terms, diagnoses, medications, risk factors, and critical findings

TRANSCRIPT TO ANALYZE:
{transcription}

PATIENT STATUS: {patient_status}

MEDICATIONS PRESCRIBED:
{medication_text}

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
- Include prescribed medications from above

## RISK ASSESSMENT & SIDE EFFECTS
- side effects of medications
- risk of suicide or self-harm
- risk to others
- protective factors

GUIDELINES:
1. Keep each section to 2-3 bullet points maximum
2. Use professional but concise language
3. Only include information from the transcript
4. Skip sections if no relevant information is provided
5. Focus on key clinical findings and actionable insights
6. No placeholder text or template language

OUTPUT FORMAT - Return ONLY valid JSON with this exact structure:
{{
  "report": "<full markdown report text with all sections>",
  "confidence_score": 0.85,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "reasoning": "Brief explanation of confidence score based on transcript clarity, completeness, and coherence"
}}

CONFIDENCE SCORE CRITERIA (0.0-1.0):
- 0.9-1.0: Excellent clarity, comprehensive information, clear clinical narrative
- 0.7-0.89: Good quality, most key information present, minor gaps
- 0.5-0.69: Moderate quality, some missing information or unclear sections
- 0.0-0.49: Poor quality, significant gaps or very unclear transcription

KEYWORDS: Extract exactly 10 most important clinical keywords from the consultation (e.g., "anxiety", "insomnia", "medication", "improvement", "therapy", "stress", "panic attacks", "sleep disturbance", "appetite", "mood").

Return ONLY the JSON object. No markdown code blocks, no extra text.
"""

    def _get_new_patient_prompt(self, transcription: str, patient_status: str = "stable", medications: str = "") -> str:
        """
        Specialized prompt for new patient mental health sessions with quality metrics
        """
        medication_text = medications if medications else "No medications prescribed"
        
        return f"""
You are an experienced mental health professional conducting an initial consultation assessment.

⚠️ CRITICAL LANGUAGE & CONTEXT INSTRUCTIONS:
- This transcript is from a doctor speaking to a patient during a clinical consultation
- The transcript contains multilingual content: **Hindi, Marathi, and English** (all written in Devanagari script)
- Due to speech-to-text limitations, the transcript may contain:
  * Misspelled words or incorrect transcriptions
  * Missing words or phrases
  * Grammatical errors
  * Code-switching between languages mid-sentence
- Your task is to UNDERSTAND THE CLINICAL INTENT despite these errors
- **Minimize hallucinations** - only include information that is clearly present or strongly implied
- Provide the entire report in professional English
- Use **bold** (markdown **text**) for important clinical terms, diagnoses, medications, risk factors, and critical findings

TRANSCRIPT TO ANALYZE:
{transcription}

PATIENT STATUS: {patient_status}

MEDICATIONS PRESCRIBED:
{medication_text}

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

## TREATMENT PLAN
- Include prescribed medications from above
- Recommended interventions

OUTPUT FORMAT - Return ONLY valid JSON with this exact structure:
{{
  "report": "<full markdown report text with all sections>",
  "confidence_score": 0.85,
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5", "keyword6", "keyword7", "keyword8", "keyword9", "keyword10"],
  "reasoning": "Brief explanation of confidence score based on transcript clarity, completeness, and coherence"
}}

CONFIDENCE SCORE CRITERIA (0.0-1.0):
- 0.9-1.0: Excellent clarity, comprehensive information, clear clinical narrative
- 0.7-0.89: Good quality, most key information present, minor gaps
- 0.5-0.69: Moderate quality, some missing information or unclear sections
- 0.0-0.49: Poor quality, significant gaps or very unclear transcription

KEYWORDS: Extract exactly 10 most important clinical keywords from the consultation (e.g., "depression", "anxiety", "trauma", "insomnia", "medication", "therapy", "panic", "stress", "suicidal thoughts", "mood swings").

GUIDELINES: Use professional terminology, be objective, highlight urgent concerns, maintain confidentiality.

Return ONLY the JSON object. No markdown code blocks, no extra text.
"""

    def _extract_keywords_from_transcript(self, transcription: str) -> list:
        """Extract meaningful clinical keywords from transcription when JSON parsing fails."""
        
        # Common mental health keywords to look for (Hindi/English)
        clinical_terms = {
            'anxiety': ['anxiety', 'चिंता', 'घबराहट'],
            'depression': ['depression', 'उदासी', 'अवसाद'],
            'sleep': ['sleep', 'insomnia', 'नींद', 'सोना'],
            'stress': ['stress', 'तनाव', 'दबाव'],
            'panic': ['panic', 'घबराहट', 'panic attack'],
            'tremor': ['tremor', 'trembling', 'कांपना', 'हाथ कांपना'],
            'palpitation': ['palpitation', 'heart', 'धड़कन', 'दिल'],
            'breathing': ['breathe', 'dyspnea', 'सांस', 'साँस'],
            'fatigue': ['fatigue', 'tired', 'थकान', 'थका'],
            'concentration': ['concentration', 'focus', 'ध्यान', 'काम'],
            'family': ['family', 'परिवार'],
            'counseling': ['counseling', 'therapy', 'परामर्श'],
            'medication': ['medication', 'medicine', 'दवा'],
            'work': ['work', 'office', 'काम', 'ऑफिस']
        }
        
        # Find which keywords are mentioned
        found_keywords = []
        transcription_lower = transcription.lower()
        
        for keyword, variations in clinical_terms.items():
            for variation in variations:
                if variation.lower() in transcription_lower:
                    found_keywords.append(keyword)
                    break  # Don't add same keyword multiple times
        
        # Return top 10, or defaults if none found
        if found_keywords:
            return found_keywords[:10]
        else:
            return ["consultation", "patient", "assessment"]

# Global instance
try:
    gemini_service = GeminiService()
    logger.info("✅ Global Gemini service initialized successfully")
except Exception as e:
    logger.error(f"❌ Failed to initialize global Gemini service: {str(e)}")
    gemini_service = None
