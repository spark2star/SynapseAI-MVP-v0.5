from sqlalchemy import Column, String, DateTime, Text
from sqlalchemy.sql import func
from .base import BaseModel


class ContactSubmission(BaseModel):
    """
    Contact form submission model for landing page inquiries
    """
    __tablename__ = "contact_submissions"

    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)
    source = Column(String(100), default="landing_page")
    ip_address = Column(String(45), nullable=True)  # IPv6 compatible
    user_agent = Column(Text, nullable=True)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ContactSubmission(name='{self.name}', email='{self.email}', subject='{self.subject[:50]}...')>"

