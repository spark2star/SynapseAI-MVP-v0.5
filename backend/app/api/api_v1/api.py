"""
Main API router that includes all endpoint routers.
"""

from fastapi import APIRouter

from app.api.api_v1.endpoints import auth, patients, users, health, reports, consultation as consultation_endpoints
from app.api.websocket import consultation

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(consultation_endpoints.router, prefix="/consultation", tags=["consultation"])

# Include WebSocket routers (no prefix for WebSocket endpoints)
api_router.include_router(consultation.router, tags=["websocket"])
