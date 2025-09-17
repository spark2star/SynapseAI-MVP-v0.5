"""
Simple FastAPI app with basic authentication for testing.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(
    title="Intelligent EMR System",
    description="Healthcare Management System with AI Integration",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
    Accepts demo credentials and returns mock tokens.
    """
    # Demo credentials
    demo_users = {
        "doctor@demo.com": {"password": "password123", "role": "doctor", "name": "Dr. Smith"},
        "admin@demo.com": {"password": "password123", "role": "admin", "name": "Admin User"},
        "reception@demo.com": {"password": "password123", "role": "receptionist", "name": "Reception"}
    }
    
    if login_data.email not in demo_users:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data = demo_users[login_data.email]
    if user_data["password"] != login_data.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "status": "success", 
        "data": {
            "access_token": "demo-jwt-token-12345",
            "refresh_token": "demo-refresh-token-67890",
            "token_type": "bearer",
            "user_id": f"demo-user-{user_data['role']}",
            "role": user_data["role"],
            "email": login_data.email,
            "name": user_data["name"]
        }
    }

@app.get("/api/v1/users/me")
async def get_current_user():
    """Mock current user endpoint."""
    return {
        "id": "demo-user-id",
        "email": "doctor@demo.com", 
        "role": "doctor",
        "name": "Dr. Smith"
    }

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