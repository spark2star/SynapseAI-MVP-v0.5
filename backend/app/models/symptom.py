"""
Symptom management models for mental health intake system.
Implements master symptoms, user-defined symptoms, and patient-symptom associations.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Integer, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from typing import List, Dict, Any, Optional
from datetime import datetime

from .base import BaseModel


class SymptomSeverity(str, Enum):
    """Severity levels for patient symptoms."""
    MILD = "Mild"
    MODERATE = "Moderate"
    SEVERE = "Severe"


class SymptomFrequency(str, Enum):
    """Frequency levels for patient symptoms."""
    HOURLY = "Hourly"
    DAILY = "Daily"
    WEEKLY = "Weekly"
    CONSTANT = "Constant"


class DurationUnit(str, Enum):
    """Time units for symptom duration."""
    DAYS = "Days"
    WEEKS = "Weeks"
    MONTHS = "Months"


class MasterSymptom(BaseModel):
    """
    Global curated list of all known symptoms based on ICD-11.
    This is read-only for doctors and maintained by system administrators.
    """
    __tablename__ = "master_symptoms"
    
    name = Column(String(200), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)
    
    # ICD-11 categories as JSON array
    categories = Column(JSONB, nullable=False, default=list)
    
    # Additional metadata
    aliases = Column(JSONB, nullable=True, default=list)  # Alternative names
    tags = Column(JSONB, nullable=True, default=list)    # Searchable tags
    
    # System fields
    is_active = Column(Integer, default=1)  # Soft delete flag
    
    def __repr__(self):
        return f"<MasterSymptom(name='{self.name}', categories={self.categories})>"


class UserSymptom(BaseModel):
    """
    Custom symptoms created by individual doctors.
    These are scoped to the doctor who created them.
    """
    __tablename__ = "user_symptoms"
    
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # ICD-11 categories chosen by the doctor
    categories = Column(JSONB, nullable=False, default=list)
    
    # Additional metadata
    aliases = Column(JSONB, nullable=True, default=list)
    tags = Column(JSONB, nullable=True, default=list)
    
    # Relationships
    doctor = relationship("User", backref="custom_symptoms")
    
    # Composite unique constraint: doctor can't have duplicate symptom names
    __table_args__ = (
        {"schema": None}  # Use default schema
    )
    
    def __repr__(self):
        return f"<UserSymptom(doctor_id='{self.doctor_id}', name='{self.name}')>"


class PatientSymptom(BaseModel):
    """
    Association between patients and symptoms with contextual information.
    This is the core "join" table that stores all symptom-specific details.
    """
    __tablename__ = "patient_symptoms"
    
    # Foreign keys
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False, index=True)
    
    # Can reference either master or user symptoms
    symptom_id = Column(String(36), nullable=False, index=True)
    symptom_source = Column(String(10), nullable=False)  # 'master' or 'user'
    
    # Denormalized for easy display (avoid joins)
    symptom_name = Column(String(200), nullable=False, index=True)
    
    # Symptom context and severity
    severity = Column(String(20), nullable=False)  # Enum values
    frequency = Column(String(20), nullable=False)  # Enum values
    
    # Duration as structured data
    duration_value = Column(Integer, nullable=False)
    duration_unit = Column(String(20), nullable=False)  # Enum values
    
    # Free-text notes from doctor
    notes = Column(Text, nullable=True)
    
    # Additional context
    onset_description = Column(Text, nullable=True)
    triggers = Column(JSONB, nullable=True, default=list)
    
    # Relationships
    patient = relationship("Patient", backref="symptoms")
    
    def __repr__(self):
        return f"<PatientSymptom(patient_id='{self.patient_id}', symptom='{self.symptom_name}', severity='{self.severity}')>"
    
    @property
    def duration_formatted(self) -> str:
        """Get formatted duration string."""
        unit = self.duration_unit.lower()
        if self.duration_value == 1:
            unit = unit.rstrip('s')  # Remove plural 's'
        return f"{self.duration_value} {unit}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "symptom_id": self.symptom_id,
            "symptom_source": self.symptom_source,
            "symptom_name": self.symptom_name,
            "severity": self.severity,
            "frequency": self.frequency,
            "duration": {
                "value": self.duration_value,
                "unit": self.duration_unit,
                "formatted": self.duration_formatted
            },
            "notes": self.notes,
            "onset_description": self.onset_description,
            "triggers": self.triggers or [],
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }


class IntakePatient(BaseModel):
    """
    Simplified patient intake model focused on mental health consultations.
    This extends the main Patient model with intake-specific fields.
    """
    __tablename__ = "intake_patients"
    
    # Link to main patient record (optional - can create standalone intake)
    main_patient_id = Column(String(36), ForeignKey("patients.id"), nullable=True, index=True)
    
    # Basic demographics
    name = Column(String(200), nullable=False)
    age = Column(Integer, nullable=False)
    sex = Column(String(20), nullable=False)  # 'Male', 'Female', 'Other'
    address = Column(Text, nullable=True)
    phone = Column(String(20), nullable=True)
    # Informants (who provided the information)
    informants = Column(JSONB, nullable=False, default=dict)  # {"selection": [...], "other_details": "..."}
    
    # Illness duration
    illness_duration_value = Column(Integer, nullable=False)
    illness_duration_unit = Column(String(20), nullable=False)  # 'Weeks' or 'Months'
    
    # Referral information
    referred_by = Column(String(200), nullable=True)
    
    # Precipitating factors
    precipitating_factor_narrative = Column(Text, nullable=True)
    precipitating_factor_tags = Column(JSONB, nullable=True, default=list)
    
    # System fields
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    doctor = relationship("User", backref="intake_patients")
    main_patient = relationship("Patient", backref="intake_records")
    
    def __repr__(self):
        return f"<IntakePatient(name='{self.name}', age={self.age}, doctor_id='{self.doctor_id}')>"
    
    @property
    def illness_duration_formatted(self) -> str:
        """Get formatted illness duration."""
        unit = self.illness_duration_unit.lower()
        if self.illness_duration_value == 1:
            unit = unit.rstrip('s')  # Remove plural 's'
        return f"{self.illness_duration_value} {unit}"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses."""
        return {
            "id": self.id,
            "main_patient_id": self.main_patient_id,
            "name": self.name,
            "age": self.age,
            "sex": self.sex,
            "address": self.address,
            "informants": self.informants or {},
            "illness_duration": {
                "value": self.illness_duration_value,
                "unit": self.illness_duration_unit,
                "formatted": self.illness_duration_formatted
            },
            "referred_by": self.referred_by,
            "precipitating_factor": {
                "narrative": self.precipitating_factor_narrative,
                "tags": self.precipitating_factor_tags or []
            },
            "doctor_id": self.doctor_id,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
