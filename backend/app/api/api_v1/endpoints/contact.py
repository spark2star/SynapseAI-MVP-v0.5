from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field
from typing import Dict, Optional
from datetime import datetime

from app.core.database import get_db
from app.models.contact import ContactSubmission

router = APIRouter()


class ContactSubmitRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=255, description="Full name of the person")
    email: EmailStr = Field(..., description="Email address")
    subject: Optional[str] = Field(None, max_length=500, description="Subject of the message")
    message: str = Field(..., min_length=1, description="Message content")
    source: str = Field(default="landing_page", description="Source of the contact form")
    ip_address: Optional[str] = Field(None, description="IP address of the submitter")
    user_agent: Optional[str] = Field(None, description="User agent of the submitter")


class ContactSubmitResponse(BaseModel):
    message: str
    submission_id: str
    submitted_at: datetime
    estimated_response_time: str


@router.post("/submit", response_model=ContactSubmitResponse)
def submit_contact_form(
    request: ContactSubmitRequest,
    db: Session = Depends(get_db)
) -> ContactSubmitResponse:
    """
    Submit a contact form from the landing page
    """
    try:
        # Create new contact submission
        new_submission = ContactSubmission(
            name=request.name.strip(),
            email=request.email.lower(),
            subject=request.subject.strip() if request.subject else None,
            message=request.message.strip(),
            source=request.source,
            ip_address=request.ip_address,
            user_agent=request.user_agent
        )

        db.add(new_submission)
        db.commit()
        db.refresh(new_submission)

        # Determine estimated response time based on subject/message content
        priority_keywords = ['urgent', 'partnership', 'investment', 'collaboration', 'demo', 'pilot']
        message_lower = (request.message + ' ' + (request.subject or '')).lower()
        
        if any(keyword in message_lower for keyword in priority_keywords):
            response_time = "within 12 hours"
        else:
            response_time = "within 24 hours"

        return ContactSubmitResponse(
            message="Thank you for your message! Our team will get back to you soon.",
            submission_id=new_submission.id,
            submitted_at=new_submission.submitted_at,
            estimated_response_time=response_time
        )

    except Exception as e:
        db.rollback()
        print(f"Contact form submission error: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while processing your message"
        )


@router.get("/submissions")
def get_contact_submissions(
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db)
) -> Dict[str, any]:
    """
    Get contact form submissions (admin endpoint)
    """
    try:
        total = db.query(ContactSubmission).count()
        submissions = db.query(ContactSubmission)\
            .order_by(ContactSubmission.submitted_at.desc())\
            .limit(limit)\
            .offset(offset)\
            .all()

        submissions_data = []
        for submission in submissions:
            submissions_data.append({
                "id": submission.id,
                "name": submission.name,
                "email": submission.email,
                "subject": submission.subject,
                "message": submission.message[:200] + "..." if len(submission.message) > 200 else submission.message,
                "source": submission.source,
                "submitted_at": submission.submitted_at,
                "ip_address": submission.ip_address
            })

        return {
            "total": total,
            "limit": limit,
            "offset": offset,
            "submissions": submissions_data
        }

    except Exception as e:
        print(f"Error fetching contact submissions: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching submissions"
        )


@router.get("/submissions/{submission_id}")
def get_contact_submission(
    submission_id: str,
    db: Session = Depends(get_db)
) -> Dict[str, any]:
    """
    Get a specific contact form submission (admin endpoint)
    """
    try:
        submission = db.query(ContactSubmission).filter(
            ContactSubmission.id == submission_id
        ).first()

        if not submission:
            raise HTTPException(
                status_code=404,
                detail="Contact submission not found"
            )

        return {
            "id": submission.id,
            "name": submission.name,
            "email": submission.email,
            "subject": submission.subject,
            "message": submission.message,
            "source": submission.source,
            "ip_address": submission.ip_address,
            "user_agent": submission.user_agent,
            "submitted_at": submission.submitted_at
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error fetching contact submission: {e}")
        raise HTTPException(
            status_code=500,
            detail="Internal server error while fetching submission"
        )

