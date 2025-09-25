"""
Database models for the EMR system.
All models implement encryption for sensitive data fields.
"""

from .user import User, UserProfile
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
