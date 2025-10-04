"""
Doctor registration and profile management endpoints.
"""

from fastapi import APIRouter, Depends, Request, HTTPException, status
from sqlalchemy.orm import Session
from typing import Dict, Any

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.auth_service import AuthenticationService
from app.schemas.doctor import (
    DoctorRegistrationRequest,
    DoctorRegistrationResponse,
    DoctorProfileUpdateRequest
)
from app.schemas.base import CamelCaseModel

router = APIRouter()


class SuccessResponse(CamelCaseModel):
    """Generic success response wrapper."""
    status: str = "success"
    data: dict


@router.post("/register", response_model=SuccessResponse)
async def register_doctor(
    registration_data: DoctorRegistrationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Register a new doctor for verification.
    
    **Public endpoint** - No authentication required.
    
    Request Body:
    - full_name: Doctor's full name (3-255 characters)
    - email: Valid email address
    - password: Strong password (min 8 chars, uppercase, number, special char)
    - medical_registration_number: Unique medical registration number (5-100 characters)
    - state_medical_council: State medical council (from predefined list)
    
    Password Requirements:
    - Minimum 8 characters
    - At least one uppercase letter
    - At least one number
    - At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)
    
    Process:
    1. Validates all input data
    2. Checks for duplicate medical registration number
    3. Checks for duplicate email
    4. Creates user account (role=doctor, status=pending, inactive)
    5. Creates doctor profile
    6. Queues confirmation email
    7. Logs registration event
    
    Returns:
    - Success message
    - Application ID (for tracking)
    - Expected review timeline
    - Next steps information
    
    Note: Account will be inactive until admin approves the application.
    You will receive an email once your application is reviewed.
    """
    auth_service = AuthenticationService(db)
    
    # Get IP address from request
    ip_address = request.client.host if request.client else "unknown"
    
    result = await auth_service.register_doctor(
        registration_data=registration_data,
        ip_address=ip_address
    )
    
    return SuccessResponse(data=result)


@router.put("/profile", response_model=SuccessResponse)
async def update_doctor_profile(
    profile_data: DoctorProfileUpdateRequest,
    current_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Complete or update doctor profile information.
    
    **Requires authentication** - Doctor role only.
    
    Request Body:
    - clinic_name: Name of the clinic (required)
    - clinic_address: Full clinic address (required)
    - specializations: List of specializations (required, at least one)
    - years_of_experience: Years of practice (required, >= 0)
    - phone_number: Contact phone number (required)
    - alternate_email: Alternate email address (optional)
    
    Process:
    1. Validates user is a doctor with 'verified' status
    2. Updates doctor profile with provided information
    3. Marks profile as completed
    4. Returns updated profile data
    
    Returns:
    - Success message
    - Updated profile information
    - Profile completion status
    """
    from app.models.user import User
    from app.models.doctor_profile import DoctorProfile
    
    # Get user and verify role
    user = db.query(User).filter(User.id == current_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user.role != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only doctors can update doctor profiles"
        )
    
    if user.doctor_status != "verified":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account must be verified before completing your profile"
        )
    
    # Get doctor profile
    doctor_profile = db.query(DoctorProfile).filter(
        DoctorProfile.user_id == current_user_id
    ).first()
    
    if not doctor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Doctor profile not found"
        )
    
    # Update profile fields
    doctor_profile.clinic_name = profile_data.clinic_name
    doctor_profile.clinic_address = profile_data.clinic_address
    doctor_profile.specializations = profile_data.specializations
    doctor_profile.years_of_experience = profile_data.years_of_experience
    doctor_profile.phone_number = profile_data.phone_number
    doctor_profile.alternate_email = profile_data.alternate_email
    doctor_profile.profile_completed = True
    
    db.commit()
    db.refresh(doctor_profile)
    
    return SuccessResponse(data={
        "message": "Profile updated successfully",
        "profile_completed": True,
        "clinic_name": doctor_profile.clinic_name,
        "specializations": doctor_profile.specializations
    })
