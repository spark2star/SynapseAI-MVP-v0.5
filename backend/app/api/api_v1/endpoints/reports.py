"""
Simple report generation endpoints using Gemini AI.
"""

import logging
from typing import Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.services.gemini_service import gemini_service

router = APIRouter()
logger = logging.getLogger(__name__)

class ReportGenerationRequest(BaseModel):
    transcription: str
    session_id: str
    session_type: str = Field(default="follow_up", description="Type of session (new_patient, follow_up)")
    patient_id: str = Field(default=None, description="Patient ID (optional)")

@router.post("/generate")
async def generate_report(request: ReportGenerationRequest):
    """
    Generate AI-powered medical report from transcription using Gemini 1.5 Flash
    """
    try:
        logger.info(f"Generating report for session {request.session_id}, type: {request.session_type}")
        
        if not request.transcription or not request.transcription.strip():
            raise HTTPException(status_code=400, detail="Transcription text is required")
        
        # Check if Gemini service is available
        if not gemini_service:
            logger.error("Gemini service not available")
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        # Generate report using Gemini
        result = await gemini_service.generate_medical_report(
            transcription=request.transcription,
            session_type=request.session_type
        )
        
        if result["status"] == "success":
            logger.info(f"Report generated successfully for session {request.session_id}")
            return {
                "status": "success",
                "data": {
                    "report": result["report"],
                    "session_id": request.session_id,
                    "session_type": result["session_type"],
                    "model_used": result["model_used"],
                    "transcription_length": result["transcription_length"],
                    "generated_at": result["generated_at"]
                }
            }
        else:
            logger.error(f"Gemini service error: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"AI service error: {result.get('error', 'Unknown error')}")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in report generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate report. Please try again.")

@router.get("/health")
async def health_check():
    """Check health of AI services."""
    gemini_status = "available" if gemini_service else "unavailable"
    
    return {
        "status": "success",
        "data": {
            "gemini_service": gemini_status,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1.0.0"
        }
    }