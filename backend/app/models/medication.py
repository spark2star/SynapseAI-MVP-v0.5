"""
Medication model for storing drug information and common dosages.
"""

from sqlalchemy import Column, String, JSON, Index
from app.models.base import BaseModel


class Medication(BaseModel):
    """
    Medication model for storing drug information and common dosages.
    Used for autocomplete functionality in medication prescriptions.
    """
    __tablename__ = "medications"
    
    # Medication name (brand or generic)
    name = Column(String(255), nullable=False, index=True)
    
    # Generic/scientific name (optional)
    generic_name = Column(String(255), nullable=True)
    
    # Array of common dosage strings (e.g., ["25mg", "50mg", "100mg"])
    common_dosages = Column(JSON, nullable=True)
    
    # Index for fast case-insensitive search
    __table_args__ = (
        Index('ix_medications_name_lower', 
              'name', 
              postgresql_ops={'name': 'text_pattern_ops'}),
    )
    
    def __repr__(self):
        return f"<Medication(id={self.id}, name={self.name})>"
