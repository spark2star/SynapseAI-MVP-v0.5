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