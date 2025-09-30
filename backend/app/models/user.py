"""
User and authentication models.
Implements secure user management with role-based access control.
"""

from sqlalchemy import Column, String, Boolean, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from enum import Enum
from datetime import datetime, timezone

from .base import BaseModel, EncryptedType


class UserRole(str, Enum):
    """User roles for role-based access control."""
    ADMIN = "admin"
    DOCTOR = "doctor"
    RECEPTIONIST = "receptionist"


class User(BaseModel):
    """
    User authentication model.
    Stores core authentication data with encrypted sensitive fields.
    """
    __tablename__ = "users"
    
    # Authentication fields
    email = Column(EncryptedType(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.DOCTOR.value)
    
    # Account status
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_locked = Column(Boolean, default=False, nullable=False)
    
    # MFA and security
    mfa_secret = Column(EncryptedType(255), nullable=True)
    mfa_enabled = Column(Boolean, default=False, nullable=False)
    
    # Security tracking
    last_login = Column(DateTime(timezone=True), nullable=True)
    failed_login_attempts = Column(String(10), default="0", nullable=False)
    locked_until = Column(DateTime(timezone=True), nullable=True)
    
    # Password reset
    password_reset_token = Column(String(255), nullable=True)
    password_reset_expires = Column(DateTime(timezone=True), nullable=True)
    
    # Email verification
    email_verification_token = Column(String(255), nullable=True)
    email_verified_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    created_patients = relationship("Patient", back_populates="created_by_user")
    consultation_sessions = relationship("ConsultationSession", back_populates="doctor")
    generated_reports = relationship("Report", back_populates="signed_by_user")
    appointments = relationship("Appointment", back_populates="doctor")
    
    def __repr__(self):
        return f"<User(id='{self.id}', role='{self.role}')>"
    
    def has_role(self, role: UserRole) -> bool:
        """Check if user has specific role."""
        return self.role == role.value
    
    def can_access_patient(self, patient_id: str) -> bool:
        """Check if user can access specific patient data."""
        if self.role == UserRole.ADMIN.value:
            return True
        
        # Doctors can access patients they've created or treated
        if self.role == UserRole.DOCTOR.value:
            # This would need to check consultation history
            return True
        
        # Receptionists have limited access
        if self.role == UserRole.RECEPTIONIST.value:
            return True  # Can view for scheduling
        
        return False
    
    def is_account_locked(self) -> bool:
        """Check if account is currently locked."""
        if not self.is_locked:
            return False
        
        if self.locked_until and self.locked_until > datetime.now(timezone.utc):
            return True
        
        # Auto-unlock expired locks
        if self.locked_until and self.locked_until <= datetime.now(timezone.utc):
            self.is_locked = False
            self.locked_until = None
            return False
        
        return self.is_locked


class UserProfile(BaseModel):
    """
    User profile model for storing personal information.
    All PII fields are encrypted.
    """
    __tablename__ = "user_profiles"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, unique=True)
    
    # Personal information (encrypted)
    first_name = Column(EncryptedType(100), nullable=False)
    last_name = Column(EncryptedType(100), nullable=False)
    phone = Column(EncryptedType(20), nullable=True)
    
    # Professional information (for doctors)
    license_number = Column(EncryptedType(50), nullable=True)
    specialization = Column(EncryptedType(100), nullable=True)
    organization = Column(EncryptedType(200), nullable=True)
    
    # Clinic/Practice information (for practitioner profiles)
    clinic_name = Column(EncryptedType(255), nullable=True)
    clinic_address = Column(Text, nullable=True)  # Can be long, stored as text
    
    # Address (encrypted)
    address_line1 = Column(EncryptedType(255), nullable=True)
    address_line2 = Column(EncryptedType(255), nullable=True)
    city = Column(EncryptedType(100), nullable=True)
    state = Column(EncryptedType(100), nullable=True)
    postal_code = Column(EncryptedType(20), nullable=True)
    country = Column(EncryptedType(100), nullable=True)
    
    # Preferences and settings
    timezone = Column(String(50), default="UTC", nullable=False)
    language = Column(String(10), default="en", nullable=False)
    notification_preferences = Column(Text, nullable=True)  # JSON stored as text
    
    # Profile metadata
    avatar_url = Column(String(500), nullable=True)
    logo_url = Column(String(500), nullable=True)  # Professional logo for reports
    bio = Column(Text, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="profile")
    
    def __repr__(self):
        return f"<UserProfile(user_id='{self.user_id}')>"
    
    @property
    def full_name(self) -> str:
        """Get decrypted full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def display_name(self) -> str:
        """Get display name with title for doctors."""
        if hasattr(self.user, 'role') and self.user.role == UserRole.DOCTOR.value:
            return f"Dr. {self.full_name}"
        return self.full_name
