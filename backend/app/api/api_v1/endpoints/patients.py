"""
Patient Management Endpoints
MIGRATION: Uses IntakePatient model instead of encrypted Patient model
Last Updated: 2025-10-04
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from typing import Optional, List, Dict, Any
from datetime import datetime
import logging
import uuid

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.pagination import paginate_query
from app.schemas.patient import PatientResponse
from app.models.symptom import IntakePatient, PatientSymptom
from app.models.session import ConsultationSession

logger = logging.getLogger(__name__)
router = APIRouter()

# ============================================================================
# PATIENT LIST ENDPOINT (CRITICAL - FIXES 500 ERROR)
# ============================================================================

@router.get("/list/")
async def list_patients(
    limit: int = Query(20, le=100, ge=1, description="Number of patients to return"),
    offset: int = Query(0, ge=0, description="Number of patients to skip"),
    search: Optional[str] = Query(None, min_length=1, description="Search by name, phone, or email"),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all intake patients for the current doctor with pagination.
    
    Migration Note: Uses IntakePatient model to avoid encryption/decryption issues
    that were causing 500 errors in the original Patient model.
    
    Returns:
        - List of patient objects with demographics
        - Pagination metadata (total, limit, offset, has_more)
    
    Raises:
        - 401: Unauthorized (missing or invalid JWT token)
        - 500: Database query failed
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(
            f"[{request_id}] Patient list request - Doctor: {current_user_id}, "
            f"Limit: {limit}, Offset: {offset}, Search: {search}"
        )
        
        # Base query - filter by doctor
        query = db.query(IntakePatient).filter(
            IntakePatient.doctor_id == current_user_id
        )
        
        # Add search filter if provided
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    IntakePatient.name.ilike(search_pattern),
                    IntakePatient.phone.ilike(search_pattern),
                    IntakePatient.email.ilike(search_pattern)
                )
            )
            logger.info(f"[{request_id}] Applied search filter: {search}")
        
        # Apply ordering
        query = query.order_by(IntakePatient.created_at.desc())
        
        # Transform function for patient data - returns PatientResponse with auto camelCase
        def transform_patient(p):
            return PatientResponse(
                id=str(p.id),
                name=p.name,
                age=p.age,
                sex=p.sex,
                # phone=p.phone or "",
                phone=getattr(p, 'phone', '') or '',  # Safe access to phone field
                # email=p.email or "",
                address=p.address or "",
                referred_by=p.referred_by or "",
                illness_duration=f"{p.illness_duration_value} {p.illness_duration_unit}" if p.illness_duration_value else "",
                created_at=p.created_at if p.created_at else datetime.utcnow(),
                updated_at=p.updated_at if p.updated_at else datetime.utcnow()
            )
        
        # Use pagination helper
        result = paginate_query(query, limit, offset, transform_patient)
        
        logger.info(
            f"[{request_id}] SUCCESS - Returned {len(result['items'])} patients "
            f"(Total: {result['pagination']['total']}, Page: {result['pagination']['current_page']}/{result['pagination']['total_pages']})"
        )
        
        return {
            "status": "success",
            "data": result,
            "request_id": request_id
        }
    
    except Exception as e:
        logger.error(
            f"[{request_id}] ERROR listing patients for doctor {current_user_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to retrieve patient list",
                "request_id": request_id,
                "error_type": type(e).__name__
            }
        )

# ============================================================================
# GET SINGLE PATIENT
# ============================================================================

@router.get("/{patient_id}")
async def get_patient(
    patient_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get single intake patient by ID with associated symptoms.
    
    Security: Only returns patient if belongs to current doctor.
    
    Returns:
        - Full patient demographic data
        - List of associated symptoms with severity, frequency, duration
    
    Raises:
        - 404: Patient not found or access denied
        - 500: Database query failed
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        logger.info(f"[{request_id}] Fetching patient {patient_id} for doctor {current_user_id}")
        
        # Query with access control
        patient = db.query(IntakePatient).filter(
            IntakePatient.id == patient_id,
            IntakePatient.doctor_id == current_user_id
        ).first()
        
        if not patient:
            logger.warning(f"[{request_id}] Patient not found or access denied: {patient_id}")
        raise HTTPException(
                status_code=404,
                detail=f"Patient not found: {patient_id}"
            )
        
        # Get associated symptoms
        symptoms = db.query(PatientSymptom).filter(
            PatientSymptom.patient_id == patient_id
        ).all()
        
        logger.info(f"[{request_id}] SUCCESS - Found patient with {len(symptoms)} symptoms")
        
        return {
            "status": "success",
            "data": {
                "id": str(patient.id),
                "name": patient.name,
                "age": patient.age,
                "sex": patient.sex,
                "phone": patient.phone or "",
                "email": patient.email or "",
                "address": patient.address or "",
                "referred_by": patient.referred_by or "",
                "illness_duration": f"{patient.illness_duration_value} {patient.illness_duration_unit}" if patient.illness_duration_value else "",
                "informants": patient.informants or {},
                "precipitating_factor": {
                    "narrative": patient.precipitating_factor_narrative,
                    "tags": patient.precipitating_factor_tags or []
                } if patient.precipitating_factor_narrative else None,
                "symptoms": [
                    {
                        "symptom_name": s.symptom_name,
                        "severity": s.severity,
                        "frequency": s.frequency,
                        "duration": {
                            "value": s.duration_value,
                            "unit": s.duration_unit
                        },
                        "notes": s.notes
                    }
                    for s in symptoms
                ],
                "created_at": patient.created_at.isoformat() if patient.created_at else datetime.utcnow().isoformat(),
                "updated_at": patient.updated_at.isoformat() if patient.updated_at else datetime.utcnow().isoformat()
            },
            "request_id": request_id
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(
            f"[{request_id}] ERROR retrieving patient {patient_id}: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to retrieve patient",
                "request_id": request_id
            }
        )

# ============================================================================
# SEARCH PATIENTS
# ============================================================================

@router.get("/search/")
async def search_patients(
    q: str = Query(..., min_length=2, description="Search query (min 2 characters)"),
    limit: int = Query(10, le=50, ge=1),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Search patients by name, phone, or email.
    
    Use Case: Autocomplete, quick lookup during consultation start.
    
    Returns:
        - Abbreviated patient list (id, name, age, sex, phone only)
        - Count of results
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        search_pattern = f"%{q}%"
        
        logger.info(f"[{request_id}] Searching patients with query: {q}")
        
        patients = db.query(IntakePatient).filter(
            IntakePatient.doctor_id == current_user_id,
            or_(
                IntakePatient.name.ilike(search_pattern),
                IntakePatient.phone.ilike(search_pattern),
                IntakePatient.email.ilike(search_pattern)
            )
        ).limit(limit).all()
        
        logger.info(f"[{request_id}] SUCCESS - Found {len(patients)} matches")
        
        return {
            "status": "success",
            "data": {
                "patients": [
                    {
                        "id": str(p.id),
                        "name": p.name,
                        "age": p.age,
                        "sex": p.sex,
                        "phone": p.phone or ""
                    }
                    for p in patients
                ],
                "count": len(patients)
            },
            "request_id": request_id
        }
    
    except Exception as e:
        logger.error(
            f"[{request_id}] ERROR searching patients: {str(e)}",
            exc_info=True
        )
        raise HTTPException(
            status_code=500,
            detail={
                "message": "Failed to search patients",
                "request_id": request_id
            }
        )