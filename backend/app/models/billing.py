"""
Billing and payment models.
Handles invoice generation, payment tracking, and billing management.
"""

from sqlalchemy import Column, String, ForeignKey, Text, Boolean, Float
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from enum import Enum
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

from .base import BaseModel, EncryptedType


class BillStatus(str, Enum):
    """Bill status options."""
    PENDING = "pending"
    SENT = "sent"
    PARTIALLY_PAID = "partially_paid"
    PAID = "paid"
    OVERDUE = "overdue"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class BillType(str, Enum):
    """Bill type options."""
    NEW_PATIENT = "new_patient"
    FOLLOWUP = "followup"
    CONSULTATION = "consultation"
    EMERGENCY = "emergency"
    TELEMEDICINE = "telemedicine"
    PROCEDURE = "procedure"


class PaymentMethod(str, Enum):
    """Payment method options."""
    CASH = "cash"
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    CHECK = "check"
    BANK_TRANSFER = "bank_transfer"
    INSURANCE = "insurance"
    UPI = "upi"
    DIGITAL_WALLET = "digital_wallet"


class Bill(BaseModel):
    """
    Billing model for managing patient invoices and payments.
    Handles billing lifecycle from generation to payment completion.
    """
    __tablename__ = "bills"
    
    # Relationships
    session_id = Column(String(36), ForeignKey("consultation_sessions.id"), nullable=True)
    patient_id = Column(String(36), ForeignKey("patients.id"), nullable=False)
    appointment_id = Column(String(36), ForeignKey("appointments.id"), nullable=True)
    
    # Bill identification
    bill_number = Column(String(50), unique=True, nullable=False)  # Human-readable bill number
    bill_type = Column(String(20), nullable=False, default=BillType.CONSULTATION.value)
    status = Column(String(20), nullable=False, default=BillStatus.PENDING.value)
    
    # Financial information (encrypted)
    subtotal = Column(EncryptedType(20), nullable=False)  # Base amount before taxes/discounts
    tax_amount = Column(EncryptedType(20), nullable=False, default="0.00")
    discount_amount = Column(EncryptedType(20), nullable=False, default="0.00")
    total_amount = Column(EncryptedType(20), nullable=False)  # Final amount
    paid_amount = Column(EncryptedType(20), nullable=False, default="0.00")
    outstanding_amount = Column(EncryptedType(20), nullable=False)
    
    # Currency and locale
    currency = Column(String(3), nullable=False, default="INR")
    tax_rate = Column(String(10), nullable=False, default="0.00")  # Encrypted tax rate percentage
    
    # Billing details
    bill_date = Column(String(50), nullable=False)  # ISO format date
    due_date = Column(String(50), nullable=False)  # Payment due date
    payment_terms = Column(String(100), nullable=True)  # e.g., "Net 30"
    
    # Line items (services/procedures)
    line_items = Column(JSONB, nullable=False)  # List of billable items
    
    # Medical coding
    primary_diagnosis_code = Column(String(20), nullable=True)  # ICD-10 code
    procedure_codes = Column(JSONB, nullable=True)  # List of CPT codes
    
    # Insurance information (encrypted)
    insurance_claim_number = Column(EncryptedType(100), nullable=True)
    insurance_provider = Column(EncryptedType(200), nullable=True)
    insurance_covered_amount = Column(EncryptedType(20), nullable=True)
    patient_responsibility = Column(EncryptedType(20), nullable=True)
    copay_amount = Column(EncryptedType(20), nullable=True)
    deductible_amount = Column(EncryptedType(20), nullable=True)
    
    # Payment tracking
    payment_history = Column(JSONB, nullable=True)  # List of payment transactions
    last_payment_date = Column(String(50), nullable=True)
    payment_method = Column(String(20), nullable=True)
    
    # Notes and communication
    notes = Column(EncryptedType(2000), nullable=True)
    internal_notes = Column(Text, nullable=True)  # Non-encrypted internal notes
    payment_instructions = Column(EncryptedType(1000), nullable=True)
    
    # Reminder and collection
    reminder_sent_count = Column(String(10), nullable=False, default="0")
    last_reminder_sent = Column(String(50), nullable=True)
    collection_status = Column(String(20), nullable=True)
    
    # Generation and processing
    generated_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    generated_at = Column(String(50), nullable=False)
    processed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    processed_at = Column(String(50), nullable=True)
    
    # Export and document generation
    pdf_url = Column(String(500), nullable=True)  # GCS URL to PDF invoice
    exported_formats = Column(JSONB, nullable=True)  # List of exported formats
    
    # Relationships
    session = relationship("ConsultationSession", back_populates="bills")
    patient = relationship("Patient", back_populates="bills")
    appointment = relationship("Appointment")
    generated_by_user = relationship("User", foreign_keys=[generated_by])
    processed_by_user = relationship("User", foreign_keys=[processed_by])
    
    def __init__(self, **kwargs):
        """Initialize bill with automatic bill number generation."""
        super().__init__(**kwargs)
        if not self.bill_number:
            self.bill_number = self._generate_bill_number()
        if not self.bill_date:
            self.bill_date = datetime.utcnow().isoformat()
        if not self.due_date:
            # Default to 30 days from bill date
            due_date = datetime.utcnow() + timedelta(days=30)
            self.due_date = due_date.isoformat()
    
    def _generate_bill_number(self) -> str:
        """Generate unique bill number."""
        from datetime import datetime
        now = datetime.utcnow()
        # Format: INV-YYYYMM-XXXXXX (where X is sequential)
        prefix = f"INV-{now.strftime('%Y%m')}"
        # In production, this should query the database for the last sequential number
        import random
        sequential = f"{random.randint(100000, 999999):06d}"
        return f"{prefix}-{sequential}"
    
    def __repr__(self):
        return f"<Bill(bill_number='{self.bill_number}', status='{self.status}')>"
    
    @property
    def is_overdue(self) -> bool:
        """Check if bill is overdue."""
        if self.status in [BillStatus.PAID.value, BillStatus.CANCELLED.value, BillStatus.REFUNDED.value]:
            return False
        
        try:
            due_date = datetime.fromisoformat(self.due_date.replace('Z', '+00:00'))
            return datetime.now(due_date.tzinfo) > due_date
        except (ValueError, TypeError):
            return False
    
    @property
    def days_overdue(self) -> int:
        """Calculate days overdue."""
        if not self.is_overdue:
            return 0
        
        try:
            due_date = datetime.fromisoformat(self.due_date.replace('Z', '+00:00'))
            delta = datetime.now(due_date.tzinfo) - due_date
            return delta.days
        except (ValueError, TypeError):
            return 0
    
    @property
    def is_fully_paid(self) -> bool:
        """Check if bill is fully paid."""
        try:
            total = float(self.total_amount)
            paid = float(self.paid_amount)
            return abs(total - paid) < 0.01  # Account for floating point precision
        except (ValueError, TypeError):
            return False
    
    def get_bill_summary(self) -> Dict[str, Any]:
        """Get bill summary for API responses."""
        return {
            "id": self.id,
            "bill_number": self.bill_number,
            "patient_id": self.patient_id,
            "session_id": self.session_id,
            "bill_type": self.bill_type,
            "status": self.status,
            "total_amount": float(self.total_amount),
            "paid_amount": float(self.paid_amount),
            "outstanding_amount": float(self.outstanding_amount),
            "currency": self.currency,
            "bill_date": self.bill_date,
            "due_date": self.due_date,
            "is_overdue": self.is_overdue,
            "days_overdue": self.days_overdue,
            "is_fully_paid": self.is_fully_paid,
            "payment_method": self.payment_method,
            "last_payment_date": self.last_payment_date,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def get_full_bill(self) -> Dict[str, Any]:
        """Get full bill data for detailed view."""
        return {
            "id": self.id,
            "bill_number": self.bill_number,
            "patient_id": self.patient_id,
            "session_id": self.session_id,
            "appointment_id": self.appointment_id,
            "bill_type": self.bill_type,
            "status": self.status,
            "subtotal": float(self.subtotal),
            "tax_amount": float(self.tax_amount),
            "tax_rate": float(self.tax_rate),
            "discount_amount": float(self.discount_amount),
            "total_amount": float(self.total_amount),
            "paid_amount": float(self.paid_amount),
            "outstanding_amount": float(self.outstanding_amount),
            "currency": self.currency,
            "bill_date": self.bill_date,
            "due_date": self.due_date,
            "payment_terms": self.payment_terms,
            "line_items": self.line_items,
            "primary_diagnosis_code": self.primary_diagnosis_code,
            "procedure_codes": self.procedure_codes,
            "insurance_claim_number": self.insurance_claim_number,
            "insurance_provider": self.insurance_provider,
            "insurance_covered_amount": float(self.insurance_covered_amount) if self.insurance_covered_amount else None,
            "patient_responsibility": float(self.patient_responsibility) if self.patient_responsibility else None,
            "copay_amount": float(self.copay_amount) if self.copay_amount else None,
            "deductible_amount": float(self.deductible_amount) if self.deductible_amount else None,
            "payment_history": self.payment_history,
            "notes": self.notes,
            "payment_instructions": self.payment_instructions,
            "generated_by": self.generated_by,
            "generated_at": self.generated_at,
            "pdf_url": self.pdf_url,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
    
    def add_payment(self, amount: float, payment_method: str, transaction_id: Optional[str] = None, notes: Optional[str] = None):
        """Add a payment to the bill."""
        # Update paid amount
        current_paid = float(self.paid_amount)
        new_paid = current_paid + amount
        self.paid_amount = str(new_paid)
        
        # Update outstanding amount
        total = float(self.total_amount)
        self.outstanding_amount = str(max(0, total - new_paid))
        
        # Update payment history
        payment_record = {
            "amount": amount,
            "payment_method": payment_method,
            "transaction_id": transaction_id,
            "payment_date": datetime.utcnow().isoformat(),
            "notes": notes
        }
        
        if self.payment_history is None:
            self.payment_history = []
        self.payment_history.append(payment_record)
        
        # Update payment tracking fields
        self.last_payment_date = payment_record["payment_date"]
        self.payment_method = payment_method
        
        # Update status
        if self.is_fully_paid:
            self.status = BillStatus.PAID.value
        elif new_paid > 0:
            self.status = BillStatus.PARTIALLY_PAID.value
    
    def calculate_totals(self):
        """Calculate bill totals from line items."""
        if not self.line_items:
            return
        
        subtotal = sum(item.get("amount", 0) for item in self.line_items)
        tax_rate = float(self.tax_rate)
        discount = float(self.discount_amount)
        
        # Calculate tax on subtotal minus discount
        taxable_amount = subtotal - discount
        tax_amount = taxable_amount * (tax_rate / 100)
        
        total = subtotal + tax_amount - discount
        
        self.subtotal = str(subtotal)
        self.tax_amount = str(tax_amount)
        self.total_amount = str(total)
        self.outstanding_amount = str(total - float(self.paid_amount))
    
    @classmethod
    def get_default_line_items(cls, bill_type: str, consultation_duration: Optional[int] = None) -> List[Dict[str, Any]]:
        """Get default line items based on bill type."""
        if bill_type == BillType.NEW_PATIENT.value:
            return [
                {
                    "description": "New Patient Consultation",
                    "quantity": 1,
                    "unit_price": 1000.00,
                    "amount": 1000.00,
                    "cpt_code": "99201"
                }
            ]
        elif bill_type == BillType.FOLLOWUP.value:
            return [
                {
                    "description": "Follow-up Consultation",
                    "quantity": 1,
                    "unit_price": 500.00,
                    "amount": 500.00,
                    "cpt_code": "99213"
                }
            ]
        else:
            return [
                {
                    "description": "General Consultation",
                    "quantity": 1,
                    "unit_price": 750.00,
                    "amount": 750.00,
                    "cpt_code": "99214"
                }
            ]
