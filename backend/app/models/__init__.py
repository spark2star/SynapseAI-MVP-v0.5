"""Model registry for Alembic autogenerate.

Import all ORM models here so that Alembic can discover them when building
metadata for autogeneration. This module should be imported by Alembic env.py.
"""

from app.models.base import Base  # noqa: F401

# Import models for registration
from .user import User, UserProfile  # noqa: F401
from .doctor_profile import DoctorProfile  # noqa: F401
from .audit_log import AuditLog as DoctorAuditLog  # noqa: F401
from .email_queue import EmailQueue  # noqa: F401
from .patient import Patient  # noqa: F401
from .session import ConsultationSession, Transcription  # noqa: F401
from .report import Report, ReportTemplate  # noqa: F401
from .appointment import Appointment  # noqa: F401
from .billing import Bill  # noqa: F401
from .audit import AuditLog  # noqa: F401
from .contact import ContactSubmission  # noqa: F401
from .newsletter import NewsletterSubscription  # noqa: F401
"""
Database models for the EMR system.
All models implement encryption for sensitive data fields.
"""

from .user import User, UserProfile
from .doctor_profile import DoctorProfile
from .audit_log import AuditLog as DoctorAuditLog
from .email_queue import EmailQueue
from .patient import Patient
from .session import ConsultationSession, Transcription
from .report import Report, ReportTemplate
from .appointment import Appointment
from .billing import Bill
from .audit import AuditLog
from .newsletter import NewsletterSubscription
from .contact import ContactSubmission
from .symptom import (
    MasterSymptom, UserSymptom, PatientSymptom, IntakePatient,
    SymptomSeverity, SymptomFrequency, DurationUnit
)

__all__ = [
    "User",
    "UserProfile",
    "DoctorProfile",
    "DoctorAuditLog",
    "EmailQueue",
    "Patient",
    "ConsultationSession",
    "Transcription",
    "Report",
    "ReportTemplate",
    "Appointment",
    "Bill",
    "AuditLog",
    "NewsletterSubscription",
    "ContactSubmission",
    "MasterSymptom",
    "UserSymptom", 
    "PatientSymptom",
    "IntakePatient",
    "SymptomSeverity",
    "SymptomFrequency",
    "DurationUnit"
]
