"""
Practitioner profile management endpoints.
Handles doctor profile information and logo uploads for session reports.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Request, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Annotated, Optional, Dict, Any
from datetime import datetime, timezone
import os
import uuid
import shutil
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.audit import audit_logger, AuditEventType
from app.core.rate_limit import limiter
from app.models.user import User, UserProfile
from app.schemas.profile import (
    PractitionerProfileRead, 
    PractitionerProfileUpdate,
    PractitionerProfileUpdateResponse
)

router = APIRouter()

# Configuration
UPLOAD_DIR = Path("./static/logos")
MAX_UPLOAD_SIZE = 5 * 1024 * 1024  # 5MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp"}


def ensure_upload_dir():
    """Ensure upload directory exists."""
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file."""
    # Check file extension
    file_ext = Path(file.filename).suffix.lower() if file.filename else ""
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type not allowed. Accepted formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Check MIME type
    if file.content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Invalid file type. Please upload a valid image file."
        )
    
    return True


def save_upload_file(file: UploadFile, user_id: str) -> str:
    """Save uploaded file and return the URL path."""
    ensure_upload_dir()
    
    # Generate unique filename
    file_ext = Path(file.filename).suffix.lower() if file.filename else ".jpg"
    unique_filename = f"{user_id}_{uuid.uuid4().hex}_{int(datetime.now().timestamp())}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    try:
        # Save file
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Return relative URL path
        return f"/static/logos/{unique_filename}"
    
    except Exception as e:
        # Clean up partial file if exists
        if file_path.exists():
            file_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )


def delete_old_logo(logo_url: Optional[str]):
    """Delete old logo file if it exists."""
    if logo_url and logo_url.startswith("/static/logos/"):
        try:
            file_path = Path(".") / logo_url.lstrip("/")
            if file_path.exists():
                file_path.unlink()
        except Exception:
            # Silently fail - not critical if old file can't be deleted
            pass


@router.get("/", response_model=PractitionerProfileRead)
async def get_practitioner_profile(
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get current practitioner's profile information.
    Returns comprehensive profile data including clinic information.
    """
    try:
        # Get user
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
        
        # Build response
        return PractitionerProfileRead(
            id=user.id,
            email=user.email,
            first_name=profile.first_name,
            last_name=profile.last_name,
            full_name=f"{profile.first_name} {profile.last_name}",
            clinic_name=profile.clinic_name,
            clinic_address=profile.clinic_address,
            phone=profile.phone,
            license_number=profile.license_number,
            specialization=profile.specialization,
            logo_url=profile.logo_url,
            avatar_url=profile.avatar_url,
            updated_at=profile.updated_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.put("/", response_model=PractitionerProfileUpdateResponse)
async def update_practitioner_profile(
    request: Request,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
    first_name: Optional[str] = Form(None),
    last_name: Optional[str] = Form(None),
    clinic_name: Optional[str] = Form(None),
    clinic_address: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    license_number: Optional[str] = Form(None),
    specialization: Optional[str] = Form(None),
    logo: Optional[UploadFile] = File(None)
):
    """
    Update practitioner profile with optional logo upload.
    Accepts multipart/form-data for file uploads.
    """
    try:
        # Get user
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
        
        # Store original values for audit
        original_values = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "clinic_name": profile.clinic_name,
            "clinic_address": profile.clinic_address,
            "phone": profile.phone,
            "license_number": profile.license_number,
            "specialization": profile.specialization,
            "logo_url": profile.logo_url
        }
        
        # Handle logo upload
        new_logo_url = None
        if logo:
            # Validate file size
            logo.file.seek(0, 2)  # Seek to end
            file_size = logo.file.tell()
            logo.file.seek(0)  # Reset to beginning
            
            if file_size > MAX_UPLOAD_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail=f"File too large. Maximum size is {MAX_UPLOAD_SIZE / 1024 / 1024}MB"
                )
            
            # Validate file type
            validate_image_file(logo)
            
            # Save new logo
            new_logo_url = save_upload_file(logo, current_user_id)
            
            # Delete old logo
            delete_old_logo(profile.logo_url)
            
            # Update logo URL
            profile.logo_url = new_logo_url
        
        # Update profile fields
        if first_name is not None:
            profile.first_name = first_name.strip()
        if last_name is not None:
            profile.last_name = last_name.strip()
        if clinic_name is not None:
            profile.clinic_name = clinic_name.strip() if clinic_name.strip() else None
        if clinic_address is not None:
            profile.clinic_address = clinic_address.strip() if clinic_address.strip() else None
        if phone is not None:
            profile.phone = phone.strip() if phone.strip() else None
        if license_number is not None:
            profile.license_number = license_number.strip() if license_number.strip() else None
        if specialization is not None:
            profile.specialization = specialization.strip() if specialization.strip() else None
        
        # Update timestamp
        profile.updated_at = datetime.now(timezone.utc)
        
        # Commit changes
        db.commit()
        db.refresh(profile)
        
        # Prepare new values for audit
        new_values = {
            "first_name": profile.first_name,
            "last_name": profile.last_name,
            "clinic_name": profile.clinic_name,
            "clinic_address": profile.clinic_address,
            "phone": profile.phone,
            "license_number": profile.license_number,
            "specialization": profile.specialization,
            "logo_url": profile.logo_url
        }
        
        # Audit log
        await audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATED,
            user_id=current_user_id,
            resource_type="practitioner_profile",
            resource_id=profile.id,
            ip_address=request.client.host if request.client else "unknown",
            before_values=original_values,
            after_values=new_values,
            details={
                "action": "profile_update",
                "logo_updated": new_logo_url is not None
            }
        )
        
        # Build response
        profile_data = PractitionerProfileRead(
            id=user.id,
            email=user.email,
            first_name=profile.first_name,
            last_name=profile.last_name,
            full_name=f"{profile.first_name} {profile.last_name}",
            clinic_name=profile.clinic_name,
            clinic_address=profile.clinic_address,
            phone=profile.phone,
            license_number=profile.license_number,
            specialization=profile.specialization,
            logo_url=profile.logo_url,
            avatar_url=profile.avatar_url,
            updated_at=profile.updated_at
        )
        
        return PractitionerProfileUpdateResponse(
            success=True,
            message="Profile updated successfully",
            data=profile_data
        )
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        await audit_logger.log_event(
            event_type=AuditEventType.SYSTEM_ERROR,
            user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            details={"error": str(e), "endpoint": "/profile"}
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update profile: {str(e)}"
        )


@router.post("/complete", response_model=Dict[str, Any])
@limiter.limit("10/minute")  # Rate limit: 10 profile completion attempts per minute
async def complete_profile(
    request: Request,
    qualifications: str = Form(...),
    clinic_name: str = Form(...),
    clinic_address: str = Form(...),
    phone: str = Form(...),
    logo: Optional[UploadFile] = File(None),
    digital_signature: UploadFile = File(...),
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Complete doctor profile after first login.
    
    This endpoint handles the mandatory profile completion workflow for newly verified doctors.
    It accepts multipart form data with file uploads for logo and digital signature.
    
    Args:
        qualifications: Doctor credentials (e.g., "MBBS, DPM")
        clinic_name: Name of clinic/practice
        clinic_address: Full clinic address
        phone: Contact phone number
        logo: Clinic logo image file (optional)
        digital_signature: Doctor's signature image file (required)
        current_user_id: Current authenticated user ID
        db: Database session
    
    Returns:
        Profile completion response with updated profile data
    
    Raises:
        HTTPException: If user not found, not a doctor, profile already completed, or upload fails
    """
    from app.models.doctor_profile import DoctorProfile
    from app.models.audit_log import AuditLog, AuditEventType
    from app.services.file_upload_service import get_file_upload_service
    from app.core.dependencies import require_doctor
    
    try:
        # Validate input fields
        if not qualifications or not qualifications.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "VALIDATION_ERROR",
                    "message": "Qualifications are required",
                    "field": "qualifications"
                }
            )
        
        if not clinic_name or not clinic_name.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "VALIDATION_ERROR",
                    "message": "Clinic name is required",
                    "field": "clinic_name"
                }
            )
        
        if not clinic_address or not clinic_address.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "VALIDATION_ERROR",
                    "message": "Clinic address is required",
                    "field": "clinic_address"
                }
            )
        
        if not phone or not phone.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "VALIDATION_ERROR",
                    "message": "Phone number is required",
                    "field": "phone"
                }
            )
        
        # Get user and verify role
        user = db.query(User).filter(User.id == current_user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "USER_NOT_FOUND",
                    "message": "User not found"
                }
            )
        
        # Verify user is a doctor
        if user.role != "doctor":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={
                    "error": "FORBIDDEN",
                    "message": "Only doctors can complete profile"
                }
            )
        
        # Get doctor profile
        doctor_profile = db.query(DoctorProfile).filter(DoctorProfile.user_id == current_user_id).first()
        if not doctor_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "error": "PROFILE_NOT_FOUND",
                    "message": "Doctor profile not found"
                }
            )
        
        # Check if profile already completed
        if doctor_profile.profile_completed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "PROFILE_ALREADY_COMPLETED",
                    "message": "Profile has already been completed"
                }
            )
        
        # Get user profile
        user_profile = db.query(UserProfile).filter(UserProfile.user_id == current_user_id).first()
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Get file upload service
        file_service = get_file_upload_service()
        
        # Upload digital signature (required)
        signature_url = await file_service.upload_file(
            file=digital_signature,
            user_id=current_user_id,
            file_type='signature'
        )
        
        # Upload logo (optional)
        logo_url = None
        if logo:
            logo_url = await file_service.upload_file(
                file=logo,
                user_id=current_user_id,
                file_type='logo'
            )
        
        # Update DoctorProfile
        doctor_profile.qualifications = qualifications.strip()
        doctor_profile.digital_signature_url = signature_url
        doctor_profile.profile_completed = True
        
        # Update UserProfile
        user_profile.clinic_name = clinic_name.strip()
        user_profile.clinic_address = clinic_address.strip()
        user_profile.phone = phone.strip()
        if logo_url:
            user_profile.logo_url = logo_url
        
        # Update timestamps
        doctor_profile.updated_at = datetime.now(timezone.utc)
        user_profile.updated_at = datetime.now(timezone.utc)
        
        # Commit changes
        db.commit()
        db.refresh(doctor_profile)
        db.refresh(user_profile)
        
        # Create audit log entry
        AuditLog.log_event(
            db_session=db,
            event_type=AuditEventType.PROFILE_COMPLETED,
            doctor_user_id=current_user_id,
            ip_address=request.client.host if request.client else "unknown",
            user_agent=request.headers.get("user-agent", "unknown"),
            details={
                "qualifications": qualifications,
                "clinic_name": clinic_name,
                "signature_uploaded": True,
                "logo_uploaded": logo_url is not None
            }
        )
        db.commit()
        
        # Build response
        profile_data = PractitionerProfileRead(
            id=user.id,
            email=user.email,
            first_name=user_profile.first_name,
            last_name=user_profile.last_name,
            full_name=f"{user_profile.first_name} {user_profile.last_name}",
            clinic_name=user_profile.clinic_name,
            clinic_address=user_profile.clinic_address,
            phone=user_profile.phone,
            license_number=user_profile.license_number,
            specialization=user_profile.specialization,
            logo_url=user_profile.logo_url,
            avatar_url=user_profile.avatar_url,
            updated_at=user_profile.updated_at
        )
        
        return {
            "message": "Profile completed successfully. You can now access the dashboard.",
            "profile_completed": True,
            "profile": profile_data.model_dump()
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        # Log error
        try:
            AuditLog.log_event(
                db_session=db,
                event_type="profile_completion_failed",
                doctor_user_id=current_user_id,
                ip_address=request.client.host if request.client else "unknown",
                user_agent=request.headers.get("user-agent", "unknown"),
                details={"error": str(e)}
            )
            db.commit()
        except:
            pass
        
        logger.error(f"Profile completion error for user {current_user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "PROFILE_COMPLETION_FAILED",
                "message": "Failed to complete profile. Please try again.",
                "retry": True
            }
        )
