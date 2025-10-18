"""
Medication search API endpoints.
Provides autocomplete functionality for medication prescriptions.
"""

from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from app.core.database import get_db
from app.models.medication import Medication
from app.schemas.medication import MedicationResponse

router = APIRouter()


@router.get("/search", response_model=List[MedicationResponse])
async def search_medications(
    q: str = Query(..., min_length=2, description="Search query (minimum 2 characters)"),
    db: Session = Depends(get_db)
):
    """
    Search medications by name (case-insensitive).
    
    Returns up to 10 matching results for autocomplete functionality.
    
    **Parameters:**
    - **q**: Search query string (minimum 2 characters)
    
    **Returns:**
    - List of matching medications with their common dosages
    
    **Example:**
    ```
    GET /medications/search?q=ser
    ```
    """
    try:
        # Case-insensitive ILIKE search
        search_pattern = f"%{q}%"
        medications = db.query(Medication)\
            .filter(func.lower(Medication.name).like(func.lower(search_pattern)))\
            .limit(10)\
            .all()
        
        return medications
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Search failed: {str(e)}")
