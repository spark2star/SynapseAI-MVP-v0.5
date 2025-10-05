"""
Demo Request Model
"""

from sqlalchemy import Column, String, Text, DateTime, Enum
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime, timezone
import enum

from app.core.database import Base


class DemoRequestStatus(str, enum.Enum):
    NEW = "new"
    CONTACTED = "contacted"
    SCHEDULED = "scheduled"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class DemoRequest(Base):
    __tablename__ = "demo_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Contact Info
    full_name = Column(String(255), nullable=False, index=True)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    organization = Column(String(255), nullable=True)
    job_title = Column(String(255), nullable=True)
    
    # Request Details
    message = Column(Text, nullable=True)
    preferred_date = Column(String(100), nullable=True)
    interested_features = Column(Text, nullable=True)
    
    # Status
    status = Column(Enum(DemoRequestStatus), default=DemoRequestStatus.NEW, nullable=False, index=True)
    
    # Metadata
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    
    # Admin
    admin_notes = Column(Text, nullable=True)
    contacted_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
