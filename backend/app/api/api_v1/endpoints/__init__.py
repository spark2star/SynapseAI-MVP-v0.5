"""
API endpoints package initialization.
"""

from . import (
    auth,
    patients,
    users,
    health,
    reports,
    consultation,
    newsletter,
    contact,
    intake,
    profile,
    admin,
    doctor,
    forms,
    sessions,
    templates,
    analytics,
    transcribe  # ✅ AND THIS FOR THE NEW ENDPOINT
)

__all__ = [
    "auth",
    "patients",
    "users",
    "health",
    "reports",
    "transcription",
    "consultation",
    "newsletter",
    "contact",
    "intake",
    "profile",
    "admin",
    "doctor",
    "forms",
    "sessions",
    "templates",
    "analytics",
    "transcribe"
]
