"""
Main API router that includes all endpoint routers.
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import (
    auth, patients, users, health, reports,
    consultation as consultation_endpoints, 
    newsletter, contact, intake, profile, admin, doctor, forms,
    sessions, templates, analytics,
    transcribe, transcribe_stream, transcribe_simple
)
from app.api.websocket import consultation

api_router = APIRouter()

# ===== REST API ENDPOINTS =====
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(doctor.router, prefix="/doctor", tags=["doctor-registration"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(profile.router, prefix="/profile", tags=["practitioner-profile"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(sessions.router, prefix="/sessions", tags=["consultation-sessions"])
api_router.include_router(templates.router, prefix="/templates", tags=["report-templates"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(consultation_endpoints.router, prefix="/consultation", tags=["consultation"])
api_router.include_router(newsletter.router, prefix="/newsletter", tags=["newsletter"])
api_router.include_router(contact.router, prefix="/contact", tags=["contact"])
api_router.include_router(intake.router, prefix="/intake", tags=["patient-intake"])
api_router.include_router(forms.router, prefix="/forms", tags=["forms"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
api_router.include_router(transcribe.router, prefix="/transcribe", tags=["transcribe"])
api_router.include_router(transcribe_simple.router, prefix="/stt", tags=["simple-transcription"])

# ===== WEBSOCKET ENDPOINTS =====
api_router.include_router(consultation.router, tags=["websocket"])


# ✅ ADD WebSocket route
api_router.include_router(
    transcribe_stream.router,
    # prefix="/transcribe",
    tags=["transcribe"]
)