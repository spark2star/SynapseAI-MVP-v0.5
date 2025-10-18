from pydantic import Field
from typing import List, Optional
from datetime import datetime
from app.schemas.base import CamelCaseModel


class MedicationBase(CamelCaseModel):
    """Base medication schema with core fields."""
    name: str = Field(..., min_length=1, max_length=255)
    generic_name: Optional[str] = Field(None, max_length=255)
    common_dosages: Optional[List[str]] = Field(default_factory=list)


class MedicationCreate(MedicationBase):
    """Schema for creating new medications."""
    pass


class MedicationResponse(MedicationBase):
    """Schema for medication API responses."""
    id: str
    created_at: datetime
    updated_at: datetime
