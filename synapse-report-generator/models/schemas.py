from pydantic import BaseModel, Field, validator
from typing import List, Optional


class TranscriptRequest(BaseModel):
    transcript: str = Field(..., min_length=10, max_length=10000, description="Hindi medical transcript")
    medications: str = Field(default="", max_length=2000, description="Prescribed medications")

    @validator('transcript')
    def validate_transcript(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Transcript cannot be empty")
        return v.strip()


class ComplaintCaptureScore(BaseModel):
    score: int = Field(..., ge=0, le=100)
    rationale: str = Field(..., min_length=3, max_length=500)


class AnalysisResponse(BaseModel):
    success: bool
    generated_report: Optional[str] = None
    highlight_tags: Optional[List[str]] = None
    complaint_capture_score: Optional[ComplaintCaptureScore] = None
    error: Optional[str] = None
    error_code: Optional[str] = None
