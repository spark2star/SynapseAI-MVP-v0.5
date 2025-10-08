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
    Includes last consultation session date.
    """
    request_id = str(uuid.uuid4())[:8]
    
    try:
        from sqlalchemy import func
        from app.models.session import ConsultationSession
        
        logger.info(
            f"[{request_id}] Patient list request - Doctor: {current_user_id}, "
            f"Limit: {limit}, Offset: {offset}, Search: {search}"
        )
        
        # Subquery to get last visit date for each patient
        last_visits = db.query(
            ConsultationSession.patient_id,
            func.max(ConsultationSession.created_at).label('last_visit')
        ).group_by(ConsultationSession.patient_id).subquery()
        
        # Base query with JOIN to get last_visit
        query = db.query(IntakePatient, last_visits.c.last_visit)\
            .outerjoin(last_visits, IntakePatient.id == last_visits.c.patient_id)\
            .filter(IntakePatient.doctor_id == current_user_id)
        
        # Add search filter if provided (with NULL safety)
        if search and len(search.strip()) > 0:
            search_pattern = f"%{search.strip()}%"
            query = query.filter(
                or_(
                    IntakePatient.name.ilike(search_pattern),
                    and_(
                        IntakePatient.phone.isnot(None),
                        IntakePatient.phone.ilike(search_pattern)
                    ),
                    # and_(
                    #     # IntakePatient.email.isnot(None),
                    #     IntakePatient.email.ilike(search_pattern)
                    # )
                )
            )
            logger.info(f"[{request_id}] Applied search filter: {search}")
        
        # Apply ordering
        query = query.order_by(IntakePatient.created_at.desc())
        
        # Get total count
        total_count = query.count()
        
        # Apply pagination
        results = query.offset(offset).limit(limit).all()
        
        # Transform function for patient data
        def transform_patient(row):
            p, last_visit = row
            return PatientResponse(
                id=str(p.id),
                name=p.name,
                age=p.age,
                sex=p.sex,
                phone=getattr(p, 'phone', '') or '',
                address=p.address or "",
                referred_by=p.referred_by or "",
                illness_duration=f"{p.illness_duration_value} {p.illness_duration_unit}" if p.illness_duration_value else "",
                created_at=p.created_at if p.created_at else datetime.utcnow(),
                updated_at=p.updated_at if p.updated_at else datetime.utcnow(),
                last_visit=last_visit  # ADD THIS LINE
            )
        
        # Transform results
        items = [transform_patient(row) for row in results]
        
        logger.info(
            f"[{request_id}] SUCCESS - Returned {len(items)} patients "
            f"(Total: {total_count})"
        )
        
        return {
            "status": "success",
            "data": {
                "items": items,
                "total": total_count,
                "limit": limit,
                "offset": offset,
                "has_more": (offset + limit) < total_count
            }
        }
        
    except Exception as e:
        logger.error(f"[{request_id}] FAILED - {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

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