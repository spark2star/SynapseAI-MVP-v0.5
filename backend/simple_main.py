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