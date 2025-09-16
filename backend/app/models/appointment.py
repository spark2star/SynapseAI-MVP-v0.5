"""
Appointment scheduling model.
Handles patient appointments and scheduling management.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

from .base import BaseModel, EncryptedType


class AppointmentStatus(str, Enum):
    """Appointment status options."""
    SCHEDULED = "scheduled"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    RESCHEDULED = "rescheduled"
    COMPLETED = "completed"
    NO_SHOW = "no_show"


class AppointmentType(str, Enum):
    """Appointment type options."""
    NEW_PATIENT = "new_patient"
    FOLLOWUP = "followup"
    CONSULTATION = "consultation"
    EMERGENCY = "emergency"
    TELEMEDICINE = "telemedicine"


class AppointmentPriority(str, Enum):
    """Appointment priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Appointment(BaseModel):
    """
    Appointment model for scheduling patient visits.
    Handles appointment lifecycle and related information.
    """
    __tablename__ = "appointments"
    
    # Relationships
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Scheduling information
    scheduled_datetime = Column(String(50), nullable=False)  # ISO format timestamp
    duration_minutes = Column(String(10), nullable=False, default="30")  # Encrypted duration
    timezone = Column(String(50), nullable=False, default="UTC")
    
    # Appointment details
    appointment_type = Column(String(20), nullable=False, default=AppointmentType.CONSULTATION.value)
    status = Column(String(20), nullable=False, default=AppointmentStatus.SCHEDULED.value)
    priority = Column(String(10), nullable=False, default=AppointmentPriority.NORMAL.value)
    
    # Appointment information (encrypted)
    chief_complaint = Column(EncryptedType(500), nullable=True)
    notes = Column(EncryptedType(1000), nullable=True)
    preparation_instructions = Column(EncryptedType(1000), nullable=True)
    
    # Contact and reminder settings
    reminder_sent = Column(Boolean, default=False)
    reminder_datetime = Column(String(50), nullable=True)
    confirmation_required = Column(Boolean, default=True)
    confirmed_at = Column(String(50), nullable=True)
    confirmed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    
    # Cancellation/Rescheduling
    cancelled_at = Column(String(50), nullable=True)
    cancelled_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    cancellation_reason = Column(EncryptedType(500), nullable=True)
    
    rescheduled_from = Column(String(36), ForeignKey("appointments.id"), nullable=True)
    rescheduled_to = Column(String(36), ForeignKey("appointments.id"), nullable=True)
    reschedule_reason = Column(EncryptedType(500), nullable=True)
    
    # Completion information
    completed_at = Column(String(50), nullable=True)
    session_id = Column(String(36), ForeignKey("consultation_sessions.id"), nullable=True)
    
    # Additional metadata
    location = Column(String(200), nullable=True)  # Room number, clinic location
    appointment_metadata = Column(JSONB, nullable=True)  # Additional structured data
    
    # Billing information
    estimated_cost = Column(String(20), nullable=True)  # Encrypted cost estimate
    insurance_verified = Column(Boolean, default=False)
    copay_amount = Column(String(20), nullable=True)  # Encrypted copay
    
    # Relationships
    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("User", back_populates="appointments")
    confirmed_by_user = relationship("User", foreign_keys=[confirmed_by])
    cancelled_by_user = relationship("User", foreign_keys=[cancelled_by])
    session = relationship("ConsultationSession")
    
    # Self-referential relationships for rescheduling
    rescheduled_from_appointment = relationship("Appointment", remote_side="Appointment.id", foreign_keys=[rescheduled_from])
    rescheduled_to_appointment = relationship("Appointment", remote_side="Appointment.id", foreign_keys=[rescheduled_to])
    
    def __repr__(self):
        return f"<Appointment(id='{self.id}', patient_id='{self.patient_id}', status='{self.status}')>"
    
    @property
    def is_upcoming(self) -> bool:
        """Check if appointment is in the future."""
        try:
            appointment_dt = datetime.fromisoformat(self.scheduled_datetime.replace('Z', '+00:00'))
            return appointment_dt > datetime.now(appointment_dt.tzinfo)
        except (ValueError, TypeError):
            return False
    
    @property
    def is_today(self) -> bool:
        """Check if appointment is today."""
        try:
            appointment_dt = datetime.fromisoformat(self.scheduled_datetime.replace('Z', '+00:00'))
            today = datetime.now(appointment_dt.tzinfo).date()
            return appointment_dt.date() == today
        except (ValueError, TypeError):
            return False
    
    @property
    def is_overdue(self) -> bool:
        """Check if appointment is overdue."""
        if self.status != AppointmentStatus.SCHEDULED.value:
            return False
        
        try:
            appointment_dt = datetime.fromisoformat(self.scheduled_datetime.replace('Z', '+00:00'))
            duration_mins = int(self.duration_minutes)
            appointment_end = appointment_dt + timedelta(minutes=duration_mins)
            return appointment_end < datetime.now(appointment_dt.tzinfo)
        except (ValueError, TypeError):
            return False
    
    def get_appointment_summary(self) -> Dict[str, Any]:
        """Get appointment summary for API responses."""
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "scheduled_datetime": self.scheduled_datetime,
            "duration_minutes": int(self.duration_minutes),
            "appointment_type": self.appointment_type,
            "status": self.status,
            "priority": self.priority,
            "chief_complaint": self.chief_complaint,
            "location": self.location,
            "confirmation_required": self.confirmation_required,
            "confirmed_at": self.confirmed_at,
            "reminder_sent": self.reminder_sent,
            "is_upcoming": self.is_upcoming,
            "is_today": self.is_today,
            "is_overdue": self.is_overdue,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def get_full_appointment(self) -> Dict[str, Any]:
        """Get full appointment data for detailed view."""
        return {
            "id": self.id,
            "patient_id": self.patient_id,
            "doctor_id": self.doctor_id,
            "scheduled_datetime": self.scheduled_datetime,
            "duration_minutes": int(self.duration_minutes),
            "timezone": self.timezone,
            "appointment_type": self.appointment_type,
            "status": self.status,
            "priority": self.priority,
            "chief_complaint": self.chief_complaint,
            "notes": self.notes,
            "preparation_instructions": self.preparation_instructions,
            "location": self.location,
            "confirmation_required": self.confirmation_required,
            "confirmed_at": self.confirmed_at,
            "confirmed_by": self.confirmed_by,
            "reminder_sent": self.reminder_sent,
            "reminder_datetime": self.reminder_datetime,
            "cancelled_at": self.cancelled_at,
            "cancelled_by": self.cancelled_by,
            "cancellation_reason": self.cancellation_reason,
            "rescheduled_from": self.rescheduled_from,
            "rescheduled_to": self.rescheduled_to,
            "reschedule_reason": self.reschedule_reason,
            "completed_at": self.completed_at,
            "session_id": self.session_id,
            "estimated_cost": float(self.estimated_cost) if self.estimated_cost else None,
            "insurance_verified": self.insurance_verified,
            "copay_amount": float(self.copay_amount) if self.copay_amount else None,
            "appointment_metadata": self.appointment_metadata,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
    
    def cancel_appointment(self, cancelled_by_user_id: str, reason: Optional[str] = None):
        """Cancel the appointment."""
        self.status = AppointmentStatus.CANCELLED.value
        self.cancelled_at = datetime.utcnow().isoformat()
        self.cancelled_by = cancelled_by_user_id
        if reason:
            self.cancellation_reason = reason
    
    def confirm_appointment(self, confirmed_by_user_id: str):
        """Confirm the appointment."""
        self.status = AppointmentStatus.CONFIRMED.value
        self.confirmed_at = datetime.utcnow().isoformat()
        self.confirmed_by = confirmed_by_user_id
    
    def complete_appointment(self, session_id: Optional[str] = None):
        """Mark appointment as completed."""
        self.status = AppointmentStatus.COMPLETED.value
        self.completed_at = datetime.utcnow().isoformat()
        if session_id:
            self.session_id = session_id
    
    def reschedule_appointment(self, new_datetime: str, reason: Optional[str] = None) -> "Appointment":
        """
        Reschedule appointment by creating a new appointment.
        Returns the new appointment object.
        """
        # Mark current appointment as rescheduled
        self.status = AppointmentStatus.RESCHEDULED.value
        
        # Create new appointment
        new_appointment = Appointment(
            patient_id=self.patient_id,
            doctor_id=self.doctor_id,
            scheduled_datetime=new_datetime,
            duration_minutes=self.duration_minutes,
            timezone=self.timezone,
            appointment_type=self.appointment_type,
            priority=self.priority,
            chief_complaint=self.chief_complaint,
            notes=self.notes,
            preparation_instructions=self.preparation_instructions,
            location=self.location,
            confirmation_required=self.confirmation_required,
            estimated_cost=self.estimated_cost,
            insurance_verified=self.insurance_verified,
            copay_amount=self.copay_amount,
            rescheduled_from=self.id,
            reschedule_reason=reason
        )
        
        # Link appointments
        self.rescheduled_to = new_appointment.id
        
        return new_appointment
