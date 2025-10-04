"""
Base Pydantic models with automatic snake_case to camelCase conversion.

This module provides base classes that automatically convert Python snake_case
field names to JavaScript camelCase when serializing to JSON, eliminating the
need for manual field mapping in the frontend.

Example:
    class UserResponse(CamelCaseModel):
        user_id: str        # Serializes as "userId"
        full_name: str      # Serializes as "fullName"
        created_at: str     # Serializes as "createdAt"
"""

from pydantic import BaseModel, ConfigDict
from humps import camelize


def to_camel(string: str) -> str:
    """
    Convert snake_case to camelCase.
    
    Args:
        string: Snake case string (e.g., "user_id")
    
    Returns:
        Camel case string (e.g., "userId")
    """
    return camelize(string)


class CamelCaseModel(BaseModel):
    """
    Base Pydantic model that automatically converts snake_case to camelCase.
    
    Usage:
        class UserResponse(CamelCaseModel):
            user_id: str        # Will serialize as "userId"
            full_name: str      # Will serialize as "fullName"
            created_at: str     # Will serialize as "createdAt"
    
    The model accepts both formats in requests (snake_case and camelCase)
    but always returns camelCase in responses.
    
    Configuration:
        - alias_generator: Converts field names to camelCase in JSON output
        - populate_by_name: Allows both snake_case and camelCase in input
        - by_alias: Uses aliases (camelCase) when serializing to JSON
    
    Example transformation:
        Python field: user_id -> JSON field: userId
        Python field: created_at -> JSON field: createdAt
        Python field: is_active -> JSON field: isActive
    """
    
    model_config = ConfigDict(
        # Convert field names to camelCase in JSON output
        alias_generator=to_camel,
        
        # Allow both snake_case and camelCase in input
        populate_by_name=True,
        
        # Use aliases (camelCase) when serializing to JSON
        by_alias=True,
        
        # Allow ORM models to be converted
        from_attributes=True
    )


class SnakeCaseModel(BaseModel):
    """
    Base model that keeps snake_case (for internal use only).
    Use CamelCaseModel for all API responses.
    
    This is useful for internal data structures that don't need
    to be exposed to the frontend.
    """
    
    model_config = ConfigDict(
        populate_by_name=True,
        from_attributes=True
    )
