"""
Admin service for managing doctor applications and verification.
Implements secure admin-only operations with comprehensive audit logging.
"""

from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional, Dict, Any, List
from datetime import datetime, timezone
import secrets
import logging
import uuid

from app.models.user import User, UserRole
from app.models.doctor_profile import DoctorProfile, DoctorStatus
from app.models.audit_log import AuditLog, AuditEventType
from app.models.email_queue import EmailQueue, EmailTemplate
from app.core.encryption import HashingUtility
from app.core.config import settings

logger = logging.getLogger(__name__)


class AdminService:
    """Service for admin operations - doctor verification and management."""
    
    def __init__(self, db: Session):
        self.db = db
        self.hash_util = HashingUtility()
    
    def _verify_admin_access(self, admin_user_id: str, request_id: str) -> User:
        """
        Verify that the user has admin access.
        
        Args:
            admin_user_id: ID of the user to verify
            request_id: Request ID for logging
            
        Returns:
            User: Admin user object
            
        Raises:
            HTTPException: If user is not found or not an admin
        """
        admin = self.db.query(User).filter(User.id == admin_user_id).first()
        
        if not admin:
            logger.warning(f"[{request_id}] ❌ User not found: {admin_user_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if admin.role != UserRole.ADMIN.value:
            logger.warning(f"[{request_id}] ❌ Unauthorized access attempt by non-admin: {admin_user_id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        return admin
    
    async def list_doctor_applications(
        self,
        admin_user_id: str,
        status_filter: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """
        List doctor applications with filtering and pagination.
        
        Args:
            admin_user_id: ID of the admin user making the request
            status_filter: Optional filter by status ('pending', 'verified', 'rejected')
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            Dict containing applications list and pagination metadata
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] 📋 Admin {admin_user_id} listing applications (status={status_filter})")
            
            # Verify admin access
            admin = self._verify_admin_access(admin_user_id, request_id)
            
            # Build query
            query = self.db.query(User).filter(User.role == UserRole.DOCTOR.value)
            
            if status_filter:
                if status_filter not in [s.value for s in DoctorStatus]:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Invalid status filter. Must be one of: {', '.join([s.value for s in DoctorStatus])}"
                    )
                query = query.filter(User.doctor_status == status_filter)
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            doctors = query.order_by(
                User.created_at.desc()
            ).limit(limit).offset(offset).all()
            
            # Build response
            applications = []
            for doctor in doctors:
                profile = self.db.query(DoctorProfile).filter(
                    DoctorProfile.user_id == doctor.id
                ).first()
                
                applications.append({
                    "user_id": str(doctor.id),
                    "full_name": profile.full_name if profile else "Unknown",
                    "email": doctor.email,
                    "medical_registration_number": profile.medical_registration_number if profile else None,
                    "state_medical_council": profile.state_medical_council if profile else None,
                    "application_date": profile.application_date.isoformat() if profile and profile.application_date else None,
                    "status": doctor.doctor_status,
                    "verification_date": profile.verification_date.isoformat() if profile and profile.verification_date else None,
                    "verified_by": str(profile.verified_by_admin_id) if profile and profile.verified_by_admin_id else None
                })
            
            logger.info(f"[{request_id}] ✅ Found {len(applications)} applications (total: {total})")
            
            return {
                "applications": applications,
                "pagination": {
                    "total": total,
                    "limit": limit,
                    "offset": offset,
                    "has_more": (offset + limit) < total
                },
                "filters_applied": {
                    "status": status_filter
                }
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Error listing applications: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to list applications"
            )
    
    async def get_application_details(
        self,
        admin_user_id: str,
        doctor_user_id: str
    ) -> Dict[str, Any]:
        """
        Get detailed information about a doctor application.
        
        Args:
            admin_user_id: ID of the admin user making the request
            doctor_user_id: ID of the doctor to get details for
            
        Returns:
            Dict containing detailed application information and audit history
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] 📄 Admin {admin_user_id} requesting details for doctor {doctor_user_id}")
            
            # Verify admin access
            admin = self._verify_admin_access(admin_user_id, request_id)
            
            # Get doctor
            doctor = self.db.query(User).filter(
                User.id == doctor_user_id,
                User.role == UserRole.DOCTOR.value
            ).first()
            
            if not doctor:
                logger.warning(f"[{request_id}] ❌ Doctor not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            # Get profile
            profile = self.db.query(DoctorProfile).filter(
                DoctorProfile.user_id == doctor.id
            ).first()
            
            if not profile:
                logger.warning(f"[{request_id}] ❌ Doctor profile not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor profile not found"
                )
            
            # Get audit history
            audit_logs = self.db.query(AuditLog).filter(
                AuditLog.doctor_user_id == doctor.id
            ).order_by(AuditLog.timestamp.desc()).limit(10).all()
            
            logger.info(f"[{request_id}] ✅ Retrieved details for doctor {doctor_user_id}")
            
            return {
                "user_id": str(doctor.id),
                "email": doctor.email,
                "status": doctor.doctor_status,
                "created_at": doctor.created_at.isoformat(),
                "profile": {
                    "full_name": profile.full_name,
                    "medical_registration_number": profile.medical_registration_number,
                    "state_medical_council": profile.state_medical_council,
                    "application_date": profile.application_date.isoformat(),
                    "verification_date": profile.verification_date.isoformat() if profile.verification_date else None,
                    "rejection_reason": profile.rejection_reason,
                    "profile_completed": profile.profile_completed
                },
                "audit_history": [
                    {
                        "event_type": log.event_type,
                        "timestamp": log.timestamp.isoformat(),
                        "admin_id": str(log.admin_user_id) if log.admin_user_id else None,
                        "details": log.details
                    }
                    for log in audit_logs
                ]
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Error getting application details: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to get application details"
            )
    
    async def approve_doctor(
        self,
        admin_user_id: str,
        doctor_user_id: str,
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Approve doctor application.
        
        Actions:
        1. Update doctor_status to 'verified'
        2. Set is_active=True
        3. Generate temporary password
        4. Queue approval email with credentials
        5. Log approval action
        
        Args:
            admin_user_id: ID of the admin user approving the application
            doctor_user_id: ID of the doctor to approve
            ip_address: IP address of the request
            
        Returns:
            Dict containing success message and details
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] ✅ Admin {admin_user_id} approving doctor {doctor_user_id}")
            
            # Verify admin access
            admin = self._verify_admin_access(admin_user_id, request_id)
            
            # Get doctor
            doctor = self.db.query(User).filter(
                User.id == doctor_user_id,
                User.role == UserRole.DOCTOR.value
            ).first()
            
            if not doctor:
                logger.warning(f"[{request_id}] ❌ Doctor not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            if doctor.doctor_status != DoctorStatus.PENDING.value:
                logger.warning(f"[{request_id}] ❌ Cannot approve doctor with status: {doctor.doctor_status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot approve doctor with status: {doctor.doctor_status}"
                )
            
            # Generate temporary password (12 characters, alphanumeric + special)
            temp_password = secrets.token_urlsafe(12)[:12]
            temp_password_hash = self.hash_util.hash_password(temp_password)
            
            # Update doctor
            doctor.doctor_status = DoctorStatus.VERIFIED.value
            doctor.is_active = True
            doctor.password_hash = temp_password_hash
            doctor.password_reset_required = True  # Force password change on first login
            
            # Update profile
            profile = self.db.query(DoctorProfile).filter(
                DoctorProfile.user_id == doctor.id
            ).first()
            
            if not profile:
                logger.error(f"[{request_id}] ❌ Doctor profile not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor profile not found"
                )
            
            profile.verification_date = datetime.now(timezone.utc)
            profile.verified_by_admin_id = admin_user_id
            
            # Queue approval email
            email_job = EmailQueue(
                recipient_email=doctor.email,
                template_name=EmailTemplate.APPROVAL.value,
                template_data={
                    "full_name": profile.full_name,
                    "email": doctor.email,
                    "temporary_password": temp_password,
                    "login_url": f"{settings.FRONTEND_URL}/login" if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000/login",
                    "admin_name": admin.profile.full_name if admin.profile else "SynapseAI Team"
                },
                status="pending"
            )
            
            self.db.add(email_job)
            
            # Audit log
            audit_log = AuditLog.log_event(
                db_session=self.db,
                event_type=AuditEventType.DOCTOR_APPROVED,
                admin_user_id=admin_user_id,
                doctor_user_id=doctor.id,
                ip_address=ip_address,
                details={
                    "approved_by": admin.email,
                    "request_id": request_id
                }
            )
            
            self.db.commit()
            
            logger.info(f"[{request_id}] ✅ Doctor approved successfully: {doctor.id} by admin: {admin_user_id}")
            
            return {
                "message": "Doctor application approved successfully",
                "doctor_id": str(doctor.id),
                "doctor_email": doctor.email,
                "temporary_password_sent": True,
                "request_id": request_id
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Error approving doctor: {str(e)}", exc_info=True)
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to approve doctor"
            )
    
    async def reject_doctor(
        self,
        admin_user_id: str,
        doctor_user_id: str,
        rejection_reason: str,
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Reject doctor application with reason.
        
        Args:
            admin_user_id: ID of the admin user rejecting the application
            doctor_user_id: ID of the doctor to reject
            rejection_reason: Reason for rejection
            ip_address: IP address of the request
            
        Returns:
            Dict containing success message and details
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] ❌ Admin {admin_user_id} rejecting doctor {doctor_user_id}")
            
            # Verify admin access
            admin = self._verify_admin_access(admin_user_id, request_id)
            
            # Get doctor
            doctor = self.db.query(User).filter(
                User.id == doctor_user_id,
                User.role == UserRole.DOCTOR.value
            ).first()
            
            if not doctor:
                logger.warning(f"[{request_id}] ❌ Doctor not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor not found"
                )
            
            if doctor.doctor_status != DoctorStatus.PENDING.value:
                logger.warning(f"[{request_id}] ❌ Cannot reject doctor with status: {doctor.doctor_status}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot reject doctor with status: {doctor.doctor_status}"
                )
            
            # Update doctor
            doctor.doctor_status = DoctorStatus.REJECTED.value
            doctor.is_active = False
            
            # Update profile
            profile = self.db.query(DoctorProfile).filter(
                DoctorProfile.user_id == doctor.id
            ).first()
            
            if not profile:
                logger.error(f"[{request_id}] ❌ Doctor profile not found: {doctor_user_id}")
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Doctor profile not found"
                )
            
            profile.verification_date = datetime.now(timezone.utc)
            profile.verified_by_admin_id = admin_user_id
            profile.rejection_reason = rejection_reason
            
            # Queue rejection email
            email_job = EmailQueue(
                recipient_email=doctor.email,
                template_name=EmailTemplate.REJECTION.value,
                template_data={
                    "full_name": profile.full_name,
                    "rejection_reason": rejection_reason,
                    "support_email": settings.SUPPORT_EMAIL if hasattr(settings, 'SUPPORT_EMAIL') else "support@synapseai.com",
                    "admin_name": admin.profile.full_name if admin.profile else "SynapseAI Team"
                },
                status="pending"
            )
            
            self.db.add(email_job)
            
            # Audit log
            audit_log = AuditLog.log_event(
                db_session=self.db,
                event_type=AuditEventType.DOCTOR_REJECTED,
                admin_user_id=admin_user_id,
                doctor_user_id=doctor.id,
                ip_address=ip_address,
                details={
                    "rejected_by": admin.email,
                    "reason": rejection_reason,
                    "request_id": request_id
                }
            )
            
            self.db.commit()
            
            logger.info(f"[{request_id}] ✅ Doctor rejected successfully: {doctor.id} by admin: {admin_user_id}")
            
            return {
                "message": "Doctor application rejected",
                "doctor_id": str(doctor.id),
                "rejection_email_sent": True,
                "request_id": request_id
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Error rejecting doctor: {str(e)}", exc_info=True)
            self.db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to reject doctor"
            )

