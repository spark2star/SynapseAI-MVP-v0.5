"""
Staff Management Endpoints
Handles receptionist invitation and onboarding workflow.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import logging
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user, require_doctor
from app.core.security import get_password_hash, jwt_manager
from app.models.user import User, UserRole
from app.models.staff_invitation import StaffInvitation
from app.schemas.staff import (
    StaffInviteRequest, StaffInviteResponse,
    AcceptInviteRequest, AcceptInviteResponse,
    StaffMemberResponse, InvitationStatusResponse
)
from app.services.email_service import EmailService

logger = logging.getLogger(__name__)
router = APIRouter()
email_service = EmailService()


@router.post("/invite", response_model=StaffInviteResponse)
async def invite_staff(
    request: StaffInviteRequest,
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    Invite a receptionist to join the clinic.
    Only accessible by doctors.
    
    Creates a secure invitation token and sends an email to the recipient.
    """
    try:
        # Check if user with this email already exists
        existing_user = db.query(User).filter(
            User.email_hash == User.hash_email(request.email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email already exists"
            )
        
        # Check if there's already a pending invitation
        existing_invitation = db.query(StaffInvitation).filter(
            StaffInvitation.recipient_email == request.email.lower(),
            StaffInvitation.inviter_id == current_user.id
        ).first()
        
        if existing_invitation and not existing_invitation.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An active invitation already exists for this email"
            )
        
        # Delete expired invitations for this email
        if existing_invitation and existing_invitation.is_expired():
            db.delete(existing_invitation)
            db.commit()
        
        # Create new invitation
        invitation = StaffInvitation(
            inviter_id=current_user.id,
            recipient_email=request.email.lower()
        )
        
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        
        # Send invitation email
        from app.core.config import settings
        invitation_url = f"{settings.FRONTEND_URL}/invite/{invitation.token}"
        
        # Get doctor's name for email
        doctor_name = "the clinic"
        if current_user.profile:
            doctor_name = f"Dr. {current_user.profile.first_name} {current_user.profile.last_name}"
        
        email_sent = email_service.send_staff_invitation_email(
            to_email=request.email,
            doctor_name=doctor_name,
            invitation_url=invitation_url,
            expires_at=invitation.expires_at
        )
        
        if not email_sent:
            logger.warning(f"Failed to send invitation email to {request.email}")
        
        logger.info(f"Staff invitation created by doctor {current_user.id} for {request.email}")
        
        return StaffInviteResponse(
            message="Invitation sent successfully",
            invitation_id=str(invitation.id),
            recipient_email=invitation.recipient_email,
            expires_at=invitation.expires_at
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating staff invitation: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create invitation"
        )


@router.get("/invite/{token}/status", response_model=InvitationStatusResponse)
async def check_invitation_status(
    token: str,
    db: Session = Depends(get_db)
):
    """
    Check if an invitation token is valid.
    Public endpoint for the invitation acceptance page.
    """
    invitation = db.query(StaffInvitation).filter(
        StaffInvitation.token == token
    ).first()
    
    if not invitation:
        return InvitationStatusResponse(
            valid=False,
            expired=False,
            message="Invalid invitation token"
        )
    
    if invitation.is_expired():
        return InvitationStatusResponse(
            valid=False,
            expired=True,
            recipient_email=invitation.recipient_email,
            message="This invitation has expired"
        )
    
    # Get inviter information
    inviter = db.query(User).filter(User.id == invitation.inviter_id).first()
    inviter_name = None
    clinic_name = None
    
    if inviter and inviter.profile:
        # EncryptedType columns are automatically decrypted when accessed
        try:
            first_name = inviter.profile.first_name if inviter.profile.first_name else ""
            last_name = inviter.profile.last_name if inviter.profile.last_name else ""
            inviter_name = f"Dr. {first_name} {last_name}".strip() if first_name or last_name else "Doctor"
            clinic_name = inviter.profile.clinic_name if inviter.profile.clinic_name else None
        except Exception as e:
            logger.warning(f"Error accessing inviter profile: {str(e)}")
            inviter_name = "Doctor"
    
    return InvitationStatusResponse(
        valid=True,
        expired=False,
        recipient_email=invitation.recipient_email,
        inviter_name=inviter_name,
        clinic_name=clinic_name,
        message="Valid invitation"
    )


@router.post("/accept-invite/{token}", response_model=AcceptInviteResponse)
async def accept_invitation(
    token: str,
    request: AcceptInviteRequest,
    db: Session = Depends(get_db)
):
    """
    Accept a staff invitation and create a receptionist account.
    Public endpoint - no authentication required.
    """
    try:
        # Find and validate invitation
        invitation = db.query(StaffInvitation).filter(
            StaffInvitation.token == token
        ).first()
        
        if not invitation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invitation token"
            )
        
        if invitation.is_expired():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired. Please request a new one."
            )
        
        # Check if user already exists
        existing_user = db.query(User).filter(
            User.email_hash == User.hash_email(invitation.recipient_email)
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists"
            )
        
        # Create new receptionist user
        # Note: EncryptedType columns handle encryption automatically
        new_user = User(
            email=invitation.recipient_email,  # EncryptedType handles encryption
            email_hash=User.hash_email(invitation.recipient_email),
            password_hash=get_password_hash(request.password),
            role=UserRole.RECEPTIONIST.value,
            invited_by_id=invitation.inviter_id,
            is_verified=True,  # Auto-verify invited users
            is_active=True
        )
        
        db.add(new_user)
        db.flush()  # Get the user ID
        
        # Create user profile with short placeholder values
        # Receptionist can update their name later in profile settings
        from app.models.user import UserProfile
        profile = UserProfile(
            user_id=new_user.id,
            first_name="Staff",  # Short value to avoid encryption length issues
            last_name="Member"  # Short value to avoid encryption length issues
        )
        
        db.add(profile)
        
        # Delete the invitation token (single-use)
        db.delete(invitation)
        
        db.commit()
        db.refresh(new_user)
        
        # Generate JWT tokens for immediate login
        access_token = jwt_manager.create_access_token(
            data={"sub": new_user.id, "role": new_user.role}
        )
        refresh_token = jwt_manager.create_refresh_token(
            data={"sub": new_user.id, "role": new_user.role}
        )
        
        logger.info(f"Receptionist account created: {new_user.id} (invited by {invitation.inviter_id})")
        
        return AcceptInviteResponse(
            message="Account created successfully",
            user_id=str(new_user.id),
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accepting invitation: {str(e)}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create account"
        )


@router.get("/list", response_model=List[StaffMemberResponse])
async def list_staff_members(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    List all staff members (receptionists) invited by the current doctor.
    Only accessible by doctors.
    """
    try:
        staff_members = db.query(User).filter(
            User.invited_by_id == current_user.id,
            User.role == UserRole.RECEPTIONIST.value
        ).all()
        
        # EncryptedType columns are automatically decrypted when accessed
        result = []
        for staff in staff_members:
            try:
                email = staff.email if staff.email else "N/A"
                first_name = staff.profile.first_name if staff.profile and staff.profile.first_name else None
                last_name = staff.profile.last_name if staff.profile and staff.profile.last_name else None
                
                result.append(StaffMemberResponse(
                    id=str(staff.id),
                    email=email,
                    first_name=first_name,
                    last_name=last_name,
                    role=staff.role,
                    is_active=staff.is_active,
                    created_at=staff.created_at,
                    invited_by_id=staff.invited_by_id
                ))
            except Exception as access_error:
                logger.warning(f"Error accessing staff member {staff.id}: {str(access_error)}")
                # Skip this staff member if access fails
                continue
        
        return result
    
    except Exception as e:
        logger.error(f"Error listing staff members: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve staff members"
        )


@router.get("/pending-invitations")
async def list_pending_invitations(
    current_user: User = Depends(require_doctor),
    db: Session = Depends(get_db)
):
    """
    List all pending (non-expired) invitations sent by the current doctor.
    """
    try:
        invitations = db.query(StaffInvitation).filter(
            StaffInvitation.inviter_id == current_user.id
        ).all()
        
        # Filter out expired invitations
        pending = [
            {
                "id": str(inv.id),
                "recipient_email": inv.recipient_email,
                "created_at": inv.created_at,
                "expires_at": inv.expires_at,
                "expired": inv.is_expired()
            }
            for inv in invitations
            if not inv.is_expired()
        ]
        
        return {
            "status": "success",
            "data": pending,
            "count": len(pending)
        }
    
    except Exception as e:
        logger.error(f"Error listing pending invitations: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve pending invitations"
        )
