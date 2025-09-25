from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.sql import func
from .base import BaseModel


class NewsletterSubscription(BaseModel):
    """
    Newsletter subscription model for landing page email collection
    """
    __tablename__ = "newsletter_subscriptions"

    email = Column(String(255), unique=True, index=True, nullable=False)
    source = Column(String(100), default="landing_page")
    is_active = Column(Boolean, default=True)
    subscribed_at = Column(DateTime(timezone=True), server_default=func.now())
    unsubscribed_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<NewsletterSubscription(email='{self.email}', source='{self.source}', active={self.is_active})>"

