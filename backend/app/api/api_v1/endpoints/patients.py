"""
Patient management endpoints.
Handles patient CRUD operations with encryption and audit logging.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Annotated
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    get_current_user_id, require_any_role, require_role, rate_limit_check
)
from app.core.audit import audit_logger, AuditEventType, log_patient_access
from app.services.patient_service import get_patient_service, PatientService
from app.schemas.patient import (
    PatientCreate, PatientUpdate, PatientSearch, 
    PatientResponse, PatientDetailResponse, PatientSummaryResponse,
    PatientListResponse, PatientHistoryResponse, PatientSearchResponse
)

router = APIRouter()


@router.post("/create", response_model=Dict[str, Any])
async def create_patient(
    patient_data: PatientCreate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)],
    __: None = Depends(rate_limit_check)
):
    """
    Create new patient record.
    All demographic data is encrypted for privacy protection.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Create patient
        patient = await patient_service.create_patient(
            patient_data=patient_data,
            created_by_user_id=current_user_id,
            ip_address=client_ip
        )
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient.patient_id,
                "id": patient.id,
                "full_name": patient.full_name,
                "message": "Patient created successfully"
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/patients/create"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient creation service temporarily unavailable"
        )


@router.get("/{patient_id}", response_model=Dict[str, Any])
async def get_patient(
    patient_id: str,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    Get patient information by ID.
    Returns decrypted demographic data for authorized users.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Get patient
        patient = await patient_service.get_patient_by_id(
            patient_id=patient_id,
            user_id=current_user_id,
            ip_address=client_ip
        )
        
        # Convert to response format
        patient_detail = PatientDetailResponse(
            id=patient.id,
            patient_id=patient.patient_id,
            first_name=patient.first_name,
            last_name=patient.last_name,
            full_name=patient.full_name,
            date_of_birth=patient.date_of_birth,
            age=patient.age,
            gender=patient.gender,
            contact_info=patient.contact_info,
            emergency_contact=patient.emergency_contact,
            medical_summary=patient.medical_summary,
            insurance={
                "provider": patient.insurance_provider,
                "policy_number": patient.insurance_policy_number,
                "group_number": patient.insurance_group_number
            },
            created_by=patient.created_by,
            created_at=patient.created_at,
            updated_at=patient.updated_at,
            notes=patient.notes,
            tags=patient.tags
        )
        
        return {
            "status": "success",
            "data": {
                "patient": patient_detail.dict()
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": f"/patients/{patient_id}"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient retrieval service temporarily unavailable"
        )


@router.put("/{patient_id}", response_model=Dict[str, Any])
async def update_patient(
    patient_id: str,
    patient_data: PatientUpdate,
    request: Request,
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    Update patient information.
    Updates encrypted demographic data and search hashes.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Update patient
        patient = await patient_service.update_patient(
            patient_id=patient_id,
            patient_data=patient_data,
            user_id=current_user_id,
            ip_address=client_ip
        )
        
        return {
            "status": "success",
            "data": {
                "patient_id": patient.patient_id,
                "message": "Patient updated successfully",
                "updated_at": patient.updated_at.isoformat()
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": f"/patients/{patient_id}"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient update service temporarily unavailable"
        )


@router.get("/search/", response_model=Dict[str, Any])
async def search_patients(
    request: Request,
    query: str = Query(..., min_length=2, description="Search query (name, phone, or email)"),
    search_type: str = Query("name", regex="^(name|phone|email)$", description="Type of search"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    Search patients by name, phone, or email.
    Uses encrypted search hashes for privacy-preserving search.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Create search parameters
        search_params = PatientSearch(
            query=query,
            search_type=search_type,
            limit=limit,
            offset=offset
        )
        
        # Search patients
        patients, total_count = await patient_service.search_patients(
            search_params=search_params,
            user_id=current_user_id,
            ip_address=client_ip
        )
        
        # Convert to response format
        patient_summaries = []
        for patient in patients:
            summary = PatientSummaryResponse(
                id=patient.id,
                patient_id=patient.patient_id,
                full_name=patient.full_name,
                age=patient.age,
                gender=patient.gender,
                phone_primary=patient.phone_primary,
                last_visit=None,  # TODO: Get from consultation sessions
                created_at=patient.created_at
            )
            patient_summaries.append(summary.dict())
        
        return {
            "status": "success",
            "data": {
                "patients": patient_summaries,
                "total_count": total_count,
                "limit": limit,
                "offset": offset,
                "search_query": query,
                "search_type": search_type
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/patients/search"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient search service temporarily unavailable"
        )


@router.get("/list/", response_model=Dict[str, Any])
async def list_patients(
    request: Request,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    created_by: Optional[str] = Query(None, description="Filter by creator user ID"),
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor", "receptionist"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    List patients with pagination.
    Returns patient summaries (non-sensitive data).
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # List patients
        patients, total_count = await patient_service.list_patients(
            limit=limit,
            offset=offset,
            created_by=created_by,
            user_id=current_user_id,
            ip_address=client_ip
        )
        
        # Convert to response format
        patient_summaries = []
        for patient in patients:
            summary = PatientSummaryResponse(
                id=patient.id,
                patient_id=patient.patient_id,
                full_name=patient.full_name,
                age=patient.age,
                gender=patient.gender,
                phone_primary=patient.phone_primary,
                last_visit=None,  # TODO: Get from consultation sessions
                created_at=patient.created_at
            )
            patient_summaries.append(summary.dict())
        
        return {
            "status": "success",
            "data": {
                "patients": patient_summaries,
                "total_count": total_count,
                "limit": limit,
                "offset": offset
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/patients/list"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient list service temporarily unavailable"
        )


@router.get("/{patient_id}/history", response_model=Dict[str, Any])
async def get_patient_history(
    patient_id: str,
    request: Request,
    limit: int = Query(20, ge=1, le=50, description="Maximum number of sessions"),
    db: Annotated[Session, Depends(get_db)],
    current_user_id: Annotated[str, Depends(get_current_user_id)],
    _: Dict[str, Any] = Depends(require_any_role(["admin", "doctor"])),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    Get patient consultation history.
    Returns list of consultation sessions and reports.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        
        # Get patient history
        history = await patient_service.get_patient_history(
            patient_id=patient_id,
            user_id=current_user_id,
            ip_address=client_ip,
            limit=limit
        )
        
        return {
            "status": "success",
            "data": {
                "patient_id": history["patient"].patient_id,
                "patient_name": history["patient"].full_name,
                "consultation_sessions": history["consultation_sessions"],
                "reports": history["reports"],
                "bills": history["bills"],
                "total_sessions": history["total_sessions"]
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": f"/patients/{patient_id}/history"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient history service temporarily unavailable"
        )


@router.delete("/{patient_id}", response_model=Dict[str, Any])
async def delete_patient(
    patient_id: str,
    request: Request,
    reason: Optional[str] = Query(None, description="Reason for deletion"),
    db: Annotated[Session, Depends(get_db)],
    current_user_token: Dict[str, Any] = Depends(require_role("admin")),
    patient_service: Annotated[PatientService, Depends(get_patient_service)]
):
    """
    Delete patient record (admin only).
    This is a permanent operation and should be used with caution.
    """
    try:
        client_ip = request.client.host if request.client else "unknown"
        current_user_id = current_user_token.get("sub")
        
        # Delete patient
        result = await patient_service.delete_patient(
            patient_id=patient_id,
            user_id=current_user_id,
            ip_address=client_ip,
            reason=reason
        )
        
        return {
            "status": "success",
            "data": result,
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_token.get("sub"),
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": f"/patients/{patient_id}"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Patient deletion service temporarily unavailable"
        )