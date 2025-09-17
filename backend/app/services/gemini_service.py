"""
Gemini AI service for medical report generation and clinical insights.
Integrates with Google's Vertex AI Gemini 2.5 Flash model.
"""

import os
import json
import asyncio
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import logging

import google.generativeai as genai
from google.oauth2 import service_account
from google.cloud import aiplatform
import vertexai
from vertexai.generative_models import GenerativeModel, Part

from app.core.config import settings
from app.models.session import ConsultationSession, Transcription
from app.models.report import Report, ReportType
from app.core.database import get_db
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)

class GeminiService:
    """Service for AI-powered medical insights using Gemini 2.5 Flash."""
    
    def __init__(self):
        self.project_id = "synapse-product-1"
        self.location = "us-central1"
        self.model_name = "gemini-2.5-flash"
        self.credentials_path = "gcp-credentials.json"
        
        # Initialize Vertex AI
        self._initialize_vertex_ai()
        
        # Initialize Gemini model
        self.model = None
        self._initialize_model()
    
    def _initialize_vertex_ai(self):
        """Initialize Vertex AI with service account credentials."""
        try:
            # Load service account credentials
            credentials = service_account.Credentials.from_service_account_file(
                self.credentials_path,
                scopes=['https://www.googleapis.com/auth/cloud-platform']
            )
            
            # Initialize Vertex AI
            vertexai.init(
                project=self.project_id,
                location=self.location,
                credentials=credentials
            )
            
            logger.info(f"Vertex AI initialized for project {self.project_id}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vertex AI: {str(e)}")
            raise
    
    def _initialize_model(self):
        """Initialize the Gemini 2.5 Flash model."""
        try:
            self.model = GenerativeModel("gemini-2.5-flash")
            logger.info("Gemini 2.5 Flash model initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Gemini model: {str(e)}")
            raise
    
    async def generate_medical_report(
        self, 
        consultation_session: ConsultationSession,
        transcription_text: str,
        report_type: str = "consultation"
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive medical report from consultation transcription.
        
        Args:
            consultation_session: The consultation session object
            transcription_text: The full transcription text
            report_type: Type of report to generate (consultation, follow_up, etc.)
            
        Returns:
            Dict containing the generated report and metadata
        """
        try:
            # Prepare the medical prompt
            prompt = self._create_medical_prompt(
                consultation_session, 
                transcription_text, 
                report_type
            )
            
            # Generate content using Gemini
            response = await self._generate_content(prompt)
            
            # Parse and structure the response
            structured_report = self._parse_medical_response(response, report_type)
            
            return {
                "status": "success",
                "report": structured_report,
                "model_used": self.model_name,
                "generated_at": datetime.now(timezone.utc).isoformat(),
                "confidence": structured_report.get("confidence", 0.95)
            }
            
        except Exception as e:
            logger.error(f"Error generating medical report: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "model_used": self.model_name,
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    def _create_medical_prompt(
        self, 
        session: ConsultationSession, 
        transcription: str, 
        report_type: str
    ) -> str:
        """Create a medical-specific prompt for Gemini."""
        
        base_prompt = f"""
You are an expert medical AI assistant helping to generate a comprehensive medical report.

CONSULTATION DETAILS:
- Session Type: {session.session_type}
- Chief Complaint: {session.chief_complaint or 'Not specified'}
- Session Duration: {session.total_duration or 0} minutes
- Date: {session.started_at}

TRANSCRIPTION:
{transcription}

INSTRUCTIONS:
Generate a professional medical report with the following structure:

1. CHIEF COMPLAINT
   - Primary reason for visit
   - Patient's main concerns

2. HISTORY OF PRESENT ILLNESS
   - Detailed narrative of current symptoms
   - Timeline and progression
   - Associated symptoms

3. REVIEW OF SYSTEMS
   - Relevant positive and negative findings
   - System-specific inquiries

4. PHYSICAL EXAMINATION
   - General appearance
   - Vital signs (if mentioned)
   - System-specific findings

5. ASSESSMENT
   - Clinical impression
   - Differential diagnoses
   - Risk factors

6. PLAN
   - Diagnostic recommendations
   - Treatment plan
   - Follow-up instructions
   - Patient education

7. CLINICAL INSIGHTS
   - AI-powered observations
   - Potential red flags
   - Care recommendations

REQUIREMENTS:
- Use professional medical terminology
- Be thorough but concise
- Include confidence levels for key assessments
- Highlight any urgent findings
- Maintain patient confidentiality standards
- Use structured format with clear headings

OUTPUT FORMAT: Return as structured JSON with clear sections.
"""
        
        if report_type == "follow_up":
            base_prompt += """
SPECIAL FOCUS FOR FOLLOW-UP:
- Progress since last visit
- Treatment response
- Medication compliance
- New or persistent symptoms
"""
        
        return base_prompt
    
    async def _generate_content(self, prompt: str) -> str:
        """Generate content using Gemini model."""
        try:
            # Use asyncio to run the synchronous Gemini call
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None, 
                self.model.generate_content, 
                prompt
            )
            
            return response.text
            
        except Exception as e:
            logger.error(f"Error calling Gemini API: {str(e)}")
            raise
    
    def _parse_medical_response(self, response_text: str, report_type: str) -> Dict[str, Any]:
        """Parse and structure the Gemini response."""
        try:
            # Try to parse as JSON first
            if response_text.strip().startswith('{'):
                return json.loads(response_text)
            
            # If not JSON, create structured response
            return {
                "report_type": report_type,
                "content": response_text,
                "sections": self._extract_sections(response_text),
                "confidence": 0.90,
                "ai_generated": True,
                "model": self.model_name
            }
            
        except json.JSONDecodeError:
            # Fallback to structured text parsing
            return {
                "report_type": report_type,
                "content": response_text,
                "confidence": 0.85,
                "ai_generated": True,
                "model": self.model_name,
                "note": "Generated from unstructured AI response"
            }
    
    def _extract_sections(self, text: str) -> Dict[str, str]:
        """Extract medical report sections from text."""
        sections = {}
        current_section = None
        current_content = []
        
        lines = text.split('\n')
        
        section_headers = [
            'CHIEF COMPLAINT', 'HISTORY OF PRESENT ILLNESS',
            'REVIEW OF SYSTEMS', 'PHYSICAL EXAMINATION',
            'ASSESSMENT', 'PLAN', 'CLINICAL INSIGHTS'
        ]
        
        for line in lines:
            line = line.strip()
            
            # Check if line is a section header
            if any(header in line.upper() for header in section_headers):
                # Save previous section
                if current_section and current_content:
                    sections[current_section] = '\n'.join(current_content).strip()
                
                # Start new section
                current_section = line.upper().replace(':', '').strip()
                current_content = []
            elif current_section and line:
                current_content.append(line)
        
        # Save last section
        if current_section and current_content:
            sections[current_section] = '\n'.join(current_content).strip()
        
        return sections
    
    async def generate_clinical_insights(
        self, 
        transcription_text: str,
        patient_history: Optional[str] = None
    ) -> Dict[str, Any]:
        """Generate clinical insights and recommendations."""
        
        prompt = f"""
As a medical AI assistant, analyze the following consultation transcription and provide clinical insights:

TRANSCRIPTION:
{transcription_text}

{f"PATIENT HISTORY: {patient_history}" if patient_history else ""}

Provide the following insights:

1. KEY CLINICAL FINDINGS
   - Important symptoms mentioned
   - Clinical red flags
   - Vital information patterns

2. DIFFERENTIAL DIAGNOSIS CONSIDERATIONS
   - Possible conditions based on symptoms
   - Likelihood assessment
   - Additional tests needed

3. TREATMENT RECOMMENDATIONS
   - Evidence-based treatment options
   - Medication considerations
   - Lifestyle modifications

4. FOLLOW-UP PRIORITIES
   - Monitoring requirements
   - When to return
   - Warning signs for patients

5. DOCUMENTATION QUALITY
   - Completeness of information
   - Missing elements
   - Suggestions for improvement

Return as structured JSON with confidence scores.
"""
        
        try:
            response = await self._generate_content(prompt)
            
            return {
                "status": "success",
                "insights": self._parse_medical_response(response, "clinical_insights"),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating clinical insights: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def summarize_patient_history(
        self, 
        consultation_sessions: List[ConsultationSession]
    ) -> Dict[str, Any]:
        """Generate a comprehensive patient history summary."""
        
        # Prepare session summaries
        session_summaries = []
        for session in consultation_sessions:
            summary = f"""
Date: {session.started_at}
Type: {session.session_type}
Chief Complaint: {session.chief_complaint or 'Not specified'}
Duration: {session.total_duration or 0} minutes
Status: {session.status}
"""
            session_summaries.append(summary)
        
        prompt = f"""
Analyze the following patient consultation history and provide a comprehensive summary:

CONSULTATION HISTORY:
{''.join(session_summaries)}

Provide:
1. PATIENT JOURNEY OVERVIEW
   - Key health events and timeline
   - Recurring issues or patterns
   - Treatment progression

2. CHRONIC CONDITIONS
   - Ongoing health issues
   - Management status
   - Trends over time

3. CARE COORDINATION
   - Specialist referrals
   - Treatment adherence
   - Care gaps

4. RISK ASSESSMENT
   - Health risk factors
   - Preventive care needs
   - Warning indicators

Return as structured summary with clinical significance.
"""
        
        try:
            response = await self._generate_content(prompt)
            
            return {
                "status": "success",
                "summary": self._parse_medical_response(response, "patient_history"),
                "sessions_analyzed": len(consultation_sessions),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating patient summary: {str(e)}")
            return {
                "status": "error",
                "error": str(e),
                "generated_at": datetime.now(timezone.utc).isoformat()
            }

# Global Gemini service instance
try:
    gemini_service = GeminiService()
    logger.info("Gemini service initialized successfully")
except Exception as e:
    logger.error(f"Failed to initialize Gemini service: {str(e)}")
    gemini_service = None
