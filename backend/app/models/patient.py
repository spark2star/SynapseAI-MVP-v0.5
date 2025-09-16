"""
Patient model with encrypted demographic data.
Implements comprehensive patient information storage with privacy protection.
"""

from sqlalchemy import Column, String, ForeignKey, Date, Text, Index
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import date
from typing import Dict, Any, Optional

from .base import BaseModel, EncryptedType
from app.core.encryption import create_patient_id, hash_util


class Gender(str, Enum):
    """Gender options for patient demographics."""
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    PREFER_NOT_TO_SAY = "prefer_not_to_say"


class BloodGroup(str, Enum):
    """Blood group options."""
    A_POSITIVE = "A+"
    A_NEGATIVE = "A-"
    B_POSITIVE = "B+"
    B_NEGATIVE = "B-"
    AB_POSITIVE = "AB+"
    AB_NEGATIVE = "AB-"
    O_POSITIVE = "O+"
    O_NEGATIVE = "O-"
    UNKNOWN = "unknown"


class Patient(BaseModel):
    """
    Patient model with encrypted demographic information.
    All PII fields are encrypted for privacy protection.
    """
    __tablename__ = "patients"
    
    # Unique patient identifier (visible to users)
    patient_id = Column(String(20), unique=True, nullable=False, index=True, default=create_patient_id)
    
    # Demographics (all encrypted)
    first_name = Column(EncryptedType(100), nullable=False)
    last_name = Column(EncryptedType(100), nullable=False)
    date_of_birth = Column(EncryptedType(20), nullable=False)  # Encrypted date string
    gender = Column(EncryptedType(30), nullable=False)
    
    # Contact information (encrypted)
    phone_primary = Column(EncryptedType(20), nullable=True)
    phone_secondary = Column(EncryptedType(20), nullable=True)
    email = Column(EncryptedType(255), nullable=True)
    
    # Address (encrypted)
    address_line1 = Column(EncryptedType(255), nullable=True)
    address_line2 = Column(EncryptedType(255), nullable=True)
    city = Column(EncryptedType(100), nullable=True)
    state = Column(EncryptedType(100), nullable=True)
    postal_code = Column(EncryptedType(20), nullable=True)
    country = Column(EncryptedType(100), nullable=True)
    
    # Emergency contact (encrypted)
    emergency_contact_name = Column(EncryptedType(200), nullable=True)
    emergency_contact_phone = Column(EncryptedType(20), nullable=True)
    emergency_contact_relationship = Column(EncryptedType(50), nullable=True)
    
    # Medical information (encrypted)
    blood_group = Column(EncryptedType(10), nullable=True)
    allergies = Column(EncryptedType(1000), nullable=True)  # Comma-separated list
    medical_history = Column(EncryptedType(5000), nullable=True)
    current_medications = Column(EncryptedType(2000), nullable=True)
    
    # Insurance information (encrypted)
    insurance_provider = Column(EncryptedType(200), nullable=True)
    insurance_policy_number = Column(EncryptedType(100), nullable=True)
    insurance_group_number = Column(EncryptedType(100), nullable=True)
    
    # Additional demographics
    occupation = Column(EncryptedType(200), nullable=True)
    marital_status = Column(EncryptedType(20), nullable=True)
    preferred_language = Column(EncryptedType(50), nullable=True)
    
    # System fields
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # For search functionality (hashed identifiers)
    name_hash = Column(String(64), nullable=False, index=True)  # For searching by name
    phone_hash = Column(String(64), nullable=True, index=True)  # For searching by phone
    email_hash = Column(String(64), nullable=True, index=True)  # For searching by email
    
    # Preferences and metadata
    notes = Column(Text, nullable=True)  # Non-encrypted notes
    tags = Column(String(500), nullable=True)  # Comma-separated tags
    
    # Relationships
    created_by_user = relationship("User", back_populates="created_patients")
    consultation_sessions = relationship("ConsultationSession", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    bills = relationship("Bill", back_populates="patient")
    
    # Indexes for search performance
    __table_args__ = (
        Index('idx_patient_name_hash', 'name_hash'),
        Index('idx_patient_phone_hash', 'phone_hash'),
        Index('idx_patient_email_hash', 'email_hash'),
        Index('idx_patient_created_by', 'created_by'),
    )
    
    def __init__(self, **kwargs):
        """Initialize patient with automatic hash generation."""
        super().__init__(**kwargs)
        self._update_search_hashes()
    
    def _update_search_hashes(self):
        """Update search hashes for encrypted fields."""
        if self.first_name and self.last_name:
            full_name = f"{self.first_name} {self.last_name}".lower()
            self.name_hash = hash_util.hash_identifier(full_name)
        
        if self.phone_primary:
            self.phone_hash = hash_util.hash_identifier(self.phone_primary)
        
        if self.email:
            self.email_hash = hash_util.hash_identifier(self.email.lower())
    
    def update_from_dict(self, data: dict):
        """Update patient from dictionary and refresh search hashes."""
        super().update_from_dict(data)
        self._update_search_hashes()
    
    def __repr__(self):
        return f"<Patient(patient_id='{self.patient_id}', id='{self.id}')>"
    
    @property
    def full_name(self) -> str:
        """Get decrypted full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def age(self) -> Optional[int]:
        """Calculate age from date of birth."""
        if not self.date_of_birth:
            return None
        
        try:
            # Decrypt and parse date of birth
            dob_str = self.date_of_birth
            # Assuming date format: YYYY-MM-DD
            dob = date.fromisoformat(dob_str)
            today = date.today()
            
            age = today.year - dob.year
            if today.month < dob.month or (today.month == dob.month and today.day < dob.day):
                age -= 1
            
            return age
        except (ValueError, TypeError):
            return None
    
    @property
    def contact_info(self) -> Dict[str, Any]:
        """Get formatted contact information."""
        return {
            "phone_primary": self.phone_primary,
            "phone_secondary": self.phone_secondary,
            "email": self.email,
            "address": {
                "line1": self.address_line1,
                "line2": self.address_line2,
                "city": self.city,
                "state": self.state,
                "postal_code": self.postal_code,
                "country": self.country
            }
        }
    
    @property 
    def emergency_contact(self) -> Dict[str, Any]:
        """Get emergency contact information."""
        return {
            "name": self.emergency_contact_name,
            "phone": self.emergency_contact_phone,
            "relationship": self.emergency_contact_relationship
        }
    
    @property
    def medical_summary(self) -> Dict[str, Any]:
        """Get medical summary information."""
        return {
            "blood_group": self.blood_group,
            "allergies": self.allergies.split(",") if self.allergies else [],
            "medical_history": self.medical_history,
            "current_medications": self.current_medications.split(",") if self.current_medications else []
        }
    
    def get_demographics_dict(self) -> Dict[str, Any]:
        """Get decrypted demographics for API responses."""
        return {
            "patient_id": self.patient_id,
            "full_name": self.full_name,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "date_of_birth": self.date_of_birth,
            "age": self.age,
            "gender": self.gender,
            "contact_info": self.contact_info,
            "emergency_contact": self.emergency_contact,
            "medical_summary": self.medical_summary,
            "insurance": {
                "provider": self.insurance_provider,
                "policy_number": self.insurance_policy_number,
                "group_number": self.insurance_group_number
            },
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def search_by_name(cls, query: str) -> str:
        """Generate search hash for name query."""
        return hash_util.hash_identifier(query.lower().strip())
    
    @classmethod
    def search_by_phone(cls, phone: str) -> str:
        """Generate search hash for phone query."""
        return hash_util.hash_identifier(phone.strip())
    
    @classmethod
    def search_by_email(cls, email: str) -> str:
        """Generate search hash for email query."""
        return hash_util.hash_identifier(email.lower().strip())
