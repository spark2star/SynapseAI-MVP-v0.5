"""
Pagination utility for consistent pagination across all list endpoints.

This module provides:
- PaginationParams: Standard query parameters for pagination
- PaginationMetadata: Metadata included in all paginated responses
- PaginatedResponse: Generic response wrapper
- paginate_query: Helper function to apply pagination to SQLAlchemy queries
"""

from typing import TypeVar, Generic, List, Optional, Callable, Dict, Any
from pydantic import BaseModel, Field
from sqlalchemy.orm import Query
import math

T = TypeVar('T')


class PaginationParams(BaseModel):
    """Standard pagination parameters for all endpoints"""
    limit: int = Field(20, ge=1, le=100, description="Number of items per page")
    offset: int = Field(0, ge=0, description="Number of items to skip")
    
    @property
    def page(self) -> int:
        """Calculate current page number (1-indexed)"""
        return (self.offset // self.limit) + 1


class PaginationMetadata(BaseModel):
    """Pagination metadata included in all responses"""
    total: int = Field(..., description="Total number of items")
    limit: int = Field(..., description="Items per page")
    offset: int = Field(..., description="Items skipped")
    has_more: bool = Field(..., description="Whether more items exist")
    current_page: int = Field(..., description="Current page number (1-indexed)")
    total_pages: int = Field(..., description="Total number of pages")


class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response wrapper"""
    items: List[T]
    pagination: PaginationMetadata


def paginate_query(
    query: Query,
    limit: int,
    offset: int,
    transform_fn: Optional[Callable] = None
) -> Dict[str, Any]:
    """
    Apply pagination to SQLAlchemy query and return standardized response.
    
    Args:
        query: SQLAlchemy query object
        limit: Number of items per page
        offset: Number of items to skip
        transform_fn: Optional function to transform each item before returning
    
    Returns:
        Dictionary with 'items' and 'pagination' keys
        
    Example:
        query = db.query(Patient).filter(Patient.doctor_id == user_id)
        result = paginate_query(query, limit=20, offset=0)
        # Returns: {
        #   "items": [...],
        #   "pagination": {
        #     "total": 100,
        #     "limit": 20,
        #     "offset": 0,
        #     "has_more": true,
        #     "current_page": 1,
        #     "total_pages": 5
        #   }
        # }
    """
    # Get total count before applying pagination
    total = query.count()
    
    # Apply pagination
    items = query.limit(limit).offset(offset).all()
    
    # Transform items if function provided
    if transform_fn:
        items = [transform_fn(item) for item in items]
    
    # Calculate pagination metadata
    total_pages = math.ceil(total / limit) if total > 0 else 0
    current_page = (offset // limit) + 1
    has_more = (offset + limit) < total
    
    return {
        "items": items,
        "pagination": {
            "total": total,
            "limit": limit,
            "offset": offset,
            "has_more": has_more,
            "current_page": current_page,
            "total_pages": total_pages
        }
    }

