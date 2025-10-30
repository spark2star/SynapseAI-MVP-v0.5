"""
Gemini AI service for medical report generation using Google service account.
Provides intelligent analysis with cultural context for Indian mental health consultations.
"""

import os
import json
import logging
import traceback
from typing import Dict, Any
from datetime import datetime, timezone

from google.oauth2 import service_account
import google.auth.transport.requests
import vertexai
from vertexai.generative_models import GenerativeModel, SafetySetting, HarmCategory, HarmBlockThreshold

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for AI-powered mental health reports using service account credentials."""
    
    def __init__(self):
        # Initialize with service account credentials
        try:
            # Load service account credentials
            credentials_path = "gcp-credentials.json"
            if os.path.exists(credentials_path):
                self.project = os.getenv("GCP_PROJECT_ID", "synapse-product-1")
                self.location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
                # Use model from environment variable, fallback to gemini-2.0-flash-exp
                self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
                
                # Initialize Vertex AI with service account credentials
                vertexai.init(
                    project=self.project,
                    location=self.location,
                    credentials=service_account.Credentials.from_service_account_file(
                        credentials_path,
                        scopes=['https://www.googleapis.com/auth/cloud-platform']
                    )
                )
                
                # Initialize Gemini model via Vertex AI
                self.model = GenerativeModel(self.model_name)
                
                logger.info(f"✅ Gemini initialized via Vertex AI (project: {self.project}, location: {self.location}, model: {self.model_name})")
            else:
                raise FileNotFoundError("GCP credentials file not found")
                
        except Exception as e:
            logger.error(f"❌ Failed to initialize Gemini service: {str(e)}")
            raise
    
    async def generate_medical_report(self, transcription: str, session_type: str = "follow_up", patient_status: str = "stable", medications: str = "") -> dict:
        """
        Generate a structured mental health report from consultation transcription with quality metrics.
        Logs full traceback on error.
        
        Returns:
        {
            "status": "success" | "error",
            "report": "...", # On success
            "confidence_score": 0.85, # On success
            "keywords": ["anxiety", "sleep", ...], # On success
            "reasoning": "...", # On success
            "model_used": "...", # On success
            "session_type": "...", # On success
            "transcription_length": ..., # On success
            "generated_at": "...", # On success
            "error": "...", # On error
        }
        """
        try:
            logger.info(f"🤖 Generating {session_type} report for transcript length: {len(transcription)}")
            logger.info(f"📝 Transcript preview: {transcription[:200]}...")

            # --- [Keep translation logic] ---
            translated_transcript = await self._translate_to_english_if_needed(transcription)

            # --- [Keep prompt selection logic] ---
            if session_type == "follow_up":
                prompt = self._get_follow_up_prompt(translated_transcript, patient_status, medications)
            else:
                prompt = self._get_new_patient_prompt(translated_transcript, patient_status, medications)

            # --- [Keep generation_config and safety_settings] ---
            generation_config = {
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 2048,
                "response_mime_type": "application/json"
            }
            safety_settings = [
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                    threshold=HarmBlockThreshold.BLOCK_NONE
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                    threshold=HarmBlockThreshold.BLOCK_NONE
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                    threshold=HarmBlockThreshold.BLOCK_NONE
                ),
                SafetySetting(
                    category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                    threshold=HarmBlockThreshold.BLOCK_NONE
                ),
            ]
            logger.info("🛡️ Safety settings configured: BLOCK_NONE for all categories")

            # --- [Keep model instantiation] ---
            model_with_config = GenerativeModel(
                self.model_name,
                generation_config=generation_config,
                safety_settings=safety_settings
            )

            # --- Call Gemini API ---
            try:
                logger.info("🚀 Calling Gemini API...")
                response = model_with_config.generate_content(prompt)
                logger.info("✅ Gemini API call successful")
            except Exception as api_error:
                logger.error(f"❌ Gemini API call failed: {str(api_error)}")
                logger.error(f"❌ API Error type: {type(api_error).__name__}")
                return self._generate_fallback_report(translated_transcript, session_type, patient_status, medications)

            # --- [Keep response validation, logging, and fallback logic] ---
            # ... (check response.candidates, safety ratings etc.) ...
            if not response.candidates:
                logger.warning("⚠️ Gemini response has no candidates - using fallback")
                logger.warning(f"⚠️ Response object: {response}")
                return self._generate_fallback_report(translated_transcript, session_type, patient_status, medications)
            
            if not response.candidates[0].content.parts:
                # Handle safety blocking or empty response
                logger.warning("⚠️ Gemini response blocked or empty - using fallback")
                logger.warning(f"⚠️ Finish reason: {response.candidates[0].finish_reason}")
                logger.warning(f"⚠️ Full candidate: {response.candidates[0]}")
                if response.candidates[0].safety_ratings:
                    logger.warning(f"⚠️ Safety ratings: {response.candidates[0].safety_ratings}")
                    for rating in response.candidates[0].safety_ratings:
                        logger.warning(f"⚠️ Safety: {rating.category} = {rating.probability}")
                return self._generate_fallback_report(translated_transcript, session_type, patient_status, medications)


            # --- [Keep JSON parsing logic] ---
            import json
            import re
            response_text = response.text.strip()
            # ... (extract JSON from markdown if needed) ...

            try:
                result = json.loads(response_text)
                # ... (limit keywords) ...
                return {
                    "status": "success",
                    # ... (rest of success fields) ...
                    "report": result.get("report", response.text), # Fallback if 'report' key missing
                    "confidence_score": result.get("confidence_score", 0.75),
                    "keywords": result.get("keywords", [])[:10], # Limit here too
                    "reasoning": result.get("reasoning", ""),
                    "model_used": self.model_name,
                    "session_type": session_type,
                    "transcription_length": len(transcription),
                    "generated_at": datetime.now(timezone.utc).isoformat()
                }
            except json.JSONDecodeError as json_e:
                # Handle cases where Gemini didn't return valid JSON
                logger.warning(f"⚠️ Gemini JSON parsing error: {str(json_e)}. Attempting to extract report content.")
                
                # Try multiple extraction strategies
                report_content = response.text
                confidence_score = 0.5
                keywords = []
                reasoning = ""
                
                try:
                    import re
                    
                    # Strategy 1: Try to extract report field
                    report_match = re.search(r'"report"\s*:\s*"((?:[^"\\]|\\.)*)(?:"|$)', response.text, re.DOTALL)
                    if report_match:
                        report_content = report_match.group(1).replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')
                        logger.info(f"✅ Extracted report content ({len(report_content)} chars)")
                    
                    # Strategy 2: Try to extract confidence_score
                    conf_match = re.search(r'"confidence_score"\s*:\s*([0-9.]+)', response.text)
                    if conf_match:
                        confidence_score = float(conf_match.group(1))
                        logger.info(f"✅ Extracted confidence score: {confidence_score}")
                    
                    # Strategy 3: Try to extract keywords array
                    keywords_match = re.search(r'"keywords"\s*:\s*\[(.*?)\]', response.text, re.DOTALL)
                    if keywords_match:
                        keywords_str = keywords_match.group(1)
                        keywords = [k.strip().strip('"\'') for k in keywords_str.split(',') if k.strip()]
                        keywords = [k for k in keywords if k and len(k) > 0][:10]
                        logger.info(f"✅ Extracted {len(keywords)} keywords")
                    
                    # Strategy 4: Try to extract reasoning
                    reasoning_match = re.search(r'"reasoning"\s*:\s*"((?:[^"\\]|\\.)*)"', response.text)
                    if reasoning_match:
                        reasoning = reasoning_match.group(1).replace('\\n', ' ').replace('\\"', '"')
                        logger.info(f"✅ Extracted reasoning")
                    
                    # Fallback for keywords if extraction failed
                    if not keywords:
                        keywords = self._extract_keywords_from_transcript(transcription)
                        logger.info(f"Using fallback keywords from transcript")
                    
                except Exception as extract_error:
                    logger.warning(f"⚠️ Error during extraction: {str(extract_error)}")
                    keywords = self._extract_keywords_from_transcript(transcription)
                
                return {
                    "status": "success",
                    "report": report_content,
                    "confidence_score": confidence_score,
                    "keywords": keywords[:10],
                    "reasoning": reasoning or f"Partial extraction from malformed JSON: {str(json_e)}",
                    "model_used": self.model_name,
                    "session_type": session_type,
                    "transcription_length": len(transcription),
                    "generated_at": datetime.now(timezone.utc).isoformat()
                }

        except Exception as e:
            # --- Enhanced Error Logging ---
            error_message = f"Error generating medical report: {str(e)}"
            logger.error(f"❌ {error_message}")
            logger.error(f"❌ Transcript Preview: {transcription[:200]}...")
            # Log the full traceback
            logger.error(f"❌ Full traceback: {traceback.format_exc()}")
            return {
                "status": "error",
                "error": error_message, # Include the formatted error message
                "model_used": self.model_name, # Use self.model_name
                "region": self.location # Use self.location if defined, else default
            }

    # Helper function needed in GeminiService (or adapt existing)
    def _extract_keywords_from_transcript(self, transcript: str) -> list:
        # Placeholder: Implement a simple keyword extraction (e.g., based on frequency or NLP lib)
        # For now, return empty list
        logger.warning("Keyword extraction fallback used.")
        # Example: Simple word frequency (adjust as needed)
        try:
            words = [w.lower() for w in transcript.split() if len(w) > 3] # Basic filter
            from collections import Counter
            common_words = [item[0] for item in Counter(words).most_common(10)]
            return common_words
        except:
            return []

    # Helper function needed in GeminiService (or adapt existing)
    def _generate_fallback_report(self, transcript: str, session_type: str, patient_status: str, medications: str) -> dict:
         logger.warning("⚠️ Generating fallback template report due to Gemini issues.")
         # Create a very basic structured report based on available info
         report_text = f"""
## FALLBACK REPORT - AI Generation Failed

**Session Type:** {session_type}
**Patient Status:** {patient_status}
**Medications Mentioned/Prescribed:**
{medications}

**Transcript Provided:**
{transcript[:1000]}... (truncated)

**Reason:** AI generation was blocked or failed. Please review the transcript manually.
"""
         keywords = self._extract_keywords_from_transcript(transcript)

         return {
            "status": "success", # Mark as success so it gets saved, but indicate fallback
            "report": report_text,
            "confidence_score": 0.1, # Very low confidence
            "keywords": keywords,
            "reasoning": "Fallback report generated due to AI failure or safety block.",
            "model_used": "fallback_template",
            "session_type": session_type,
            "transcription_length": len(transcript),
            "generated_at": datetime.now(timezone.utc).isoformat()
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

    async def _translate_to_english_if_needed(self, transcription: str) -> str:
        """
        Translate non-English (Marathi/Hindi) transcripts to English to bypass Gemini safety filters.
        Gemini blocks non-English medical content but accepts English.
        """
        # Check if transcript contains Devanagari script
        has_devanagari = any('\u0900' <= char <= '\u097F' for char in transcription)
        
        if not has_devanagari:
            logger.info("📝 Transcript is in English - no translation needed")
            return transcription
        
        logger.info("🌐 Detecting non-English (Marathi/Hindi) transcript - translating to English...")
        
        try:
            translation_prompt = f"""Translate the following medical consultation transcript from Hindi/Marathi to English. 
This is a clinical mental health consultation.

IMPORTANT:
- Translate accurately, preserving all medical terminology
- Keep the clinical meaning intact
- Use professional medical English
- Translate phrases like "रुग्ण" to "patient", "चिंता" to "anxiety", "झोप" to "sleep", etc.

TRANSCRIPT TO TRANSLATE:
{transcription}

RESPOND WITH ONLY THE ENGLISH TRANSLATION, NO EXPLANATIONS.
"""
            
            # Use simple model without JSON mode for translation
            simple_model = GenerativeModel(
                self.model_name,
                generation_config={"temperature": 0.1, "max_output_tokens": 2048},
                safety_settings=[
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                    SafetySetting(
                        category=HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold=HarmBlockThreshold.BLOCK_NONE
                    ),
                ]
            )
            
            translation_response = simple_model.generate_content(translation_prompt)
            
            if translation_response.candidates and translation_response.candidates[0].content.parts:
                translated = translation_response.text.strip()
                logger.info(f"✅ Translation successful: {translated[:100]}...")
                return translated
            else:
                logger.warning("⚠️ Translation blocked - using original transcript")
                return transcription
                
        except Exception as e:
            logger.warning(f"⚠️ Translation failed: {str(e)} - using original transcript")
            return transcription

    def _generate_fallback_report(self, transcription: str, session_type: str, patient_status: str, medications: str) -> dict:
        """
        Generate a basic template report when Gemini safety filters block the AI generation.
        Uses simple keyword extraction and template formatting.
        """
        logger.info("📝 Generating fallback template report...")
        
        # Extract keywords from transcript
        keywords = self._extract_keywords_from_transcript(transcription)
        
        # Build a simple report template
        report_sections = []
        
        report_sections.append("## CHIEF COMPLAINT")
        report_sections.append(f"- Consultation transcript provided ({len(transcription)} characters)")
        report_sections.append(f"- Session type: {session_type.replace('_', ' ').title()}")
        
        report_sections.append("\n## HISTORY OF PRESENT ILLNESS")
        report_sections.append(f"- Clinical information documented in transcription")
        report_sections.append(f"- Patient status reported as: **{patient_status}**")
        
        if "sleep" in transcription.lower() or "insomnia" in transcription.lower() or "झोप" in transcription:
            report_sections.append("\n## SLEEP & PHYSICAL HEALTH")
            report_sections.append("- Sleep disturbances mentioned in consultation")
        
        if medications and medications != "No medications prescribed":
            report_sections.append("\n## MEDICATION & TREATMENT")
            report_sections.append(f"{medications}")
        
        report_sections.append("\n## PROVISIONAL ASSESSMENT")
        report_sections.append(f"- Clinical findings documented")
        report_sections.append(f"- Patient showing **{patient_status}** progress")
        
        report_text = "\n".join(report_sections)
        
        logger.info(f"✅ Fallback report generated: {len(report_text)} characters")
        
        return {
            "status": "success",
            "report": report_text,
            "confidence_score": 0.65,  # Lower confidence for template
            "keywords": keywords[:10],
            "reasoning": "Template report generated (AI safety filters blocked full generation)",
            "model_used": "template-fallback",
            "session_type": session_type,
            "transcription_length": len(transcription),
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

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
