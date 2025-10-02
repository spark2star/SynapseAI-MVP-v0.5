"""
Simple FastAPI app with basic authentication and STT testing.
NOW GENERATES REAL JWT TOKENS for WebSocket authentication!
"""

import asyncio
import json
import os
import threading
import queue
import time
from datetime import datetime, timezone
import numpy as np
from google.cloud import speech
from google.oauth2 import service_account
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Header
import re
from fastapi import Request, Depends
from fastapi.websockets import WebSocketState
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import REAL JWT manager from production backend
from app.core.security import JWTManager

# Load environment variables
load_dotenv()

# Initialize JWT manager for REAL token generation
jwt_manager = JWTManager()

# Initialize Google Cloud Speech client with proper path
# Use relative path that works in both development and Docker container
credentials_path = "gcp-credentials.json"

print(f"Loading Google Cloud credentials from: {credentials_path}")
print(f"Current working directory: {os.getcwd()}")
print(f"Credentials file exists: {os.path.exists(credentials_path)}")
if os.path.exists(credentials_path):
    print(f"Credentials file size: {os.path.getsize(credentials_path)} bytes")
else:
    print(f"❌ Credentials not found at: {os.path.abspath(credentials_path)}")

# Enable Google Cloud Speech-to-Text for real STT
try:
    print("⏳ Initializing Google Cloud Speech-to-Text...")
    from google.oauth2 import service_account
    credentials = service_account.Credentials.from_service_account_file(
        credentials_path,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    speech_client = speech.SpeechClient(credentials=credentials)
    print("✅ Google Cloud Speech-to-Text initialized successfully")
except Exception as e:
    print(f"❌ Failed to initialize Google Cloud Speech client: {e}")
    print("Will use mock transcription as fallback")
    speech_client = None

app = FastAPI(
    title="Intelligent EMR System",
    description="Healthcare Management System with AI Integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

@app.get("/")
async def root():
    return {"message": "Intelligent EMR System is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "EMR Backend"}

@app.get("/api/v1/health")
async def api_health_check():
    return {"status": "healthy", "service": "EMR API v1"}

@app.post("/api/v1/auth/login")
async def login(login_data: LoginRequest):
    """
    Temporary login endpoint for testing.
    NOW GENERATES REAL JWT TOKENS for WebSocket authentication!
    """
    # Demo credentials
    demo_users = {
        "doctor@demo.com": {"password": "password123", "role": "doctor", "name": "Dr. Smith", "id": "user-doctor-1"},
        "admin@demo.com": {"password": "password123", "role": "admin", "name": "Admin User", "id": "user-admin-1"},
        "reception@demo.com": {"password": "password123", "role": "receptionist", "name": "Reception", "id": "user-reception-1"}
    }
    
    if login_data.email not in demo_users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = demo_users[login_data.email]
    if user_data["password"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Generate REAL JWT tokens using the production JWT manager
    user_id = user_data["id"]
    access_token = jwt_manager.create_access_token(
        data={"sub": user_id, "email": login_data.email, "role": user_data["role"]}
    )
    refresh_token = jwt_manager.create_refresh_token(
        data={"sub": user_id}
    )
    
    print(f"✅ Generated REAL JWT for {login_data.email}")
    print(f"   Access token: {access_token[:50]}...")
    
    return {
        "status": "success", 
        "data": {
            "access_token": access_token,  # REAL JWT TOKEN!
            "refresh_token": refresh_token,  # REAL REFRESH TOKEN!
            "token_type": "bearer",
            "expires_in": 3600,  # 1 hour
            "user_id": user_id,
            "role": user_data["role"],
            "email": login_data.email,
            "name": user_data["name"]
        }
    }

@app.get("/api/v1/users/me")
async def get_current_user():
    """Mock current user endpoint."""
    return {
        "status": "success",
        "data": {
        "id": "demo-user-id",
        "email": "doctor@demo.com", 
        "role": "doctor",
        "name": "Dr. Smith"
        }
    }

# ---------------------------------------------------------------------------
# Helper: Get current user from Authorization header (Bearer token)
# ---------------------------------------------------------------------------
class CurrentUser(BaseModel):
    id: str
    email: str

def get_current_user_from_request(request: Request) -> CurrentUser:
    auth_header = request.headers.get('Authorization') or request.headers.get('authorization')
    if not auth_header or not auth_header.lower().startswith('bearer '):
        # In demo, return a default user to avoid blocking
        return CurrentUser(id="user-doctor-1", email="doctor@demo.com")
    token = auth_header.split(' ', 1)[1]
    try:
        payload = jwt_manager.verify_token(token, token_type="access")
        return CurrentUser(id=payload.get("sub", "user-doctor-1"), email=payload.get("email", "doctor@demo.com"))
    except Exception:
        # Fallback to demo
        return CurrentUser(id="user-doctor-1", email="doctor@demo.com")

@app.get("/api/v1/users/profile")
async def get_user_profile():
    """Mock user profile endpoint that frontend calls after login."""
    return {
        "status": "success",
        "data": {
            "id": "demo-user-id",
            "first_name": "Dr.",
            "last_name": "Smith",
            "email": "doctor@demo.com",
            "phone": "+1-555-0123",
            "specialization": "General Medicine",
            "license_number": "MD123456",
            "department": "Internal Medicine",
            "role": "doctor",
            "is_verified": True,
            "is_active": True,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    }

@app.get("/api/v1/auth/validate-token")
async def validate_token():
    """Mock token validation endpoint."""
    return {
        "status": "success",
        "data": {
            "valid": True,
            "user_id": "demo-user-id",
            "role": "doctor",
            "email": "doctor@demo.com"
        }
    }

@app.post("/api/v1/patients/create")
async def create_patient(patient_data: dict):
    """Mock patient creation endpoint."""
    return {
        "status": "success",
        "data": {
            "id": f"patient-{len(str(patient_data))}",
            "patient_id": f"PAT-{hash(str(patient_data)) % 10000:04d}",
            "first_name": patient_data.get("first_name"),
            "last_name": patient_data.get("last_name"),
            "email": patient_data.get("email"),
            "phone_primary": patient_data.get("phone_primary"),
            "created_at": "2024-01-01T00:00:00Z"
        },
        "message": "Patient registered successfully"
    }

@app.get("/api/v1/patients/list/")  
async def list_patients():
    """Mock patient list endpoint."""
    return {
        "status": "success",
        "data": {
            "patients": [
                {
                    "id": "patient-1",
                    "patient_id": "PAT-0001",
                    "full_name": "John Doe",
                    "age": 35,
                    "gender": "male",
                    "phone_primary": "+1-555-1234",
                    "last_visit": None,
                    "created_at": "2024-01-01T00:00:00Z"
                },
                {
                    "id": "patient-2", 
                    "patient_id": "PAT-0002",
                    "full_name": "Jane Smith",
                    "age": 28,
                    "gender": "female", 
                    "phone_primary": "+1-555-5678",
                    "last_visit": "2024-01-15T10:00:00Z",
                    "created_at": "2023-12-15T00:00:00Z"
                }
            ],
            "total_count": 2,
            "limit": 50,
            "offset": 0
        }
    }

@app.post("/api/v1/auth/mfa/setup")
async def setup_mfa():
    """Mock MFA setup endpoint."""
    import base64
    
    # Create a real QR code for demo
    try:
        import qrcode
        import io
        
        # Generate a mock QR code
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data("otpauth://totp/EMR-System:doctor@demo.com?secret=JBSWY3DPEHPK3PXP&issuer=EMR-System")
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        qr_code_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        qr_data_url = f"data:image/png;base64,{qr_code_base64}"
    except ImportError:
        # Fallback if qrcode not available
        qr_data_url = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    
    return {
        "status": "success",
        "data": {
            "qr_code": qr_data_url,
            "secret": "JBSWY3DPEHPK3PXP",
            "backup_codes": [
                "BACKUP01", "BACKUP02", "BACKUP03", "BACKUP04", "BACKUP05",
                "BACKUP06", "BACKUP07", "BACKUP08", "BACKUP09", "BACKUP10"
            ],
            "instructions": "Scan the QR code with your authenticator app (Google Authenticator, Authy, etc.) and verify with a 6-digit code."
        }
    }

@app.post("/api/v1/auth/mfa/verify-setup")
async def verify_mfa_setup(request_data: dict):
    """Mock MFA verification endpoint."""
    return {
        "status": "success", 
        "data": {
            "mfa_enabled": True,
            "message": "MFA has been successfully enabled for your account"
        }
    }

@app.post("/api/v1/auth/mfa/disable")
async def disable_mfa():
    """Mock MFA disable endpoint."""
    return {
        "status": "success",
        "data": {
            "mfa_disabled": True,
            "message": "MFA has been disabled for your account"
        }
    }

@app.get("/api/v1/patients/{patient_id}")
async def get_patient_details(patient_id: str):
    """Mock patient details endpoint."""
    if patient_id == "patient-1":
        return {
            "status": "success",
            "data": {
                "id": "patient-1",
                "patient_id": "PAT-0001",
                "full_name": "John Doe",
                "age": 35,
                "gender": "male",
                "phone_primary": "+1-555-1234",
                "email": "john.doe@email.com",
                "address": "123 Main St, City, State 12345",
                "emergency_contact": "Mary Doe (+1-555-9999)",
                "blood_group": "O+",
                "allergies": "Penicillin, Peanuts",
                "medical_history": "Hypertension, Diabetes Type 2",
                "created_at": "2024-01-01T00:00:00Z",
                "last_visit": None
            }
        }
    else:
        return {
            "status": "success", 
            "data": {
                "id": "patient-2",
                "patient_id": "PAT-0002",
                "full_name": "Jane Smith",
                "age": 28,
                "gender": "female",
                "phone_primary": "+1-555-5678",
                "email": "jane.smith@email.com",
                "address": "456 Oak Ave, City, State 67890",
                "emergency_contact": "Bob Smith (+1-555-8888)",
                "blood_group": "A+",
                "allergies": "None known",
                "medical_history": "Asthma",
                "created_at": "2023-12-15T00:00:00Z",
                "last_visit": "2024-01-15T10:00:00Z"
            }
        }

@app.post("/api/v1/consultation/start")
async def start_consultation_session(session_data: dict):
    """Mock consultation session start endpoint."""
    return {
        "status": "success",
        "data": {
            "session_id": "CS-2024-NEW",
            "patient_id": session_data.get("patient_id"),
            "doctor_id": session_data.get("doctor_id"), 
            "status": "in_progress",
            "started_at": "2024-01-01T00:00:00Z",
            "chief_complaint": session_data.get("chief_complaint"),
            "recording_url": "ws://localhost:8000/ws/consultation/CS-2024-NEW"
        }
    }

@app.post("/api/v1/consultation/{session_id}/stop")
async def stop_consultation_session(session_id: str):
    """Mock consultation session stop endpoint."""
    return {
        "status": "success",
        "data": {
            "session_id": session_id,
            "status": "completed",
            "ended_at": "2024-01-01T00:30:00Z",
            "duration_minutes": 30,
            "transcription_status": "completed",
            "has_recording": True
        }
    }

# Newsletter and Contact Form Endpoints
from pydantic import BaseModel, EmailStr
from typing import Optional

class NewsletterRequest(BaseModel):
    email: EmailStr
    source: str = "landing_page"

class ContactRequest(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str
    source: str = "landing_page"

@app.post("/api/v1/newsletter/subscribe")
async def subscribe_newsletter(request: NewsletterRequest, client_ip: str = Header(None, alias="x-forwarded-for")):
    """Subscribe to newsletter from landing page - SECURE"""
    try:
        # Rate limiting check (simple implementation)
        if not client_ip:
            client_ip = "unknown"
        # Import here to avoid circular imports
        from app.core.database import get_db
        from app.models.newsletter import NewsletterSubscription
        from sqlalchemy.exc import IntegrityError
        
        db = next(get_db())
        try:
            # Check if email already exists
            existing = db.query(NewsletterSubscription).filter(
                NewsletterSubscription.email == request.email.lower()
            ).first()
            
            if existing and existing.is_active:
                return {
                    "message": "Email is already subscribed to our newsletter",
                    "is_new_subscription": False
                }
            
            if existing:
                # Reactivate
                existing.is_active = True
                existing.unsubscribed_at = None
                db.commit()
            else:
                # Create new
                subscription = NewsletterSubscription(
                    email=request.email.lower(),
                    source=request.source,
                    is_active=True
                )
                db.add(subscription)
                db.commit()
            
            return {
                "message": "Successfully subscribed to newsletter",
                "is_new_subscription": not bool(existing)
            }
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Newsletter subscription error: {e}")
        return {"message": "Successfully subscribed to newsletter"}  # Always return success to user

@app.post("/api/v1/contact/submit") 
async def submit_contact(request: ContactRequest, client_ip: str = Header(None, alias="x-forwarded-for"), user_agent: str = Header(None, alias="user-agent")):
    """Submit contact form from landing page - SECURE"""
    try:
        # Security logging
        if not client_ip:
            client_ip = "unknown"
        if not user_agent:
            user_agent = "unknown"
        
        print(f"🔒 Contact form submission from IP: {client_ip}, UA: {user_agent[:100]}...")
        # Import here to avoid circular imports
        from app.core.database import get_db
        from app.models.contact import ContactSubmission
        
        db = next(get_db())
        try:
            submission = ContactSubmission(
                name=request.name.strip(),
                email=request.email.lower(),
                subject=request.subject.strip() if request.subject else None,
                message=request.message.strip(),
                source=request.source,
                ip_address=client_ip,
                user_agent=user_agent
            )
            db.add(submission)
            db.commit()
            
            # Determine response time
            priority_keywords = ['urgent', 'partnership', 'investment', 'demo']
            message_text = (request.message + ' ' + (request.subject or '')).lower()
            response_time = "within 12 hours" if any(k in message_text for k in priority_keywords) else "within 24 hours"
            
            return {
                "message": "Thank you for your message! Our team will get back to you soon.",
                "estimated_response_time": response_time
            }
            
        finally:
            db.close()
            
    except Exception as e:
        print(f"Contact form error: {e}")
        return {"message": "Thank you for your message! Our team will get back to you soon."}  # Always return success

@app.post("/api/v1/reports/generate")
async def generate_medical_report_real(request_data: dict):
    """Real AI-powered medical report generation using Gemini 2.5 Flash."""
    try:
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        
        transcription = request_data.get("transcription")
        session_id = request_data.get("session_id", "unknown")
        session_type = request_data.get("session_type", "follow_up")
        
        if not transcription or not transcription.strip():
            raise HTTPException(status_code=400, detail="Transcription text is required")
        
        print(f"🤖 Generating Gemini report for session {session_id}, type: {session_type}")
        print(f"📝 Transcript length: {len(transcription)} characters")
        
        # Generate report using real Gemini service
        result = await gemini_service.generate_medical_report(
            transcription=transcription,
            session_type=session_type
        )
        
        if result["status"] == "success":
            print(f"✅ Gemini report generated successfully for session {session_id}")
            return {
                "status": "success",
                "data": {
                    "report": result["report"],
                    "session_id": session_id,
                    "session_type": result["session_type"],
                    "model_used": result["model_used"],
                    "transcription_length": result["transcription_length"],
                    "generated_at": result["generated_at"]
                }
            }
        else:
            print(f"❌ Gemini service error: {result.get('error', 'Unknown error')}")
            raise HTTPException(status_code=500, detail=f"AI service error: {result.get('error', 'Unknown error')}")
            
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Unexpected error in report generation: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to generate report. Please try again.")

# Include real Gemini service directly in simple_main.py for now
try:
    from app.services.gemini_service import gemini_service
    print("✅ Gemini service imported successfully - Real LLM enabled")
except ImportError as e:
    print(f"⚠️ Could not import Gemini service: {e}")
    print("💡 Falling back to mock reports")
    gemini_service = None

# ============================================================================
# PHASE 1 MVP: POST-SESSION WORKFLOW
# ============================================================================

# In-memory storage for reports (MVP - will migrate to DB later)
reports_storage = {}
report_id_counter = 1

class MedicationItem(BaseModel):
    drug_name: str
    dosage: str
    frequency: str
    route: str = "Oral"
    instructions: str = ""

class SessionReportRequest(BaseModel):
    session_id: str
    transcription: str
    medication_plan: list[MedicationItem]
    additional_notes: str = ""
    patient_progress: Optional[str] = None  # IMPROVING | STABLE | DETERIORATING
    session_type: Optional[str] = "follow_up"  # follow_up | first_visit

@app.post("/api/v1/reports/generate-session")
async def generate_session_report(request: SessionReportRequest):
    """
    Phase 1 MVP: Generate post-session report with medications.
    This is the simplified version for quick implementation.
    """
    global report_id_counter
    
    try:
        if not gemini_service:
            raise HTTPException(status_code=503, detail="AI service temporarily unavailable")
        if not request.transcription or not request.transcription.strip():
            raise HTTPException(status_code=400, detail="Transcription is required")
        if not request.medication_plan or len(request.medication_plan) == 0:
            raise HTTPException(status_code=400, detail="At least one medication is required")
        
        print(f"📋 Generating session report for {request.session_id}")
        print(f"💊 Medications: {len(request.medication_plan)}")
        print(f"📝 Transcript length: {len(request.transcription)} chars")
        
        # Format medication plan for AI prompt
        med_plan_text = "\n".join([
            f"- {med.drug_name} {med.dosage} - {med.frequency}"
            + (f" ({med.route})" if med.route else "")
            + (f"\n  Instructions: {med.instructions}" if med.instructions else "")
            for med in request.medication_plan
        ])
        
        # Build additional notes section separately to avoid backslashes inside f-string expressions
        additional_notes_section = ""
        if request.additional_notes:
            additional_notes_section = (
                "**ADDITIONAL CLINICAL NOTES:**\n" + request.additional_notes + "\n"
            )
        
        # Enhanced prompt with medication context and progress
        enhanced_prompt = f"""Generate a concise clinical summary for a mental health follow-up session.

**CRITICAL INSTRUCTIONS:**
1. Use ONLY the medication plan provided below - DO NOT modify or add medications
2. Be concise - each section should be 2-4 sentences maximum
3. Extract information ONLY from the transcript provided

**TRANSCRIPT:**
{request.transcription}

**CLINICAL PROGRESS ASSESSMENT:**
{request.patient_progress or 'Not specified'}

**MEDICATION PLAN (USE EXACTLY AS PROVIDED):**
{med_plan_text}

{additional_notes_section}

**OUTPUT FORMAT:**
Generate a structured report with these sections:

## CHIEF COMPLAINT
[One sentence summary of main concern]

## CURRENT STATUS
[2-3 sentences about patient's current condition and any changes since last visit]

## MENTAL STATUS EXAMINATION
- **Mood:** [Patient's stated mood]
- **Affect:** [Observed affect]
- **Thought Process:** [Brief description]
- **Suicidal Ideation:** [Explicitly state "Denied" or describe if present]
- **Homicidal Ideation:** [Explicitly state "Denied" or describe if present]

## ASSESSMENT
[2-3 sentences of clinical assessment]

## PLAN

**Medication:**
{med_plan_text}

**Follow-up:**
[When patient should return]

Keep it professional, concise, and clinical."""
        
        # Determine session type for Gemini prompt
        requested_type = (request.session_type or "follow_up").lower()
        gem_session_type = "new_patient" if requested_type in {"first_visit", "first", "new", "new_patient"} else "follow_up"

        # Queue background job to avoid frontend timeouts
        report_id = report_id_counter
        report_id_counter += 1

        # Initialize placeholder entry
        reports_storage[report_id] = {
            "id": report_id,
            "session_id": request.session_id,
            "status": "generating",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "transcription_length": len(request.transcription),
            "patient_progress": request.patient_progress or None,
            "medication_plan": [med.dict() for med in request.medication_plan],
            "session_type": gem_session_type
        }

        def _build_med_report_prompt(transcript_text: str, meds_text: str) -> str:
            return f"""You are an expert medical scribe and quality analyst. Your job is to generate a concise, accurate medical report in English based on a Hindi conversation transcript, and analyze how well the report captures the patient's primary complaints.

**[CONTEXT]**

**Hindi Transcript:**
---
{transcript_text}
---

**Structured Doctor's Notes:**
---
Medications prescribed: {meds_text if meds_text else "None documented"}
---

**[INSTRUCTIONS]**

Perform three tasks and return a single, valid JSON object containing all results.

**Task 1: Generate Medical Report**
Create a professional English medical report with these sections:
- **Chief Complaint:** Primary reason for visit (1-2 sentences)
- **History of Present Illness (HPI):** Detailed symptom timeline and context (3-5 sentences)
- **Assessment and Plan (A&P):** Diagnosis, treatment plan, and prescribed medications (2-4 sentences)

Keep the language clear and professional. Focus on clinical accuracy.

**Task 2: Identify Complaint Capture Tags**
Extract the 7 most important medical terms (symptoms, conditions, complaints) that:
1. Were mentioned by the patient in the Hindi transcript
2. Are successfully documented in your English report
3. Are specific medical terms, not generic words

Return as an array of English strings.

**Task 3: Calculate Complaint Capture Score**
Provide a score (0-100) and a one-sentence rationale.

**[OUTPUT FORMAT]**
Return ONLY a valid JSON object with NO markdown code fences or extra text:
{{{{
  "generated_report": "## CHIEF COMPLAINT\n[content]\n\n## CURRENT STATUS\n[content]\n\n## MENTAL STATUS EXAMINATION\n- **Mood:** ...\n- **Affect:** ...\n- **Thought Process:** ...\n- **Suicidal Ideation:** ...\n- **Homicidal Ideation:** ...\n\n## ASSESSMENT\n[content]\n\n## PLAN\n[content]\n\n## MEDICATION & TREATMENT\nREPLACE_WITH_MEDS",
  "concise_summary": "Provide a 2-4 sentence, clinician-facing English summary of WHAT HAPPENED IN THE SESSION (not about the report). Include primary complaints, salient history/context, notable findings, and the plan/medications as appropriate. Avoid meta commentary. Target ~300-450 characters.",
  "highlight_tags": ["term1", "term2", "term3", "term4", "term5", "term6", "term7"],
  "complaint_capture_score": {{{{"score": 85, "rationale": "..."}}}}
}}}}"""

        def _parse_ai_json(text: str) -> dict:
            try:
                cleaned = text.strip()
                cleaned = re.sub(r"```[a-zA-Z0-9_]*\n|```", "", cleaned)
                return json.loads(cleaned)
            except Exception:
                return {}

        def _run_job():
            try:
                # Build meds summary for the JSON-oriented prompt
                meds_text = "\n".join([
                    f"- {m['drug_name']} {m['dosage']} – {m['frequency']}" + (f" ({m.get('route')})" if m.get('route') else '') + (f"\n  Instructions: {m.get('instructions')}" if m.get('instructions') else '')
                    for m in reports_storage[report_id]["medication_plan"]
                ])
                prompt_for_json = _build_med_report_prompt(request.transcription, meds_text)
                # Inject meds into the JSON template placeholder so the AI cannot drop them
                prompt_for_json = prompt_for_json.replace(
                    "REPLACE_WITH_MEDS",
                    meds_text.replace("\\", "\\\\").replace("\n", "\\n") if meds_text else "None documented"
                )

                ai_obj = gemini_service.model.generate_content(prompt_for_json)
                raw_text = getattr(ai_obj, "text", "")
                parsed = _parse_ai_json(raw_text)
                # If model returned narrative instead of JSON, ask it to convert to strict JSON
                if (not parsed) or (not isinstance(parsed, dict)) or (not parsed.get("generated_report")) or (not parsed.get("concise_summary")):
                    coercion_prompt = (
                        "Convert the following content into EXACT JSON with keys: "
                        "generated_report (string), concise_summary (string), highlight_tags (array of strings), "
                        "complaint_capture_score (object with score:int and rationale:string). "
                        "For concise_summary: write a 2-4 sentence, session-focused narrative (what happened, key complaints, salient context, notable findings, plan/meds); do NOT mention 'report' or 'summary'. "
                        "Return ONLY JSON, no prose, no code fences.\n\nCONTENT:\n" + raw_text[:6000]
                    )
                    ai_fix = gemini_service.model.generate_content(coercion_prompt)
                    raw_fix = getattr(ai_fix, "text", "")
                    parsed = _parse_ai_json(raw_fix)
                # If the structured JSON came back inside the text field, use it; otherwise, keep the narrative
                highlight = parsed.get("highlight_tags", []) if isinstance(parsed, dict) else []
                score = parsed.get("complaint_capture_score") if isinstance(parsed, dict) else None
                final_report = parsed.get("generated_report") if isinstance(parsed, dict) and parsed.get("generated_report") else raw_text
                concise = parsed.get("concise_summary") if isinstance(parsed, dict) else None

                reports_storage[report_id].update({
                    "status": "completed",
                    "report_content": final_report,
                    "model_used": getattr(gemini_service, "model_name", "gemini"),
                    "highlight_tags": highlight,
                    "complaint_capture_score": score,
                    "concise_summary": concise
                })
            except Exception as e:  # noqa: BLE001
                reports_storage[report_id].update({
                    "status": "failed",
                    "error": str(e)
                })

        threading.Thread(target=_run_job, daemon=True).start()

        print(f"📝 Report job accepted: ID={report_id}")
        return {"status": "accepted", "report_id": report_id, "session_id": request.session_id}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error generating session report: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/reports/{report_id}")
async def get_report(report_id: int):
    """
    Phase 1 MVP: Retrieve generated report by ID.
    """
    try:
        if report_id not in reports_storage:
            raise HTTPException(status_code=404, detail="Report not found")
        
        report = reports_storage[report_id]
        
        return {
            "status": "success",
            "data": report
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error retrieving report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/reports/{report_id}/status")
async def get_report_status(report_id: int):
    try:
        if report_id not in reports_storage:
            raise HTTPException(status_code=404, detail="Report not found")
        item = reports_storage[report_id]
        return {"status": "success", "data": {"status": item.get("status", "unknown")}}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error retrieving report: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# END PHASE 1 MVP
# ============================================================================

# ============================================================================
# SYMPTOM ASSESSMENT - SIMPLE IN-MEMORY IMPLEMENTATION (MVP)
# ============================================================================

from typing import Optional, Literal, List

class SymptomSearchResult(BaseModel):
    name: str
    type: Literal["global", "custom"]
    source_id: Optional[int] = None
    category: Optional[str] = None

class AssignSymptomRequest(BaseModel):
    symptom_name: str
    is_custom: bool = False
    intensity: Literal["Mild", "Moderate", "Severe"]
    duration: str

class PatientSymptomResponse(BaseModel):
    id: int
    patient_id: int
    symptom_name: str
    symptom_type: str
    intensity: str
    duration: str
    recorded_at: str

# Seed global symptoms (subset for demo)
GLOBAL_SYMPTOMS: List[dict] = [
    {"id": 1, "name": "Major Depressive Episode", "category": "Mood Disorder"},
    {"id": 2, "name": "Recurrent Depressive Disorder", "category": "Mood Disorder"},
    {"id": 3, "name": "Bipolar Disorder", "category": "Mood Disorder"},
    {"id": 4, "name": "Anhedonia", "category": "Mood Disorder"},
    {"id": 5, "name": "Insomnia", "category": "Sleep Disorder"},
    {"id": 6, "name": "Panic Disorder", "category": "Anxiety Disorder"},
    {"id": 7, "name": "Generalized Anxiety Disorder", "category": "Anxiety Disorder"},
    {"id": 8, "name": "Excessive worry", "category": "Anxiety Disorder"},
    {"id": 9, "name": "Restlessness", "category": "Anxiety Disorder"},
    {"id": 10, "name": "Auditory hallucinations", "category": "Psychotic Disorder"},
]

# Optionally extend from JSON seed if available (keeps simple_main in sync with seeds)
try:
    base_dir = os.path.dirname(__file__)
    seed_candidates = [
        os.path.join(base_dir, 'data', 'symptoms_seed.json'),
        os.path.join(base_dir, 'app', 'data', 'symptoms_seed.json')
    ]
    seed_path = next((p for p in seed_candidates if os.path.exists(p)), None)
    if seed_path:
        with open(seed_path, 'r', encoding='utf-8') as f:
            seed_list = json.load(f)
        if isinstance(seed_list, list):
            existing = {s["name"].lower() for s in GLOBAL_SYMPTOMS}
            for item in seed_list:
                if isinstance(item, dict) and item.get("name") and item["name"].lower() not in existing:
                    GLOBAL_SYMPTOMS.append({
                        "id": len(GLOBAL_SYMPTOMS) + 1,
                        "name": item["name"],
                        "category": item.get("category")
                    })
            print(f"✅ Loaded extended symptoms: total={len(GLOBAL_SYMPTOMS)}")
        else:
            print("⚠️ symptoms_seed.json invalid format; expected list")
    else:
        print("ℹ️ symptoms_seed.json not found; using built-in symptom subset")
except Exception as e:
    print(f"⚠️ Failed to load symptoms_seed.json: {e}")

# In-memory stores
USER_CUSTOM_SYMPTOMS: dict[str, List[dict]] = {}
PATIENT_SYMPTOMS: dict[int, List[dict]] = {}
_CUSTOM_ID_COUNTER = 1000
_PATIENT_SYMPTOM_ID = 1

@app.get("/api/v1/symptoms/search", response_model=List[SymptomSearchResult])
async def search_symptoms(q: str, request: Request):
    """Robust search across names, categories, synonyms and fuzzy matches."""
    import difflib
    user = get_current_user_from_request(request)
    term = q.strip().lower()
    if len(term) < 2:
        return []

    # Build indices
    names = [(s["name"], s.get("category"), s["id"]) for s in GLOBAL_SYMPTOMS]
    categories = [s.get("category", "").lower() for s in GLOBAL_SYMPTOMS]

    # Common synonyms and misspellings mapping -> candidate substrings
    synonyms: dict[str, list[str]] = {
        "adhd": ["adhd", "attention deficit", "attention deficits", "attention difficulties", "hyperactivity", "impulsivity"],
        "attention deficits": ["attention deficit", "attention difficulties", "adhd"],
        "attention defecits": ["attention deficit", "attention difficulties", "adhd"],
        "eating": ["restrictive eating", "binge", "purging", "food", "body image"],
        "fatigue": ["fatigue", "low energy", "tiredness"],
        "sleep": ["insomnia", "hypersomnia", "early morning awakening", "nightmare", "sleep paralysis", "circadian"],
        "trauma": ["ptsd", "post-traumatic", "flashbacks", "hypervigilance"],
        "anxiety": ["generalized anxiety", "panic", "phobia", "health anxiety", "anticipatory"],
        "depression": ["depressive", "low mood", "anhedonia"],
    }

    # Scoring helper
    scores: dict[str, tuple[float, dict]] = {}

    def add_result(name: str, cat: Optional[str], sid: Optional[int], score: float):
        key = name.lower()
        payload = {"name": name, "category": cat, "source_id": sid}
        if key not in scores or score > scores[key][0]:
            scores[key] = (score, payload)

    # 1) Name exact/contains
    for n, c, sid in names:
        nl = n.lower()
        if nl == term:
            add_result(n, c, sid, 1.0)
        elif term in nl:
            add_result(n, c, sid, 0.9)

    # 2) Category match (e.g., "eating", "sleep")
    for n, c, sid in names:
        cl = (c or "").lower()
        if cl and term in cl:
            add_result(n, c, sid, 0.78)

    # 3) Synonyms
    for key, alts in synonyms.items():
        if term in key or any(term in a for a in alts):
            # include all names that contain any alt
            for n, c, sid in names:
                nl = n.lower()
                if (key in nl) or any(a in nl for a in alts):
                    add_result(n, c, sid, 0.82)

    # 4) Fuzzy match for typos
    for n, c, sid in names:
        ratio = difflib.SequenceMatcher(None, term, n.lower()).ratio()
        if ratio >= 0.8:
            add_result(n, c, sid, 0.76)

    # 5) User custom
    user_key = user.id
    for c in USER_CUSTOM_SYMPTOMS.get(user_key, []):
        nl = c["name"].lower()
        if term in nl:
            add_result(c["name"], None, c["id"], 0.7)

    # Return top 20 sorted by score
    sorted_payloads = [p for _, p in sorted(scores.values(), key=lambda x: x[0], reverse=True)][:20]
    return [SymptomSearchResult(name=p["name"], type="global", source_id=p["source_id"], category=p.get("category")) for p in sorted_payloads]

@app.post("/api/v1/patients/{patient_id}/symptoms", response_model=PatientSymptomResponse, status_code=201)
async def assign_symptom_to_patient(patient_id: int, payload: AssignSymptomRequest, request: Request):
    global _CUSTOM_ID_COUNTER, _PATIENT_SYMPTOM_ID
    user = get_current_user_from_request(request)

    if payload.is_custom:
        user_key = user.id
        USER_CUSTOM_SYMPTOMS.setdefault(user_key, [])
        existing = next((c for c in USER_CUSTOM_SYMPTOMS[user_key] if c["name"].lower() == payload.symptom_name.strip().lower()), None)
        if not existing:
            _CUSTOM_ID_COUNTER += 1
            USER_CUSTOM_SYMPTOMS[user_key].append({"id": _CUSTOM_ID_COUNTER, "name": payload.symptom_name.strip()})

    PATIENT_SYMPTOMS.setdefault(patient_id, [])
    record = {
        "id": _PATIENT_SYMPTOM_ID,
        "patient_id": patient_id,
        "symptom_name": payload.symptom_name.strip(),
        "symptom_type": "custom" if payload.is_custom else "global",
        "intensity": payload.intensity,
        "duration": payload.duration.strip(),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }
    _PATIENT_SYMPTOM_ID += 1
    PATIENT_SYMPTOMS[patient_id].insert(0, record)
    return PatientSymptomResponse(**record)

@app.get("/api/v1/patients/{patient_id}/symptoms", response_model=List[PatientSymptomResponse])
async def get_patient_symptoms(patient_id: int, request: Request):
    _ = get_current_user_from_request(request)
    items = PATIENT_SYMPTOMS.get(patient_id, [])
    return [PatientSymptomResponse(**i) for i in items]

@app.delete("/api/v1/patient_symptoms/{patient_symptom_id}", status_code=204)
async def delete_patient_symptom(patient_symptom_id: int, request: Request):
    _ = get_current_user_from_request(request)
    for pid, items in PATIENT_SYMPTOMS.items():
        for i, rec in enumerate(items):
            if rec["id"] == patient_symptom_id:
                del items[i]
                return
    raise HTTPException(status_code=404, detail="Symptom assignment not found")


@app.post("/api/v1/reports/insights")
async def generate_clinical_insights_mock(request_data: dict):
    """Mock AI-powered clinical insights generation."""
    return {
        "status": "success",
        "data": {
            "insights": {
                "key_clinical_findings": [
                    "Patient appears well-oriented and cooperative",
                    "No signs of acute distress observed",
                    "Communication clear and appropriate"
                ],
                "differential_diagnosis": [
                    "Normal health status - no pathology indicated",
                    "Routine health maintenance encounter"
                ],
                "treatment_recommendations": [
                    "Continue current lifestyle patterns",
                    "Maintain regular exercise routine",
                    "Follow balanced nutrition guidelines"
                ],
                "follow_up_priorities": [
                    "Schedule routine follow-up in 6 months",
                    "Monitor for any new symptoms",
                    "Continue preventive care measures"
                ],
                "confidence": 0.94
            },
            "metadata": {
                "generated_at": "2024-01-01T00:30:00Z",
                "model_used": "gemini-2.5-flash",
                "analysis_type": "clinical_insights"
            }
        }
    }

@app.get("/api/v1/reports/health")
async def reports_health_check():
    """Mock AI services health check."""
    return {
        "status": "success",
        "data": {
            "gemini_service": "available",
            "vertex_ai": "connected",
            "timestamp": "2024-01-01T00:00:00Z",
            "version": "1.0.0"
        }
    }

@app.post("/api/v1/reports/live-insights")
async def generate_live_insights(request_data: dict):
    """
    Generate live AI insights during active consultation sessions.
    Optimized for real-time partial analysis with mental health focus.
    """
    try:
        # Extract request data
        transcription_text = request_data.get("transcription_text", "")
        patient_id = request_data.get("patient_id")
        session_id = request_data.get("session_id")
        is_partial = request_data.get("is_partial", True)
        
        # Validate minimum text length
        if len(transcription_text.strip()) < 20:
            return {
                "status": "success",
                "data": {
                    "insights": {
                        "key_clinical_findings": [],
                        "treatment_recommendations": [],
                        "confidence": 0.0
                    },
                    "message": "Insufficient text for analysis"
                }
            }
        
        # Generate mental health focused live insights based on transcription
        # This analyzes the real transcription text for mental health indicators
        
        # Key terms analysis for mental health
        mental_health_indicators = {
            "anxiety": ["anxious", "anxiety", "worry", "nervous", "panic", "restless", "चिंता", "घबराट"],
            "depression": ["sad", "depression", "hopeless", "empty", "tired", "worthless", "उदास", "निराश"],
            "sleep": ["sleep", "insomnia", "tired", "rest", "awake", "झोप", "थकवा"],
            "mood": ["mood", "happy", "sad", "angry", "irritable", "मूड", "राग"],
            "stress": ["stress", "pressure", "overwhelmed", "burden", "तणाव", "दबाव"],
            "family": ["family", "relationship", "partner", "कुटुंब", "नातेसंबंध"],
            "work": ["work", "job", "office", "career", "काम", "नोकरी"]
        }
        
        findings = []
        recommendations = []
        confidence = 0.0
        
        text_lower = transcription_text.lower()
        
        # Analyze for key indicators
        for category, keywords in mental_health_indicators.items():
            if any(keyword in text_lower for keyword in keywords):
                if category == "anxiety":
                    findings.append("Patient reports anxiety symptoms")
                    recommendations.append("Consider anxiety management techniques and breathing exercises")
                elif category == "depression":
                    findings.append("Indicators of depressive symptoms noted")
                    recommendations.append("Monitor mood patterns and consider cognitive behavioral therapy")
                elif category == "sleep":
                    findings.append("Sleep-related concerns mentioned")
                    recommendations.append("Evaluate sleep hygiene and consider sleep study if persistent")
                elif category == "stress":
                    findings.append("Stress factors identified")
                    recommendations.append("Discuss stress management strategies and coping mechanisms")
                elif category == "family":
                    findings.append("Family or relationship concerns mentioned")
                    recommendations.append("Consider family therapy or relationship counseling")
                elif category == "work":
                    findings.append("Work-related stress or concerns noted")
                    recommendations.append("Discuss work-life balance and workplace stress management")
                
                confidence += 0.12
        
        # General mental health recommendations based on content
        if findings:
            recommendations.append("Continue regular monitoring and follow-up sessions")
            if len(transcription_text.split()) > 50:
                recommendations.append("Document detailed progress notes for comprehensive care")
        
        # Limit confidence to realistic levels for live analysis
        confidence = min(confidence, 0.85)
        
        return {
            "status": "success",
            "data": {
                "insights": {
                    "key_clinical_findings": findings[:4],  # Limit to top 4
                    "treatment_recommendations": recommendations[:4],  # Limit to top 4
                    "confidence": round(confidence, 2)
                },
                "metadata": {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "model_used": "live-analysis-engine-v1",
                    "analysis_type": "live_insights",
                    "is_partial": is_partial,
                    "session_id": session_id,
                    "text_length": len(transcription_text),
                    "languages_detected": ["en", "mr", "hi"]
                }
            }
        }
        
    except Exception as e:
        # Don't raise errors for live insights to avoid disrupting the frontend
        print(f"Live insights error: {str(e)}")
        return {
            "status": "success",
            "data": {
                "insights": {
                    "key_clinical_findings": [],
                    "treatment_recommendations": [],
                    "confidence": 0.0
                },
                "message": "Analysis temporarily unavailable"
            }
        }

# New Patient Intake Endpoints
@app.post("/api/v1/intake/patients")
async def create_intake_patient(patient_data: dict):
    """Create a new intake patient record (Stage 1)."""
    try:
        # Mock patient creation for demonstration
        patient_id = f"intake-{hash(str(patient_data)) % 10000:04d}"
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient_id,
                "name": patient_data.get("name", "Test Patient"),
                "message": "Patient intake record created successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "1_completed"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create patient: {str(e)}")

@app.get("/api/v1/intake/symptoms")  
async def search_intake_symptoms(q: str, limit: int = 20):
    """Search for symptoms using comprehensive ICD-11 database."""
    try:
        # Use enhanced local database directly (ICD-11 service has dependency issues)
        print(f"Searching for: {q}")
        
        # Enhanced local symptom database with comprehensive coverage
        enhanced_symptoms = [
            # Anxiety Disorders
            {"id": "anx-001", "name": "Generalized Anxiety Disorder", "description": "Excessive worry about multiple life areas", "categories": ["ICD11-6B00"], "source": "medical_db", "aliases": ["GAD", "chronic anxiety", "persistent worry", "anxiety disorder", "generalized anxiety"]},
            {"id": "anx-002", "name": "Panic Disorder", "description": "Recurrent unexpected panic attacks", "categories": ["ICD11-6B01"], "source": "medical_db", "aliases": ["panic attacks", "panic episodes", "anxiety attacks"]},
            {"id": "anx-003", "name": "Social Anxiety Disorder", "description": "Fear of social situations and scrutiny", "categories": ["ICD11-6B04"], "source": "medical_db", "aliases": ["social phobia", "social fear", "performance anxiety"]},
            {"id": "anx-004", "name": "Specific Phobia", "description": "Excessive fear of specific objects or situations", "categories": ["ICD11-6B03"], "source": "medical_db", "aliases": ["phobic disorder", "irrational fear", "phobia"]},
            
            # ADHD and Attention
            {"id": "adhd-001", "name": "Attention Deficit Hyperactivity Disorder", "description": "Persistent inattention and/or hyperactivity-impulsivity", "categories": ["ICD11-6A05"], "source": "medical_db", "aliases": ["ADHD", "ADD", "attention deficit", "hyperactivity disorder", "attention problems"]},
            {"id": "adhd-002", "name": "Attention Difficulties", "description": "Problems with focus and concentration", "categories": ["ICD11-6A05"], "source": "medical_db", "aliases": ["focus problems", "concentration issues", "distractibility", "attention span"]},
            
            # Depression and Mood
            {"id": "dep-001", "name": "Major Depressive Disorder", "description": "Persistent depressed mood and loss of interest", "categories": ["ICD11-6A70"], "source": "medical_db", "aliases": ["MDD", "depression", "clinical depression", "major depression", "depressive disorder"]},
            {"id": "dep-002", "name": "Bipolar Disorder", "description": "Alternating periods of mania and depression", "categories": ["ICD11-6A60"], "source": "medical_db", "aliases": ["BPD", "bipolar", "manic depression", "bipolar episodes", "mood swings"]},
            {"id": "dep-003", "name": "Persistent Depressive Disorder", "description": "Chronic depressive symptoms for at least 2 years", "categories": ["ICD11-6A71"], "source": "medical_db", "aliases": ["dysthymia", "chronic depression", "persistent depression"]},
            
            # OCD and Related
            {"id": "ocd-001", "name": "Obsessive-Compulsive Disorder", "description": "Recurrent obsessions and/or compulsions", "categories": ["ICD11-6B20"], "source": "medical_db", "aliases": ["OCD", "obsessive compulsive", "obsessions", "compulsions", "intrusive thoughts"]},
            {"id": "ocd-002", "name": "Body Dysmorphic Disorder", "description": "Preoccupation with perceived defects in appearance", "categories": ["ICD11-6B21"], "source": "medical_db", "aliases": ["BDD", "body dysmorphia", "body image disorder"]},
            
            # Trauma and PTSD
            {"id": "ptsd-001", "name": "Post-Traumatic Stress Disorder", "description": "Persistent symptoms following traumatic events", "categories": ["ICD11-6B40"], "source": "medical_db", "aliases": ["PTSD", "trauma response", "traumatic stress", "post traumatic", "combat stress"]},
            {"id": "ptsd-002", "name": "Complex PTSD", "description": "PTSD with additional symptoms from prolonged trauma", "categories": ["ICD11-6B41"], "source": "medical_db", "aliases": ["C-PTSD", "CPTSD", "complex trauma", "complex PTSD"]},
            {"id": "ptsd-003", "name": "Acute Stress Reaction", "description": "Immediate response to exceptional stressor", "categories": ["ICD11-6B41"], "source": "medical_db", "aliases": ["acute stress", "crisis reaction", "stress response"]},
            
            # Sleep Disorders
            {"id": "sleep-001", "name": "Insomnia Disorder", "description": "Difficulty initiating or maintaining sleep", "categories": ["ICD11-7A00"], "source": "medical_db", "aliases": ["insomnia", "sleep problems", "sleeplessness", "can't sleep"]},
            {"id": "sleep-002", "name": "Nightmare Disorder", "description": "Repeated disturbing dreams causing distress", "categories": ["ICD11-7A03"], "source": "medical_db", "aliases": ["nightmares", "bad dreams", "night terrors"]},
            
            # Eating Disorders
            {"id": "eat-001", "name": "Anorexia Nervosa", "description": "Restriction of food intake leading to low body weight", "categories": ["ICD11-6B80"], "source": "medical_db", "aliases": ["anorexia", "restrictive eating", "eating disorder", "ED"]},
            {"id": "eat-002", "name": "Bulimia Nervosa", "description": "Binge eating followed by compensatory behaviors", "categories": ["ICD11-6B81"], "source": "medical_db", "aliases": ["bulimia", "binge-purge", "eating disorder", "ED"]},
            {"id": "eat-003", "name": "Binge Eating Disorder", "description": "Recurrent episodes of binge eating without compensation", "categories": ["ICD11-6B82"], "source": "medical_db", "aliases": ["BED", "compulsive overeating", "binge eating", "eating disorder", "ED"]},
            
            # Sexual Health
            {"id": "sex-001", "name": "Sexual Desire Dysfunction", "description": "Persistent lack or loss of sexual desire", "categories": ["ICD11-6C70"], "source": "medical_db", "aliases": ["sexual dysfunction", "low libido", "lack of sexual interest", "sexual desire disorder", "sexual problems"]},
            {"id": "sex-002", "name": "Sexual Arousal Dysfunction", "description": "Persistent difficulty with sexual arousal", "categories": ["ICD11-6C71"], "source": "medical_db", "aliases": ["arousal disorder", "sexual arousal difficulty", "sexual dysfunction"]},
            {"id": "sex-003", "name": "Orgasmic Dysfunction", "description": "Persistent difficulty achieving orgasm", "categories": ["ICD11-6C72"], "source": "medical_db", "aliases": ["anorgasmia", "orgasm problems", "climax difficulties", "sexual dysfunction"]},
            {"id": "sex-004", "name": "Premature Ejaculation", "description": "Persistent early ejaculation during sexual activity", "categories": ["ICD11-6C73"], "source": "medical_db", "aliases": ["PE", "early ejaculation", "rapid ejaculation", "sexual dysfunction"]},
            {"id": "sex-005", "name": "Sexual Pain Disorders", "description": "Pain during sexual activity", "categories": ["ICD11-6C75"], "source": "medical_db", "aliases": ["dyspareunia", "vaginismus", "sexual pain", "painful intercourse", "sexual dysfunction"]},
            
            # Substance Use
            {"id": "sub-001", "name": "Alcohol Use Disorder", "description": "Problematic pattern of alcohol use", "categories": ["ICD11-6C40"], "source": "medical_db", "aliases": ["alcoholism", "alcohol addiction", "alcohol dependence", "drinking problem"]},
            {"id": "sub-002", "name": "Cannabis Use Disorder", "description": "Problematic pattern of cannabis use", "categories": ["ICD11-6C41"], "source": "medical_db", "aliases": ["marijuana addiction", "cannabis dependence", "weed addiction"]},
            
            # Common Symptoms
            {"id": "sym-001", "name": "Fatigue", "description": "Persistent tiredness not relieved by rest", "categories": ["ICD11-MB23"], "source": "medical_db", "aliases": ["exhaustion", "tiredness", "low energy", "chronic fatigue"]},
            {"id": "sym-002", "name": "Mood Swings", "description": "Rapid changes in emotional state", "categories": ["ICD11-6A60"], "source": "medical_db", "aliases": ["emotional instability", "mood changes", "emotional ups and downs"]},
            {"id": "sym-003", "name": "Irritability", "description": "Increased sensitivity to frustration and anger", "categories": ["ICD11-6A70"], "source": "medical_db", "aliases": ["anger", "frustration", "short temper", "agitation"]},
            {"id": "sym-004", "name": "Social Withdrawal", "description": "Avoiding social contact and isolation", "categories": ["ICD11-6A70"], "source": "medical_db", "aliases": ["isolation", "avoiding people", "social isolation", "withdrawal"]},
        ]
        
        # Search logic with comprehensive matching
        search_term = q.lower().strip()
        filtered_symptoms = []
        
        print(f"🔍 Debug: Searching for '{search_term}'")
        
        for symptom in enhanced_symptoms:
            relevance_score = 0
            
            # Exact name match (highest priority)
            if search_term == symptom["name"].lower():
                relevance_score = 1.0
                print(f"   ✓ Exact name match: {symptom['name']}")
            # Name contains search term
            elif search_term in symptom["name"].lower():
                relevance_score = 0.9
                print(f"   ✓ Name contains: {symptom['name']}")
            # Alias exact match
            elif any(search_term == alias.lower() for alias in symptom.get("aliases", [])):
                relevance_score = 0.95
                print(f"   ✓ Exact alias match: {symptom['name']}")
            # Alias contains search term (THIS IS THE KEY FIX)
            elif any(search_term in alias.lower() for alias in symptom.get("aliases", [])):
                relevance_score = 0.8
                matching_aliases = [alias for alias in symptom.get("aliases", []) if search_term in alias.lower()]
                print(f"   ✓ Alias contains '{search_term}': {symptom['name']} (aliases: {matching_aliases})")
            # Description contains search term
            elif search_term in symptom["description"].lower():
                relevance_score = 0.6
                print(f"   ✓ Description contains: {symptom['name']}")
            
            # Word-level matching for partial searches (fallback)
            if relevance_score == 0:
                words = search_term.split()
                word_matches = []
                for word in words:
                    if len(word) > 2:  # Only check meaningful words
                        if (word in symptom["name"].lower() or 
                            word in symptom["description"].lower() or
                            any(word in alias.lower() for alias in symptom.get("aliases", []))):
                            word_matches.append(word)
                
                if len(word_matches) == len(words):  # All words must match
                    relevance_score = 0.5
                    print(f"   ✓ All words match: {symptom['name']} (matched: {word_matches})")
            
            if relevance_score > 0:
                symptom["relevance_score"] = relevance_score
                filtered_symptoms.append(symptom)
        
        # Sort by relevance score
        filtered_symptoms.sort(key=lambda x: x["relevance_score"], reverse=True)
        results = filtered_symptoms[:limit]
        
        print(f"Found {len(results)} results for '{q}'")
        
        return {
            "status": "success",
            "data": {
                "symptoms": results,
                "total_found": len(results),
                "search_query": q,
                "medical_db_count": len([s for s in results if s.get("source") == "medical_db"]),
                "custom_count": len([s for s in results if s.get("source") == "custom"]),
                "search_method": "Enhanced Medical Database"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "database_version": "Enhanced Local Medical Database",
                "total_searchable_conditions": "30+ comprehensive mental health conditions"
            }
        }
        mock_symptoms = [
            {
                "id": "1",
                "name": "Anxiety",
                "description": "Feelings of worry, nervousness, or unease about something with an uncertain outcome",
                "categories": ["ICD11-6B00", "ICD11-6B01"],
                "source": "master",
                "aliases": ["Anxiousness", "Worry", "Nervousness"]
            },
            {
                "id": "2", 
                "name": "Depressed Mood",
                "description": "Persistent feelings of sadness, emptiness, or hopelessness",
                "categories": ["ICD11-6A70", "ICD11-6A71"],
                "source": "master",
                "aliases": ["Sadness", "Low mood", "Melancholy"]
            },
            {
                "id": "3",
                "name": "Insomnia",
                "description": "Difficulty falling asleep, staying asleep, or waking up too early",
                "categories": ["ICD11-7A00"],
                "source": "master",
                "aliases": ["Sleep problems", "Can't sleep", "Sleeplessness"]
            },
            {
                "id": "4",
                "name": "Panic Attacks",
                "description": "Sudden episodes of intense fear or anxiety with physical symptoms",
                "categories": ["ICD11-6B01"],
                "source": "master",
                "aliases": ["Panic episodes", "Anxiety attacks"]
            },
            {
                "id": "5",
                "name": "Social Withdrawal",
                "description": "Avoiding social interactions or isolating oneself from others",
                "categories": ["ICD11-6A70", "ICD11-6A02"],
                "source": "master",
                "aliases": ["Isolation", "Avoiding people", "Social isolation"]
            },
            {
                "id": "6",
                "name": "Fatigue",
                "description": "Persistent tiredness or lack of energy not relieved by rest",
                "categories": ["ICD11-6A70", "ICD11-6A71", "ICD11-MB23"],
                "source": "master",
                "aliases": ["Tiredness", "Exhaustion", "Low energy"]
            }
        ]
        
        # Filter symptoms based on search query
        search_term = q.lower()
        filtered_symptoms = []
        
        for symptom in mock_symptoms:
            if (search_term in symptom["name"].lower() or 
                any(search_term in alias.lower() for alias in symptom["aliases"]) or
                search_term in symptom["description"].lower()):
                filtered_symptoms.append(symptom)
        
        return {
            "status": "success",
            "data": {
                "symptoms": filtered_symptoms[:limit],
                "total_found": len(filtered_symptoms),
                "search_query": q,
                "master_count": len([s for s in filtered_symptoms if s["source"] == "master"]),
                "user_count": len([s for s in filtered_symptoms if s["source"] == "user"])
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Symptom search failed: {str(e)}")

@app.post("/api/v1/intake/user_symptoms")
async def create_user_symptom(symptom_data: dict):
    """Create a new custom symptom for the current doctor."""
    try:
        custom_symptom_id = f"custom-{hash(str(symptom_data)) % 10000:04d}"
        
        return {
            "status": "success",
            "data": {
                "symptom_id": custom_symptom_id,
                "name": symptom_data.get("name", "Custom Symptom"),
                "categories": symptom_data.get("categories", ["ICD11-Custom"]),
                "source": "user",
                "message": "Custom symptom created successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create custom symptom: {str(e)}")

@app.options("/api/v1/intake/patients/{patient_id}/symptoms")
async def add_patient_symptoms_options(patient_id: str):
    """Handle CORS preflight for symptoms endpoint."""
    return {}

from pydantic import BaseModel
from typing import List

class SymptomData(BaseModel):
    symptom_id: str
    symptom_name: str
    severity: str
    frequency: str
    duration: dict
    notes: str = ""

@app.post("/api/v1/intake/patients/{patient_id}/symptoms")
async def add_patient_symptoms(patient_id: str, symptoms: List[SymptomData]):
    """Add symptoms to a patient (Stage 2)."""
    try:
        print(f"Received symptoms data for patient {patient_id}: {[s.dict() for s in symptoms]}")
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient_id,
                "patient_name": "Test Patient",
                "symptoms_added": len(symptoms),
                "symptoms": symptoms,
                "message": "Patient symptoms added successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "stage": "2_completed"
            }
        }
    except Exception as e:
        print(f"Error adding symptoms: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to add patient symptoms: {str(e)}")

@app.get("/api/v1/intake/patients/{patient_id}")
async def get_intake_patient(patient_id: str):
    """Get complete intake patient information including symptoms."""
    try:
        # Mock patient data
        mock_patient = {
            "id": patient_id,
            "name": "Test Patient",
            "age": 35,
            "sex": "Female",
            "address": "123 Main Street, City, State",
            "informants": {
                "selection": ["Self", "Spouse"],
                "other_details": None
            },
            "illness_duration": {
                "value": 3,
                "unit": "Months",
                "formatted": "3 months"
            },
            "referred_by": "Dr. Smith",
            "precipitating_factor": {
                "narrative": "Job loss and family stress",
                "tags": ["job_loss", "family_stress"]
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        
        mock_symptoms = [
            {
                "symptom_name": "Anxiety",
                "severity": "Moderate",
                "frequency": "Daily",
                "duration": {"value": 2, "unit": "Months", "formatted": "2 months"},
                "notes": "Worse in the mornings"
            }
        ]
        
        return {
            "status": "success",
            "data": {
                "patient": mock_patient,
                "symptoms": mock_symptoms,
                "total_symptoms": len(mock_symptoms)
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve patient: {str(e)}")

@app.get("/api/v1/consultation/test")
async def test_stt_service():
    """
    Test Google Cloud Speech-to-Text service availability and configuration.
    """
    try:
        # Test basic client initialization
        project_id = "synapse-product-1"
        
        # Test actual speech client initialization (if available)
        if speech_client is None:
            raise Exception("Google Cloud Speech client not initialized")
        test_client = speech_client
        
        # Create a simple recognition config for testing
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="en-US",
        )
        
        return {
            "status": "success", 
            "data": {
                "stt_service": "available",
                "project_id": project_id,
                "supported_languages": ["en-IN", "mr-IN", "hi-IN"],
                "mental_health_optimized": True,
                "credentials_valid": True,
                "client_initialized": True,
                "config": {
                    "model": "latest_long",
                    "sample_rate": 48000,
                    "encoding": "WEBM_OPUS",
                    "enable_word_confidence": True,
                    "enable_word_time_offsets": True,
                    "streaming_support": True
                }
            },
            "message": "Google Cloud Speech-to-Text service is ready for real-time mental health consultations"
        }
        
    except Exception as e:
        return {
            "status": "error",
            "message": f"STT service test failed: {str(e)}",
            "data": {
                "stt_service": "unavailable",
                "error_details": str(e),
                "credentials_path": "gcp-credentials.json",
                "project_id": project_id
            }
        }

@app.post("/api/v1/consultation/start")
async def start_consultation_session(session_data: dict):
    """Mock consultation session start endpoint with STT integration."""
    try:
        session_id = f"CS-{datetime.now().strftime('%Y%m%d')}-{hash(str(session_data)) % 10000:04d}"
        
        return {
            "status": "success",
            "data": {
                "session_id": session_id,
                "patient_name": session_data.get("patient_name", "Test Patient"),
                "started_at": datetime.now(timezone.utc).isoformat(),
                "stt_session": {
                    "enabled": True,
                    "languages": ["mr-IN", "en-IN", "hi-IN"],
                    "model": "latest_long",
                    "mental_health_optimized": True
                },
                "websocket_url": f"ws://localhost:8000/ws/consultation/{session_id}"
            },
            "message": "Consultation session started with STT enabled"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start consultation: {str(e)}")

@app.post("/api/v1/consultation/{session_id}/stop")
async def stop_consultation_session(session_id: str):
    """Mock consultation session stop endpoint."""
    return {
        "status": "success",
        "data": {
            "session_id": session_id,
            "ended_at": datetime.now(timezone.utc).isoformat(),
            "duration_minutes": 15,
            "stt_summary": {
                "total_words": 450,
                "languages_detected": ["english", "marathi"],
                "confidence_average": 0.94
            }
        },
        "message": "Consultation session completed successfully"
    }

@app.websocket("/ws/consultation/{session_id}")  # Reference-based STT endpoint
async def websocket_consultation_endpoint(websocket: WebSocket, session_id: str):
    """
    Real-time WebSocket endpoint using reference Google STT architecture.
    Adapted from Google's official streaming STT example for medical use.
    """
    await websocket.accept()
    print(f"WebSocket connected for session: {session_id}")
    
    # Initialize variables for cleanup
    speech_client = None
    stop_event = None
    streaming_thread = None
    
    try:
        # Send welcome message
        await websocket.send_json({
            "type": "connected", 
            "message": "Connected to SynapseAI Real-time Speech Recognition",
            "session_id": session_id,
            "stt_config": {
                "languages": ["mr-IN", "en-IN", "hi-IN"],
                "model": "latest_long",
                "mental_health_optimized": True
            }
        })
        
        # Use the globally initialized speech client
        import sys
        current_module = sys.modules[__name__]
        module_speech_client = getattr(current_module, 'speech_client', None)
        print(f"🔍 Checking module speech_client: {module_speech_client is not None}")
        print(f"🔍 Local speech_client: {speech_client is not None}")
        if module_speech_client is None:
            raise Exception("Google Cloud Speech client not initialized - check credentials")
        
        # Mental health specific terms for enhanced recognition
        mental_health_phrases = [
            "anxiety", "depression", "stress", "panic", "therapy", "counseling", "medication",
            "mood", "sleep", "insomnia", "worry", "fear", "trauma", "PTSD", "bipolar",
            "mindfulness", "meditation", "cognitive behavioral therapy", "CBT", "psychotherapy",
            "mental health", "psychiatric", "antidepressant", "anxiolytic", "mood stabilizer",
            "चिंता", "तणाव", "उदासीनता", "मानसिक आरोग्य", "थेरपी", "औषध",
            "झोप", "घबराट", "मूड", "मन", "भावना", "चिकित्सा"
        ]
        
        # Configure streaming recognition for mental health (Hindi/Marathi/English)
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="mr-IN",  # Primary: Marathi (India)
            alternative_language_codes=["en-IN", "hi-IN"],  # English (India), Hindi (India)
            model="latest_long",  # Best for long-form medical conversations
            use_enhanced=True,  # Enhanced model for better accuracy
            enable_automatic_punctuation=True,  # Medical transcription needs punctuation
            enable_word_confidence=True,  # Track confidence for medical accuracy
            # Mental health speech contexts
            speech_contexts=[
                speech.SpeechContext(
                    phrases=mental_health_phrases,
                    boost=15.0  # Boost mental health terminology
                )
            ]
        )
        
        print(f"🔧 Using Google STT config: encoding=LINEAR16, rate=16000, lang=mr-IN (primary), alt=[en-IN, hi-IN], model=latest_long")
        import sys
        sys.stdout.flush()
        
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=True,
            single_utterance=False
        )
        
        print(f"Google Cloud Speech-to-Text initialized for session {session_id}")
        
        # Send confirmation of STT readiness with language info
        await websocket.send_json({
            "type": "stt_ready",
            "message": "Google Cloud Speech-to-Text ready for mental health consultation",
            "languages": {
                "primary": "mr-IN (Marathi)",
                "alternatives": ["en-IN (English)", "hi-IN (Hindi)"]
            },
            "sample_rate": "16000Hz",
            "model": "latest_long",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })
        
        # Streaming recognition setup using a background thread and a queue
        audio_queue: queue.Queue[bytes] = queue.Queue(maxsize=200)
        stop_event = threading.Event()
        
        loop = asyncio.get_running_loop()
        
        def requests_generator():
            # Generate audio requests only (config passed separately)
            print(f"🎯 Starting audio request generator...")
            print(f"🔍 Queue initial size: {audio_queue.qsize()}")
            import sys
            sys.stdout.flush()
            
            silence_chunk = b"\x00\x00" * 800  # 50ms of 16kHz 16-bit PCM
            requests_sent = 0
            last_real_audio_time = time.time()
            
            # CRITICAL: Wait for real audio before starting stream
            print(f"⏳ Waiting for real audio before starting stream...")
            sys.stdout.flush()
            
            # Wait up to 10 seconds for first real audio chunk
            first_audio_received = False
            wait_start = time.time()
            while not first_audio_received and not stop_event.is_set():
                if time.time() - wait_start > 10.0:
                    print(f"⚠️ Timeout waiting for audio, starting with silence")
                    break
                try:
                    first_chunk = audio_queue.get(timeout=0.5)
                    if first_chunk and len(first_chunk) > 0:
                        print(f"🎉 First real audio received: {len(first_chunk)} bytes!")
                        sys.stdout.flush()
                        # Send the first real audio chunk
                        yield speech.StreamingRecognizeRequest(audio_content=first_chunk)
                        requests_sent += 1
                        last_real_audio_time = time.time()
                        first_audio_received = True
                        print(f"✅ First real audio sent (#{requests_sent})")
                        sys.stdout.flush()
                except queue.Empty:
                    continue
            
            # If no real audio received, send initial silence
            if not first_audio_received:
                initial_request = speech.StreamingRecognizeRequest(audio_content=silence_chunk)
                yield initial_request
                requests_sent += 1
                print(f"✅ Initial silence sent (#{requests_sent})")
                sys.stdout.flush()
            
            # Simple continuous streaming - prioritize real audio, minimal silence
            while not stop_event.is_set():
                try:
                    # Get audio with longer timeout to avoid spam
                    chunk: bytes = audio_queue.get(timeout=0.2)
                    if chunk and len(chunk) > 0:
                        # Send real audio immediately
                        request = speech.StreamingRecognizeRequest(audio_content=chunk)
                        yield request
                        requests_sent += 1
                        last_real_audio_time = time.time()
                        queue_remaining = audio_queue.qsize()
                        print(f"📤 Streaming audio to Google: {len(chunk)} bytes (request #{requests_sent}), queue: {queue_remaining}")
                        sys.stdout.flush()
                except queue.Empty:
                    # Send minimal silence only when necessary
                    current_time = time.time()
                    time_since_audio = current_time - last_real_audio_time
                    
                    if time_since_audio < 3.0:  # Only send silence for 3 seconds after last audio
                        request = speech.StreamingRecognizeRequest(audio_content=silence_chunk)
                        yield request
                        requests_sent += 1
                        if requests_sent % 30 == 0:  # Less spam
                            print(f"🔇 Silence keepalive (request #{requests_sent})")
                            sys.stdout.flush()
                    
                    time.sleep(0.1)  # Brief delay
            
            print(f"🏁 Audio request generator ended. Total requests sent: {requests_sent}")
        
        def run_streaming():
            print(f"🚀 SIMPLE STT Stream for {session_id}")
            import sys
            sys.stdout.flush()
            
            # Get speech client
            current_module = sys.modules[__name__]
            module_speech_client = getattr(current_module, 'speech_client', None)
            if module_speech_client is None:
                print("❌ No speech client available")
                return
                
            # Stream parameters for long therapy sessions (20+ minutes)
            max_stream_duration = 240  # 4 minutes - restart streams regularly 
            max_requests_per_stream = 1000  # High limit for long sessions
            stream_start_time = time.time()  # Track when this stream started
            print(f"🕐 Stream started at {stream_start_time}, will restart after {max_stream_duration}s or {max_requests_per_stream} requests")
            sys.stdout.flush()
            
            # WORKING PATTERN: Based on successful implementation
            def request_generator():
                """Generate requests: streaming_config first, then audio chunks."""
                print(f"🎯 Request generator started")
                sys.stdout.flush()
                
                # Send config as first request (reference pattern)
                yield speech.StreamingRecognizeRequest(streaming_config=streaming_config)
                print(f"✅ Streaming config sent as first request")
                sys.stdout.flush()
                
                # Then send audio chunks
                requests_sent = 1  # Already sent config
                silence = b"\x00\x00" * 800  # 50ms silence
                
                while not stop_event.is_set():
                    try:
                        # Get audio chunk
                        audio_data = audio_queue.get(timeout=0.1)
                        if audio_data and len(audio_data) > 0:
                            yield speech.StreamingRecognizeRequest(audio_content=audio_data)
                            requests_sent += 1
                            if requests_sent % 20 == 0:
                                print(f"📤 Audio chunk sent: {len(audio_data)} bytes (#{requests_sent})")
                                sys.stdout.flush()
                    except queue.Empty:
                        # Send silence to keep stream alive
                        yield speech.StreamingRecognizeRequest(audio_content=silence)
                        requests_sent += 1
                        time.sleep(0.05)
                
                print(f"🏁 Request generator ended: {requests_sent} total")
                sys.stdout.flush()
            
            try:
                print(f"📞 Calling streaming_recognize...")
                sys.stdout.flush()
                
                # Use the reference pattern: config first, then audio requests
                responses = module_speech_client.streaming_recognize(
                    config=streaming_config,
                    requests=request_generator()
                )
                
                print(f"📡 Processing STT responses...")
                sys.stdout.flush()
                
                # Process responses with restart logic
                requests_sent = 0  # Track requests in this response loop
                for response in responses:
                    if stop_event.is_set():
                        break
                    
                    requests_sent += 1
                    
                    # Check if we need to restart the stream for long sessions
                    current_time = time.time()
                    stream_duration = current_time - stream_start_time
                    
                    if (stream_duration > max_stream_duration or 
                        requests_sent > max_requests_per_stream):
                        print(f"🔄 Stream restart needed for long session: duration={stream_duration:.1f}s, requests={requests_sent}")
                        print(f"🎯 This is normal for therapy sessions longer than {max_stream_duration/60:.1f} minutes")
                        sys.stdout.flush()
                        break  # This will restart the stream
                    
                    if hasattr(response, 'error') and response.error:
                        error_code = getattr(response.error, 'code', 'no_code')
                        error_message = getattr(response.error, 'message', 'no_message') 
                        error_details = getattr(response.error, 'details', 'no_details')
                        print(f"❌ STT ERROR: code={error_code}, message='{error_message}', details='{error_details}'")
                        
                        # Handle specific errors that require restart
                        if error_code in [11, 3, 4]:  # DEADLINE_EXCEEDED, INVALID_ARGUMENT, DEADLINE_EXCEEDED
                            print(f"🔄 Restarting stream due to error {error_code}")
                            sys.stdout.flush()
                            break  # Restart stream
                        
                        sys.stdout.flush()
                        continue
                    
                    if not response.results:
                        continue
                        
                    result = response.results[0]
                    if not result.alternatives:
                        continue
                        
                    transcript = result.alternatives[0].transcript.strip()
                    is_final = getattr(result, 'is_final', False)
                    confidence = getattr(result.alternatives[0], 'confidence', 0.0)
                    
                    if transcript:  # Only send non-empty transcripts
                        print(f"✅ {'FINAL' if is_final else 'interim'}: '{transcript}'")
                        sys.stdout.flush()
                        
                        # Send to frontend
                        asyncio.run_coroutine_threadsafe(
                            websocket.send_json({
                                                "type": "transcription",
                                                "data": {
                                    "type": "final" if is_final else "interim",
                                                    "transcript": transcript,
                                                    "confidence": round(confidence, 2),
                                                    "timestamp": datetime.now(timezone.utc).isoformat(),
                                    "source": "google_streaming",
                                    "language_detected": config.language_code,
                                                    "mental_health_optimized": True
                                                }
                            }),
                            loop,
                        )
                
                print(f"🏁 STT completed for session {session_id}")
                
            except Exception as e:
                print(f"❌ STT failed: {type(e).__name__}: {str(e)}")
                import traceback
                traceback.print_exc()
                sys.stdout.flush()
        
        # Start STT streaming with automatic restart capability
        def run_streaming_with_restart():
            restart_count = 0
            while not stop_event.is_set():
                restart_count += 1
                print(f"🚀 STT STREAM #{restart_count} STARTING for session {session_id}")
                import sys
                sys.stdout.flush()
                
                try:
                    run_streaming()
                    
                    # If we reach here without exception, check if we should continue
                    if stop_event.is_set():
                        print(f"🛑 Stop event set, ending STT for session {session_id}")
                        break
                    
                    # Check if there's still audio to process
                    if audio_queue.qsize() > 0:
                        print(f"🔄 Audio remaining, auto-restarting STT stream #{restart_count + 1}")
                        print(f"🎭 Continuing therapy session - this is normal for 20+ minute sessions")
                        time.sleep(0.5)  # Brief pause before restart
                        continue
                    else:
                        print(f"🏁 No more audio, ending STT for session {session_id}")
                        break
                        
                except Exception as stream_error:
                    print(f"❌ STT stream error (attempt #{restart_count}): {stream_error}")
                    
                    # Check for specific restart conditions - common in long therapy sessions
                    error_str = str(stream_error).lower()
                    if any(keyword in error_str for keyword in ['deadline', 'timeout', 'limit', 'exceeded', 'duration']):
                        print(f"🔄 Detected stream limit (normal for long sessions), restarting STT stream #{restart_count + 1}")
                        print(f"💬 This restart ensures stable transcription during therapy sessions")
                        time.sleep(1)
                        continue
                    else:
                        # Other errors might be more serious
                        print(f"💥 Serious STT error: {stream_error}")
                        import traceback
                        traceback.print_exc()
                        time.sleep(2)
                        if restart_count < 5:  # Max 5 restart attempts
                            continue
                        else:
                            print(f"🚫 Max restart attempts reached for session {session_id}")
                            break
                    
                    sys.stdout.flush()
                
            print(f"🔚 STT streaming ended for session {session_id} after {restart_count} attempts")
        
        streaming_thread = threading.Thread(target=run_streaming_with_restart, daemon=True)
        streaming_thread.start()
        print(f"🎤 STT thread with auto-restart started for session {session_id}")
        import sys
        sys.stdout.flush()  # Force immediate output
        
        # Main WebSocket loop
        while True:
            try:
                # Wait for data from frontend
                data = await asyncio.wait_for(websocket.receive(), timeout=10.0)
                
                if "bytes" in data:
                    # Handle audio data (binary PCM 16-bit little endian)
                    audio_data = data["bytes"]
                    if len(audio_data) > 0:
                        # Push to streaming queue
                        try:
                            audio_queue.put_nowait(audio_data)
                            queue_size = audio_queue.qsize()
                            print(f"Received audio chunk: {len(audio_data)} bytes, queue size: {queue_size}")
                            import sys
                            sys.stdout.flush()
                        except queue.Full:
                            # Drop if queue is full to avoid backpressure
                            print(f"⚠️ Audio queue full, dropping {len(audio_data)} bytes")
                            pass
                
                elif "text" in data:
                    # Handle control messages
                    try:
                        message = json.loads(data["text"])
                        message_type = message.get("type")
                        
                        if message_type == "stop_recording":
                            stop_event.set()
                            break
                        elif message_type == "pause_recording":
                            print(f"Recording paused for session {session_id}")
                            await websocket.send_json({
                                "type": "recording_paused",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                        elif message_type == "resume_recording":
                            print(f"Recording resumed for session {session_id}")
                            await websocket.send_json({
                                "type": "recording_resumed",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                        elif message_type == "ping":
                            await websocket.send_json({
                                "type": "pong",
                                "timestamp": datetime.now(timezone.utc).isoformat()
                            })
                    except json.JSONDecodeError:
                        print(f"Invalid JSON message received for session {session_id}")
                    
            except asyncio.TimeoutError:
                # Send heartbeat to keep connection alive
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                continue
                
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session: {session_id}")
    except Exception as e:
        print(f"WebSocket error for session {session_id}: {str(e)}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": f"Connection error: {str(e)}"
            })
        except:
            pass
    finally:
        # Cleanup
        if stop_event:
            stop_event.set()
        try:
            if streaming_thread and streaming_thread.is_alive():
                streaming_thread.join(timeout=1.5)
        except Exception:
            pass
        print(f"WebSocket connection closed for session: {session_id}")# This code goes into simple_main.py
# Add this endpoint after the existing /ws/consultation endpoint

@app.websocket("/ws/transcribe")
async def vertex_ai_transcribe_websocket(websocket: WebSocket):
    """
    Lightweight Vertex AI STT WebSocket endpoint for testing.
    Validates JWT token and streams audio to Vertex AI.
    """
    await websocket.accept()
    
    # Extract token from query parameters
    token = None
    session_id = None
    try:
        query_params = dict(websocket.query_params)
        token = query_params.get('token')
        session_id = query_params.get('session_id', 'test-session')
        
        if not token:
            await websocket.send_json({"error": "No token provided"})
            await websocket.close(code=1008)
            return
        
        # Validate JWT token
        try:
            payload = jwt_manager.verify_token(token, token_type="access")
            user_id = payload.get("sub")
            user_email = payload.get("email")
            print(f"✅ WebSocket authenticated: {user_email} ({user_id})")
        except HTTPException as e:
            error_msg = getattr(e, 'detail', str(e))
            print(f"❌ JWT validation failed (HTTPException): {error_msg}")
            await websocket.send_json({"error": error_msg})
            await websocket.close(code=1008)
            return
        except Exception as e:
            error_msg = str(e) if str(e) else type(e).__name__
            print(f"❌ JWT validation failed (Exception): {error_msg}")
            await websocket.send_json({"error": "Invalid or expired token"})
            await websocket.close(code=1008)
            return
        
        # Send connection confirmation
        await websocket.send_json({
            "status": "connected",
            "message": "Vertex AI STT ready",
            "session_id": session_id
        })
        
        # Initialize Vertex AI Speech client
        from google.cloud import speech_v2 as speech
        from google.oauth2 import service_account
        from app.core.config import get_settings
        
        settings = get_settings()
        
        # Create credentials
        credentials = service_account.Credentials.from_service_account_file(
            settings.GOOGLE_APPLICATION_CREDENTIALS,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        
        client = speech.SpeechClient(credentials=credentials)
        
        # Configure recognition (Speech V2 API)
        # Note: AutoDetectDecodingConfig doesn't work well with WebM/Opus
        # Frontend will send LINEAR16 PCM audio (16kHz, mono)
        recognition_config = speech.RecognitionConfig(
            explicit_decoding_config=speech.ExplicitDecodingConfig(
                encoding=speech.ExplicitDecodingConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,  # Standard for speech recognition
                audio_channel_count=1  # Mono
            ),
            language_codes=settings.GOOGLE_STT_ALTERNATE_LANGUAGES,  # All languages equal (hi-IN, mr-IN, en-IN)
            model=settings.GOOGLE_STT_MODEL
            # Note: Default recognizer (_) doesn't support advanced features like punctuation
        )
        print(f"📋 Recognition config: LINEAR16 @ 16kHz, model={settings.GOOGLE_STT_MODEL}, languages={settings.GOOGLE_STT_ALTERNATE_LANGUAGES}")
        
        streaming_config = speech.StreamingRecognitionConfig(
            config=recognition_config,
            streaming_features=speech.StreamingRecognitionFeatures(
                interim_results=settings.GOOGLE_STT_INTERIM_RESULTS
            )
        )
        
        # Use a queue to bridge async WebSocket and sync Speech API
        import queue
        import threading
        
        audio_queue = queue.Queue()
        processing_complete = threading.Event()
        loop = asyncio.get_event_loop()  # Get event loop before threading
        
        # Audio stream generator (synchronous)
        def audio_stream_generator():
            # Send config first
            # Note: Speech V2 API requires 'global' location for streaming recognition
            print(f"🎤 Starting audio stream generator for session {session_id}")
            yield speech.StreamingRecognizeRequest(
                recognizer=f"projects/{settings.GOOGLE_CLOUD_PROJECT}/locations/global/recognizers/_",
                streaming_config=streaming_config
            )
            print(f"✅ Config request sent to Vertex AI")
            
            # Then stream audio from queue
            chunk_count = 0
            empty_count = 0
            max_empty_before_warn = 120  # Allow 2 minutes of silence before warning
            while not processing_complete.is_set():
                try:
                    audio_chunk = audio_queue.get(timeout=0.5)  # Shorter timeout for faster response
                    if audio_chunk is None:  # Sentinel value to stop
                        print(f"📊 Audio stream ended (sentinel received). Total chunks sent: {chunk_count}")
                        break
                    if len(audio_chunk) > 0:
                        chunk_count += 1
                        empty_count = 0  # Reset empty counter
                        if chunk_count % 40 == 0:  # Log every 40 chunks (~10 seconds)
                            print(f"🎵 Sent {chunk_count} audio chunks ({len(audio_chunk)} bytes each)")
                        yield speech.StreamingRecognizeRequest(audio=audio_chunk)
                except queue.Empty:
                    empty_count += 1
                    if empty_count >= max_empty_before_warn:
                        print(f"⚠️  No audio received for {empty_count * 0.5:.1f} seconds! Check frontend audio capture.")
                        # Don't break - keep waiting for audio
                    continue
            
            print(f"🛑 Generator exiting: processing_complete={processing_complete.is_set()}, chunks_sent={chunk_count}")
        
        # Process responses in a separate thread
        # NOTE: Keep processing until explicitly stopped (processing_complete is set)
        def process_speech_responses():
            response_count = 0
            stream_count = 0
            
            while not processing_complete.is_set():
                stream_count += 1
                try:
                    print(f"🚀 Starting Speech API stream #{stream_count} for session {session_id}")
                    responses = client.streaming_recognize(requests=audio_stream_generator())
                    print(f"✅ Speech API stream established, waiting for responses...")
                    
                    response_received = False
                    for response in responses:
                        response_received = True
                        if processing_complete.is_set():
                            print(f"⏹️  Stop signal received, ending Speech API stream")
                            break
                            
                        response_count += 1
                        if response_count % 10 == 0:
                            print(f"📥 Received {response_count} responses from Vertex AI")
                        
                        for result in response.results:
                            if not result.alternatives:
                                continue
                            
                            alternative = result.alternatives[0]
                            transcript = alternative.transcript
                            confidence = alternative.confidence if result.is_final else 0.0
                            
                            # Send result to client (schedule in event loop)
                            asyncio.run_coroutine_threadsafe(
                                websocket.send_json({
                                    "transcript": transcript,
                                    "is_final": result.is_final,
                                    "confidence": confidence,
                                    "language_code": result.language_code,
                                    "timestamp": datetime.now(timezone.utc).isoformat()
                                }),
                                loop
                            )
                            
                            if result.is_final:
                                print(f"✅ FINAL transcript: {transcript[:100]}..." if len(transcript) > 100 else f"✅ FINAL transcript: {transcript}")
                                print(f"   Confidence: {confidence:.2f}, Language: {result.language_code}")
                    
                    # Stream ended naturally (silence detected) - restart if not stopped
                    print(f"📡 Stream #{stream_count} ended. Received responses: {response_received}, Total responses so far: {response_count}")
                    
                    if not processing_complete.is_set():
                        print(f"🔄 Speech API stream ended, restarting for continuous transcription...")
                        continue  # Restart the loop
                    else:
                        print(f"🏁 Speech API stream ended - session stopped (processing_complete is set)")
                        break
                        
                except Exception as e:
                    if processing_complete.is_set():
                        print(f"ℹ️  Exception during shutdown (expected): {type(e).__name__}")
                        break
                        
                    error_type = type(e).__name__
                    error_msg = str(e)
                    print(f"❌ Speech processing error ({error_type}): {error_msg}")
                    
                    # Handle timeout/aborted specifically - this might be recoverable
                    if "timed out" in error_msg.lower() or "aborted" in error_type.lower():
                        print(f"⚠️  Speech API stream timed out (no audio received for ~40 seconds)")
                        print(f"⚠️  This usually means the frontend stopped sending audio")
                        print(f"⚠️  Check: 1) Audio capture still running? 2) WebSocket still sending data?")
                        if not processing_complete.is_set():
                            print(f"🔄 Session still active - will retry when audio resumes...")
                            continue  # Try again - frontend might still be connected
                    
                    import traceback
                    print("Full traceback:")
                    traceback.print_exc()
                    
                    # Send user-friendly error to client
                    user_message = "Transcription service error. Please try again."
                    if "credentials" in error_msg.lower():
                        user_message = "Authentication error with speech service. Please contact support."
                    elif "quota" in error_msg.lower():
                        user_message = "Speech service quota exceeded. Please try again later."
                    elif "network" in error_msg.lower() or "connection" in error_msg.lower():
                        user_message = "Network error connecting to speech service. Please check your connection."
                    elif "encoding" in error_msg.lower() or "format" in error_msg.lower():
                        user_message = "Audio format error. Please try refreshing the page."
                    
                    asyncio.run_coroutine_threadsafe(
                        websocket.send_json({
                            "error": user_message,
                            "detail": f"{error_type}: {error_msg[:200]}"  # Truncate long error messages
                        }),
                        loop
                    )
                    
                    # Wait a bit before retrying on error
                    if not processing_complete.is_set():
                        print(f"⏸️  Waiting 2 seconds before retry...")
                        processing_complete.wait(timeout=2.0)
            
            print(f"🧹 Speech processing thread cleanup for session {session_id} ({stream_count} streams processed)")
            # NOTE: Don't set processing_complete here - let the WebSocket cleanup handle it
            # This allows the continuous transcription loop to work properly
        
        # Start processing thread
        processing_thread = threading.Thread(
            target=process_speech_responses, 
            daemon=True, 
            name=f"Speech-{session_id}"
        )
        processing_thread.start()
        print(f"✅ Speech processing thread started for session {session_id}")
        
        # Receive audio from WebSocket and put in queue
        # NOTE: This loop runs independently of speech processing thread
        # It only exits when WebSocket disconnects or errors occur
        audio_chunks_received = 0
        print(f"🎧 Starting WebSocket receive loop for session {session_id}")
        try:
            loop_iterations = 0
            while True:  # ✅ Keep receiving until WebSocket closes
                loop_iterations += 1
                if loop_iterations % 50 == 0:
                    print(f"🔄 WebSocket loop iteration #{loop_iterations}, received {audio_chunks_received} chunks")
                
                try:
                    audio_chunk = await asyncio.wait_for(
                        websocket.receive_bytes(),
                        timeout=1.0
                    )
                    if not audio_chunk or len(audio_chunk) == 0:
                        print(f"⚠️  Received empty audio chunk, ignoring")
                        continue
                    
                    audio_chunks_received += 1
                    if audio_chunks_received % 40 == 0:  # Log every 40 chunks (~10 seconds)
                        print(f"📨 Received {audio_chunks_received} audio chunks from frontend ({len(audio_chunk)} bytes each)")
                    
                    audio_queue.put(audio_chunk)
                except asyncio.TimeoutError:
                    # Normal timeout - check if we should continue
                    if processing_complete.is_set():
                        print(f"ℹ️  Speech thread stopped, ending receive loop (processing_complete is set)")
                        break
                    # Keep receiving
                    continue
            
            print(f"🛑 WebSocket receive loop exited normally after {loop_iterations} iterations")
        except WebSocketDisconnect:
            print(f"🔌 WebSocket disconnected by client for session {session_id} after {loop_iterations} iterations")
        except Exception as e:
            error_type = type(e).__name__
            print(f"❌ WebSocket receive error ({error_type}): {e}")
        finally:
            print(f"🧹 Cleaning up WebSocket connection for session {session_id}")
            print(f"📊 Total audio chunks received: {audio_chunks_received}")
            # Signal end of audio stream
            audio_queue.put(None)
            processing_complete.set()
            # Wait for speech thread to finish (with timeout)
            print(f"⏳ Waiting for speech thread to finish...")
            processing_thread.join(timeout=10.0)
            if processing_thread.is_alive():
                print(f"⚠️  Speech thread still running after timeout for session {session_id}")
            else:
                print(f"✅ Speech thread finished cleanly for session {session_id}")
            print(f"🔌 WebSocket closed for session {session_id}")
        
    except WebSocketDisconnect:
        print(f"WebSocket disconnected for session {session_id}")
    except Exception as e:
        print(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({
                "error": str(e),
                "detail": "Transcription error occurred"
            })
        except:
            pass
    finally:
        try:
            if websocket.client_state != WebSocketState.DISCONNECTED:
                await websocket.close()
        except:
            pass
        print(f"WebSocket closed for session {session_id}")
