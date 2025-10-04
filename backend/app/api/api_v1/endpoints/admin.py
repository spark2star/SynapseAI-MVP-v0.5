"""
Admin endpoints for doctor application management.
Requires admin role for all operations.
"""

from fastapi import APIRouter, Depends, Query, Request
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.admin_service import AdminService
from app.schemas.doctor import (
    DoctorApplicationListResponse,
    DoctorApplicationDetailResponse,
    DoctorApprovalRequest,
    DoctorApprovalResponse,
    DoctorRejectionRequest,
    DoctorRejectionResponse
)
from app.schemas.base import CamelCaseModel

router = APIRouter()


class SuccessResponse(CamelCaseModel):
    """Generic success response wrapper."""
    status: str = "success"
    data: dict


@router.get("/applications", response_model=SuccessResponse)
async def list_doctor_applications(
    request: Request,
    status: Optional[str] = Query(None, description="Filter by status: pending, verified, rejected"),
    limit: int = Query(20, ge=1, le=100, description="Number of results per page"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    List all doctor applications with optional filtering.
    
    **Admin only endpoint.**
    
    Query Parameters:
    - status: Filter by application status (pending, verified, rejected)
    - limit: Number of results to return (1-100, default 20)
    - offset: Number of results to skip (for pagination)
    
    Returns:
    - List of doctor applications
    - Pagination metadata
    - Applied filters
    """
    admin_service = AdminService(db)
    result = await admin_service.list_doctor_applications(
        admin_user_id=current_user_id,
        status_filter=status,
        limit=limit,
        offset=offset
    )
    
    return SuccessResponse(data=result)


@router.get("/applications/{doctor_id}", response_model=SuccessResponse)
async def get_application_details(
    doctor_id: str,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get detailed information about a specific doctor application.
    
    **Admin only endpoint.**
    
    Path Parameters:
    - doctor_id: ID of the doctor user
    
    Returns:
    - Complete application details
    - Doctor profile information
    - Audit history (last 10 events)
    """
    admin_service = AdminService(db)
    result = await admin_service.get_application_details(
        admin_user_id=current_user_id,
        doctor_user_id=doctor_id
    )
    
    return SuccessResponse(data=result)


@router.post("/applications/{doctor_id}/approve", response_model=SuccessResponse)
async def approve_doctor_application(
    doctor_id: str,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Approve a doctor application.
    
    **Admin only endpoint.**
    
    Actions performed:
    1. Update doctor status to 'verified'
    2. Activate doctor account
    3. Generate temporary password
    4. Send approval email with credentials
    5. Log approval action in audit log
    
    Path Parameters:
    - doctor_id: ID of the doctor user to approve
    
    Returns:
    - Success message
    - Doctor ID and email
    - Confirmation that temporary password was sent
    """
    admin_service = AdminService(db)
    
    # Get IP address from request
    ip_address = request.client.host if request.client else "unknown"
    
    result = await admin_service.approve_doctor(
        admin_user_id=current_user_id,
        doctor_user_id=doctor_id,
        ip_address=ip_address
    )
    
    return SuccessResponse(data=result)


@router.post("/applications/{doctor_id}/reject", response_model=SuccessResponse)
async def reject_doctor_application(
    doctor_id: str,
    rejection_data: DoctorRejectionRequest,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Reject a doctor application with a reason.
    
    **Admin only endpoint.**
    
    Actions performed:
    1. Update doctor status to 'rejected'
    2. Deactivate doctor account
    3. Record rejection reason
    4. Send rejection email
    5. Log rejection action in audit log
    
    Path Parameters:
    - doctor_id: ID of the doctor user to reject
    
    Request Body:
    - rejection_reason: Detailed reason for rejection (10-1000 characters)
    
    Returns:
    - Success message
    - Doctor ID
    - Confirmation that rejection email was sent
    """
    admin_service = AdminService(db)
    
    # Get IP address from request
    ip_address = request.client.host if request.client else "unknown"
    
    result = await admin_service.reject_doctor(
        admin_user_id=current_user_id,
        doctor_user_id=doctor_id,
        rejection_reason=rejection_data.rejection_reason,
        ip_address=ip_address
    )
    
    return SuccessResponse(data=result)

