"""
Demo Request & Contact Form Endpoints (WITH DEBUGGING)
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone
import uuid
import logging
import traceback

from app.core.database import get_db
from app.models.demo_request import DemoRequest, DemoRequestStatus
from app.models.contact_message import ContactMessage, MessageStatus, MessagePriority
from app.services.email_service import email_service
from pydantic import BaseModel, EmailStr

router = APIRouter()
logger = logging.getLogger(__name__)


# Schemas
class DemoRequestCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    organization: Optional[str] = None
    job_title: Optional[str] = None
    message: Optional[str] = None
    preferred_date: Optional[str] = None


class ContactMessageCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: str
    message: str
    category: Optional[str] = None


# Demo Request Endpoint
@router.post("/demo-requests")
async def submit_demo_request(
    request: Request,
    data: DemoRequestCreate,
    db: Session = Depends(get_db)
):
    logger.info("=" * 60)
    logger.info("📋 NEW DEMO REQUEST RECEIVED")
    logger.info("=" * 60)
    logger.info(f"Name: {data.full_name}")
    logger.info(f"Email: {data.email}")
    logger.info(f"Phone: {data.phone}")
    logger.info(f"Organization: {data.organization}")
    logger.info("=" * 60)
    
    try:
        # Step 1: Save to database
        logger.info("💾 Step 1: Saving to database...")
        demo = DemoRequest(
            id=uuid.uuid4(),
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            organization=data.organization,
            job_title=data.job_title,
            message=data.message,
            preferred_date=data.preferred_date,
            status=DemoRequestStatus.NEW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent'),
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(demo)
        db.commit()
        db.refresh(demo)
        logger.info(f"✅ Saved to database with ID: {demo.id}")
        
        # Step 2: Send email notification to admin
        logger.info("📧 Step 2: Preparing admin notification email...")
        email_data = {
            'id': str(demo.id),
            'full_name': demo.full_name,
            'email': demo.email,
            'phone': demo.phone,
            'organization': demo.organization,
            'job_title': demo.job_title,
            'message': demo.message,
            'preferred_date': demo.preferred_date,
        }
        
        logger.info("📤 Sending admin notification...")
        admin_email_sent = email_service.send_demo_request_notification(email_data)
        
        if admin_email_sent:
            logger.info("✅ Admin notification sent successfully")
        else:
            logger.error("❌ Failed to send admin notification")
        
        # Step 3: Send confirmation to user
        logger.info("📧 Step 3: Sending user confirmation...")
        user_email_sent = email_service.send_confirmation_to_user(
            demo.email, demo.full_name, "demo"
        )
        
        if user_email_sent:
            logger.info("✅ User confirmation sent successfully")
        else:
            logger.error("❌ Failed to send user confirmation")
        
        logger.info("=" * 60)
        logger.info("✅ DEMO REQUEST PROCESSED SUCCESSFULLY")
        logger.info("=" * 60)
        
        return {
            "status": "success",
            "message": "Demo request submitted successfully",
            "data": {
                "request_id": str(demo.id),
                "admin_email_sent": admin_email_sent,
                "user_email_sent": user_email_sent
            }
        }
        
    except Exception as e:
        logger.error("=" * 60)
        logger.error("❌ ERROR PROCESSING DEMO REQUEST")
        logger.error("=" * 60)
        logger.error(f"Error: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        logger.error("Traceback:")
        logger.error(traceback.format_exc())
        logger.error("=" * 60)
        
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to submit demo request: {str(e)}")


# Contact Message Endpoint
@router.post("/contact-messages")
async def submit_contact_message(
    request: Request,
    data: ContactMessageCreate,
    db: Session = Depends(get_db)
):
    logger.info("=" * 60)
    logger.info("📧 NEW CONTACT MESSAGE RECEIVED")
    logger.info("=" * 60)
    logger.info(f"Name: {data.full_name}")
    logger.info(f"Subject: {data.subject}")
    logger.info("=" * 60)
    
    try:
        logger.info("💾 Saving to database...")
        contact = ContactMessage(
            id=uuid.uuid4(),
            full_name=data.full_name,
            email=data.email,
            phone=data.phone,
            subject=data.subject,
            message=data.message,
            category=data.category,
            priority=MessagePriority.MEDIUM,
            status=MessageStatus.NEW,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get('user-agent'),
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(contact)
        db.commit()
        db.refresh(contact)
        logger.info(f"✅ Saved with ID: {contact.id}")
        
        # Send emails
        logger.info("📧 Sending emails...")
        email_data = {
            'id': str(contact.id),
            'full_name': contact.full_name,
            'email': contact.email,
            'phone': contact.phone,
            'subject': contact.subject,
            'message': contact.message,
            'priority': contact.priority,
        }
        
        admin_email_sent = email_service.send_contact_message_notification(email_data)
        user_email_sent = email_service.send_confirmation_to_user(contact.email, contact.full_name, "contact")
        
        logger.info(f"Admin email sent: {admin_email_sent}")
        logger.info(f"User email sent: {user_email_sent}")
        logger.info("✅ CONTACT MESSAGE PROCESSED")
        
        return {
            "status": "success",
            "message": "Message submitted successfully",
            "data": {
                "message_id": str(contact.id),
                "admin_email_sent": admin_email_sent,
                "user_email_sent": user_email_sent
            }
        }
        
    except Exception as e:
        logger.error(f"❌ Contact form error: {str(e)}")
        logger.error(traceback.format_exc())
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


# Test Email Endpoint
@router.get("/test-email")
async def test_email_endpoint():
    """
    Test email configuration via API endpoint
    Visit: http://localhost:8000/api/v1/forms/test-email
    """
    logger.info("🧪 Test email endpoint called")
    
    test_data = {
        'full_name': 'API Test User',
        'email': 'test@example.com',
        'phone': '+91 9876543210',
        'organization': 'Test Org',
        'job_title': 'Tester',
        'message': 'This is a test from the API',
        'preferred_date': 'ASAP',
        'id': 'api-test-123'
    }
    
    try:
        logger.info("📤 Sending test email...")
        success = email_service.send_demo_request_notification(test_data)
        
        return {
            "status": "success" if success else "failed",
            "message": f"Test email {'sent successfully' if success else 'failed'} to {email_service.admin_email}",
            "config": {
                "smtp_host": email_service.smtp_host,
                "smtp_port": email_service.smtp_port,
                "smtp_user": email_service.smtp_user,
                "admin_email": email_service.admin_email,
                "password_set": bool(email_service.smtp_password),
                "password_length": len(email_service.smtp_password) if email_service.smtp_password else 0
            },
            "instructions": "Check the backend logs for detailed information. Check spam folder if email doesn't arrive within 2 minutes."
        }
    except Exception as e:
        logger.error(f"❌ Test email error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            "status": "error",
            "message": str(e),
            "instructions": "Check backend logs for detailed error information"
        }
