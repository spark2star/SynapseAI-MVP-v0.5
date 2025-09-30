"""
User management endpoints.
Handles user CRUD operations and profile management.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, Query
from sqlalchemy.orm import Session
from typing import Annotated
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.security import (
    get_current_user_id, require_role, require_any_role
)
from app.core.audit import audit_logger, AuditEventType
from app.models.user import User, UserProfile
from app.schemas.user import (
    UserResponse, UserProfileResponse, UserDetailResponse, 
    UserUpdate, UserListResponse
)
from app.services.auth_service import get_auth_service, AuthenticationService

router = APIRouter()


@router.get("/profile", response_model=Dict[str, Any])
async def get_user_profile(
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current user's profile information.
    """
    try:
        # Get user with profile
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Get profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Convert to response schemas
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
        profile_response = UserProfileResponse(
            id=profile.id,
            user_id=profile.user_id,
            first_name=profile.first_name,
            last_name=profile.last_name,
            phone=profile.phone,
            license_number=profile.license_number,
            specialization=profile.specialization,
            timezone=profile.timezone,
            language=profile.language,
            created_at=profile.created_at,
            updated_at=profile.updated_at
        )
        
        return {
            "status": "success",
            "data": {
                "user": user_response.dict(),
                "profile": profile_response.dict()
            },
            "metadata": {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1.0"
            }
        }
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user profile"
        )


@router.put("/profile", response_model=Dict[str, Any])
async def update_user_profile(
    profile_data: UserUpdate,
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update current user's profile information.
    """
    try:
        # Get user profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Store original values for audit
        original_values = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "phone": profile.phone,
            "specialization": profile.specialization
        }
        
        # Update profile fields
        update_data = profile_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(profile, field) and value is not None:
                setattr(profile, field, value)
        
        profile.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(profile)
        
        # Prepare new values for audit
        new_values = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "phone": profile.phone,
            "specialization": profile.specialization
        }
        
        # Log profile update
        await audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATED,
            user_id=current_user_id,
            resource_type="user_profile",
            resource_id=profile.id,
            ip_address=request.client.host if request.client else "unknown",
            before_values=original_values,
            after_values=new_values,
            details={"action": "profile_update", "fields_updated": list(update_data.keys())}
        )
        
        return {
            "status": "success",
            "data": {
                "message": "Profile updated successfully",
                "updated_fields": list(update_data.keys())
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
            details={"error": str(e), "endpoint": "/users/profile"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.get("/list", response_model=Dict[str, Any])
async def list_users(
    request: Request,
    limit: int = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    role: Optional[str] = Query(None, description="Filter by user role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    db: Session = Depends(get_db),
    current_user_token: Dict[str, Any] = Depends(require_any_role(["admin", "doctor"]))
):
    """
    List all users (admin and doctors only).
    Supports filtering and pagination.
    """
    try:
        current_user_id = current_user_token.get("sub")
        current_user_role = current_user_token.get("role")
        
        # Build query
        query = db.query(User)
        
        # Apply filters
        if role:
            query = query.filter(User.role == role)
        
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        # Doctors can only see other doctors and receptionists (not admins)
        if current_user_role == "doctor":
            query = query.filter(User.role.in_(["doctor", "receptionist"]))
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply pagination
        users = query.offset(offset).limit(limit).all()
        
        # Convert to response format
        user_responses = []
        for user in users:
            user_response = UserResponse(
                id=user.id,
                email=user.email,
                role=user.role,
                is_verified=user.is_verified,
                is_active=user.is_active,
                created_at=user.created_at,
                updated_at=user.updated_at
            )
            user_responses.append(user_response.dict())
        
        # Log user list access
        await audit_logger.log_event(
            event_type=AuditEventType.USER_VIEWED,
            user_id=current_user_id,
            resource_type="user",
            ip_address=request.client.host if request.client else "unknown",
            details={
                "action": "user_list",
                "filters": {"role": role, "is_active": is_active},
                "limit": limit,
                "offset": offset,
                "results_count": len(user_responses)
            }
        )
        
        return {
            "status": "success",
            "data": {
                "users": user_responses,
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
            user_id=current_user_token.get("sub"),
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/users/list"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user list"
        )


@router.get("/{user_id}", response_model=Dict[str, Any])
async def get_user_by_id(
    user_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user_token: Dict[str, Any] = Depends(require_any_role(["admin", "doctor"]))
):
    """
    Get user by ID (admin and doctors only).
    Returns user and profile information.
    """
    try:
        current_user_id = current_user_token.get("sub")
        current_user_role = current_user_token.get("role")
        
        # Get user
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check permissions - doctors can't view admin users
        if current_user_role == "doctor" and user.role == "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions to view this user"
            )
        
        # Get profile
        profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
        
        # Convert to response format
        user_response = UserResponse(
            id=user.id,
            email=user.email,
            role=user.role,
            is_verified=user.is_verified,
            is_active=user.is_active,
            created_at=user.created_at,
            updated_at=user.updated_at
        )
        
        profile_response = None
        if profile:
            profile_response = UserProfileResponse(
                id=profile.id,
                user_id=profile.user_id,
                first_name=profile.first_name,
                last_name=profile.last_name,
                phone=profile.phone,
                license_number=profile.license_number,
                specialization=profile.specialization,
                timezone=profile.timezone,
                language=profile.language,
                created_at=profile.created_at,
                updated_at=profile.updated_at
            )
        
        # Log user access
        await audit_logger.log_event(
            event_type=AuditEventType.USER_VIEWED,
            user_id=current_user_id,
            resource_type="user",
            resource_id=user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"action": "user_detail_view"}
        )
        
        return {
            "status": "success",
            "data": {
                "user": user_response.dict(),
                "profile": profile_response.dict() if profile_response else None
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
            user_id=current_user_token.get("sub"),
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": f"/users/{user_id}"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user details"
        )