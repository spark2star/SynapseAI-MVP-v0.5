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
from pathlib import Path

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.core.audit import audit_logger, AuditEventType
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
