"""
Doctor Profile model for medical credential management.
Stores doctor-specific information for registration and verification.
"""

from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum

from .base import BaseModel


class DoctorStatus(str, Enum):
    """Doctor verification status."""
    PENDING = "pending"
    VERIFIED = "verified"
    REJECTED = "rejected"


class DoctorProfile(BaseModel):
    """
    Doctor profile model for medical credentials and professional information.
    Created during doctor registration and completed after approval.
    """
    __tablename__ = "doctor_profiles"
    
    # Foreign key to User
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    
    # Required fields for application
    full_name = Column(String(255), nullable=False)
    medical_registration_number = Column(String(100), nullable=False, unique=True, index=True)
    state_medical_council = Column(String(100), nullable=False)
    
    # Required fields post-approval (completed on first login)
    clinic_name = Column(String(255), nullable=True)
    clinic_address = Column(Text, nullable=True)
    specializations = Column(JSONB, nullable=True)  # Array of specializations
    years_of_experience = Column(Integer, nullable=True)
    digital_signature_url = Column(String(500), nullable=True)
    phone_number = Column(String(20), nullable=True)
    alternate_email = Column(String(255), nullable=True)
    
    # Metadata fields
    application_date = Column(DateTime(timezone=True), nullable=False)
    verification_date = Column(DateTime(timezone=True), nullable=True)
    verified_by_admin_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    rejection_reason = Column(Text, nullable=True)
    profile_completed = Column(Boolean, nullable=False, default=False)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], back_populates="doctor_profile")
    verified_by_admin = relationship("User", foreign_keys=[verified_by_admin_id])
    
    def __repr__(self):
        return f"<DoctorProfile(user_id='{self.user_id}', full_name='{self.full_name}', status='{self.user.doctor_status if self.user else 'unknown'}')>"
    
    @property
    def is_verified(self) -> bool:
        """Check if doctor is verified."""
        return self.user and self.user.doctor_status == DoctorStatus.VERIFIED.value
    
    @property
    def is_pending(self) -> bool:
        """Check if doctor application is pending."""
        return self.user and self.user.doctor_status == DoctorStatus.PENDING.value
    
    @property
    def is_rejected(self) -> bool:
        """Check if doctor application was rejected."""
        return self.user and self.user.doctor_status == DoctorStatus.REJECTED.value

