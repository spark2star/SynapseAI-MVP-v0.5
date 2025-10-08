"""
Base Pydantic models with camelCase conversion.
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Any


def to_camel(string: str) -> str:
    """Convert snake_case to camelCase"""
    components = string.split('_')
    return components[0] + ''.join(x.title() for x in components[1:])


class CamelCaseModel(BaseModel):
    """
    Base model that automatically converts snake_case to camelCase.
    Also handles timezone-aware datetime serialization.
    """
    
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        # Use json_encoders for datetime serialization
        json_encoders={
            datetime: lambda v: v.isoformat() if v else None
        }
    )
