"""
Base model classes with encryption support.
Implements encrypted field types for privacy by design.
"""

from sqlalchemy import Column, String, DateTime, Text, event, MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.types import TypeDecorator, VARCHAR
from sqlalchemy.sql import func
from datetime import datetime, timezone
import uuid
from typing import Any, Optional

from app.core.encryption import db_encryption

# Use a shared MetaData with naming conventions to keep Alembic diffs stable
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

Base = declarative_base(metadata=MetaData(naming_convention=convention))


class EncryptedType(TypeDecorator):
    """
    Encrypted field type that automatically encrypts/decrypts data.
    """
    impl = VARCHAR
    cache_ok = True
    
    def process_bind_param(self, value: Any, dialect) -> Optional[str]:
        """Encrypt value before storing in database."""
        if value is not None:
            return db_encryption.encrypt_field(str(value))
        return value
    
    def process_result_value(self, value: Optional[str], dialect) -> Optional[str]:
        """Decrypt value when retrieving from database."""
        if value is not None:
            return db_encryption.decrypt_field(value)
        return value


class BaseModel(Base):
    """
    Base model class with common fields and methods.
    """
    __abstract__ = True
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    def to_dict(self, exclude_encrypted: bool = True) -> dict:
        """Convert model to dictionary, optionally excluding encrypted fields."""
        result = {}
        for column in self.__table__.columns:
            value = getattr(self, column.name)
            
            # Handle encrypted fields
            if isinstance(column.type, EncryptedType) and exclude_encrypted:
                result[column.name] = "[ENCRYPTED]"
            elif isinstance(value, datetime):
                result[column.name] = value.isoformat()
            else:
                result[column.name] = value
        
        return result
    
    def update_from_dict(self, data: dict):
        """Update model from dictionary data."""
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        
        self.updated_at = datetime.now(timezone.utc)


# Event listeners for audit logging
@event.listens_for(BaseModel, 'after_insert', propagate=True)
def receive_after_insert(mapper, connection, target):
    """Log model creation for audit."""
    # This will be handled by the audit middleware
    pass


@event.listens_for(BaseModel, 'after_update', propagate=True)
def receive_after_update(mapper, connection, target):
    """Log model updates for audit."""
    # This will be handled by the audit middleware
    pass


@event.listens_for(BaseModel, 'after_delete', propagate=True)  
def receive_after_delete(mapper, connection, target):
    """Log model deletion for audit."""
    # This will be handled by the audit middleware
    pass
