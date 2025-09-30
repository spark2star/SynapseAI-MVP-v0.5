"""
Billing and payment schemas for API validation and serialization.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime

from app.models.billing import BillStatus, BillType, PaymentMethod


# Base Schemas
class BillLineItem(BaseModel):
    """Schema for a single line item in a bill."""
    description: str = Field(..., min_length=1, max_length=500)
    quantity: int = Field(..., ge=1)
    unit_price: float = Field(..., ge=0)
    amount: float = Field(..., ge=0)
    cpt_code: Optional[str] = Field(None, max_length=20)
    
    @validator('amount')
    def calculate_amount(cls, v, values):
        """Validate that amount equals quantity * unit_price."""
        if 'quantity' in values and 'unit_price' in values:
            expected_amount = values['quantity'] * values['unit_price']
            if abs(v - expected_amount) > 0.01:  # Allow for floating point precision
                raise ValueError("Amount must equal quantity * unit_price")
        return v


class BillBase(BaseModel):
    """Base schema for bill."""
    patient_id: str
    session_id: Optional[str] = None
    appointment_id: Optional[str] = None
    bill_type: str = BillType.CONSULTATION.value
    line_items: List[BillLineItem] = Field(..., min_items=1)
    tax_rate: float = Field(0.0, ge=0, le=100)
    discount_amount: float = Field(0.0, ge=0)
    currency: str = Field("INR", min_length=3, max_length=3)


class BillCreate(BillBase):
    """Schema for creating a new bill."""
    payment_terms: Optional[str] = Field(None, max_length=100)
    due_days: int = Field(30, ge=0, le=365)
    notes: Optional[str] = Field(None, max_length=2000)
    payment_instructions: Optional[str] = Field(None, max_length=1000)
    primary_diagnosis_code: Optional[str] = Field(None, max_length=20)
    procedure_codes: Optional[List[str]] = None
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_policy_number: Optional[str] = Field(None, max_length=100)


class BillUpdate(BaseModel):
    """Schema for updating a bill (all fields optional)."""
    status: Optional[str] = None
    line_items: Optional[List[BillLineItem]] = None
    tax_rate: Optional[float] = Field(None, ge=0, le=100)
    discount_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = Field(None, max_length=2000)
    payment_instructions: Optional[str] = Field(None, max_length=1000)
    internal_notes: Optional[str] = None


class BillRead(BillBase):
    """Schema for reading bill data."""
    id: str
    bill_number: str
    status: str
    subtotal: float
    tax_amount: float
    total_amount: float
    paid_amount: float
    outstanding_amount: float
    bill_date: str
    due_date: str
    payment_terms: Optional[str] = None
    primary_diagnosis_code: Optional[str] = None
    procedure_codes: Optional[List[str]] = None
    insurance_claim_number: Optional[str] = None
    insurance_provider: Optional[str] = None
    insurance_covered_amount: Optional[float] = None
    patient_responsibility: Optional[float] = None
    copay_amount: Optional[float] = None
    deductible_amount: Optional[float] = None
    payment_history: Optional[List[Dict[str, Any]]] = None
    last_payment_date: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    payment_instructions: Optional[str] = None
    reminder_sent_count: int = 0
    last_reminder_sent: Optional[str] = None
    collection_status: Optional[str] = None
    generated_by: str
    generated_at: str
    processed_by: Optional[str] = None
    processed_at: Optional[str] = None
    pdf_url: Optional[str] = None
    exported_formats: Optional[List[str]] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payment Schemas
class PaymentCreate(BaseModel):
    """Schema for adding a payment to a bill."""
    amount: float = Field(..., gt=0, description="Payment amount")
    payment_method: str = Field(..., description="Payment method")
    transaction_id: Optional[str] = Field(None, max_length=100)
    payment_date: Optional[str] = None  # ISO format, defaults to now
    notes: Optional[str] = Field(None, max_length=500)
    
    @validator('payment_method')
    def validate_payment_method(cls, v):
        valid_methods = [m.value for m in PaymentMethod]
        if v not in valid_methods:
            raise ValueError(f"Payment method must be one of: {', '.join(valid_methods)}")
        return v


class PaymentRead(BaseModel):
    """Schema for reading payment data."""
    amount: float
    payment_method: str
    transaction_id: Optional[str] = None
    payment_date: str
    notes: Optional[str] = None


# Insurance Schemas
class InsuranceInfo(BaseModel):
    """Schema for insurance information."""
    insurance_provider: str = Field(..., max_length=200)
    insurance_policy_number: str = Field(..., max_length=100)
    insurance_group_number: Optional[str] = Field(None, max_length=100)
    insurance_claim_number: Optional[str] = Field(None, max_length=100)
    insurance_covered_amount: Optional[float] = Field(None, ge=0)
    patient_responsibility: Optional[float] = Field(None, ge=0)
    copay_amount: Optional[float] = Field(None, ge=0)
    deductible_amount: Optional[float] = Field(None, ge=0)


class InsuranceUpdate(BaseModel):
    """Schema for updating insurance information on a bill."""
    insurance_provider: Optional[str] = Field(None, max_length=200)
    insurance_claim_number: Optional[str] = Field(None, max_length=100)
    insurance_covered_amount: Optional[float] = Field(None, ge=0)
    patient_responsibility: Optional[float] = Field(None, ge=0)


# Response Schemas
class BillSummaryResponse(BaseModel):
    """Simplified bill summary for lists."""
    id: str
    bill_number: str
    patient_id: str
    bill_type: str
    status: str
    total_amount: float
    paid_amount: float
    outstanding_amount: float
    bill_date: str
    due_date: str
    is_overdue: bool
    days_overdue: int
    created_at: datetime

    class Config:
        from_attributes = True


class BillStatistics(BaseModel):
    """Schema for billing statistics."""
    total_bills: int
    total_revenue: float
    pending_amount: float
    overdue_amount: float
    paid_amount: float
    average_bill_amount: float
    bills_by_status: Dict[str, int]
    bills_by_type: Dict[str, int]
    currency: str = "INR"
