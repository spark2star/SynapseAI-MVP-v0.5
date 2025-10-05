"""
Authentication service implementation.
Handles user authentication, registration, and session management.

Fixed Issues:
- Email lookup uses email_hash with proper error handling
- Failed login attempts stored correctly as strings (per model definition)
- Added comprehensive logging for debugging
- Added request IDs for tracing
- Fixed async/await consistency
"""

from sqlalchemy.orm import Session
from sqlalchemy import func  # ✅ ADDED for case-insensitive queries
from fastapi import HTTPException, status, Depends
from typing import Optional, Dict, Any, Tuple
from datetime import datetime, timedelta, timezone
import secrets
import pyotp
import qrcode
import io
import base64
import logging  # ✅ ADDED
import uuid  # ✅ ADDED

from app.core.database import get_db
from app.models.user import User, UserProfile, UserRole
from app.schemas.user import UserCreate, UserLogin, PasswordChange, PasswordResetRequest, MFASetup, MFAVerification
from app.schemas.auth import LoginResponse, SessionInfo
from app.core.security import JWTManager, SecurityValidator
from app.core.encryption import HashingUtility
from app.core.config import settings
from app.core.audit import audit_logger, AuditEventType

# Initialize logger
logger = logging.getLogger(__name__)


class AuthenticationService:
    """Service for handling authentication operations."""
    
    def __init__(self, db: Session):
        self.db = db
        self.jwt_manager = JWTManager()
        self.hash_util = HashingUtility()
    
    async def register_user(
        self,
        user_data: UserCreate,
        created_by_user_id: str,
        ip_address: str
    ) -> User:
        """
        Register a new user (admin only operation).
        """
        # Check if email already exists (using email_hash for efficient lookup)
        email_hash = User.hash_email(user_data.email)
        existing_user = self.db.query(User).filter(
            User.email_hash == email_hash
        ).first()
        
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Hash password
        password_hash = self.hash_util.hash_password(user_data.password)
        
        # Generate email verification token
        verification_token = self.hash_util.generate_secure_token()
        
        # Create user
        db_user = User(
            email=user_data.email,
            email_hash=email_hash,
            password_hash=password_hash,
            role=user_data.role.value,
            email_verification_token=verification_token,
            is_verified=False,  # Require email verification
            is_active=True
        )
        
        self.db.add(db_user)
        self.db.flush()  # Get user ID
        
        # Create user profile
        db_profile = UserProfile(
            user_id=db_user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            license_number=user_data.license_number,
            specialization=user_data.specialization
        )
        
        self.db.add(db_profile)
        self.db.commit()
        self.db.refresh(db_user)
        
        # Log user creation
        await audit_logger.log_event(
            event_type=AuditEventType.USER_CREATED,
            user_id=created_by_user_id,
            resource_type="user",
            resource_id=db_user.id,
            ip_address=ip_address,
            details={
                "new_user_email": user_data.email,
                "new_user_role": user_data.role.value,
                "requires_verification": True
            }
        )
        
        return db_user
    
    async def register_doctor(
        self,
        registration_data: 'DoctorRegistrationRequest',
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Register new doctor with pending status.
        
        Validation:
        - Medical registration number uniqueness
        - Email uniqueness
        - Phone number format
        - State medical council is valid
        
        Note: No password required during registration.
        Admin will generate temporary password upon approval.
        
        Returns:
            - Success message
            - Application ID
            - Expected review timeline
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] 📝 Doctor registration attempt: {registration_data.email}")
            
            # Check for duplicate medical registration number
            from app.models.doctor_profile import DoctorProfile
            existing_doctor = self.db.query(DoctorProfile).filter(
                DoctorProfile.medical_registration_number == registration_data.medical_registration_number.upper()
            ).first()
            
            if existing_doctor:
                logger.warning(f"[{request_id}] ❌ Duplicate medical registration number: {registration_data.medical_registration_number}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Medical registration number already registered",
                        "code": "DUPLICATE_MED_REG",
                        "request_id": request_id
                    }
                )
            
            # Check for duplicate email
            email_hash = User.hash_email(registration_data.email)
            existing_user = self.db.query(User).filter(
                User.email_hash == email_hash
            ).first()
            
            if existing_user:
                logger.warning(f"[{request_id}] ❌ Duplicate email: {registration_data.email}")
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Email already registered",
                        "code": "DUPLICATE_EMAIL",
                        "request_id": request_id
                    }
                )
            
            # Create user with role=doctor, status=pending
            # Generate a placeholder password that will be replaced upon approval
            import secrets
            placeholder_password = secrets.token_urlsafe(32)
            password_hash = self.hash_util.hash_password(placeholder_password)
            
            user = User(
                email=registration_data.email,
                email_hash=email_hash,
                password_hash=password_hash,
                role="doctor",  # Set role
                doctor_status="pending",  # Set initial status
                is_active=False,  # Inactive until approved
                is_verified=True,  # Skip email verification for doctors (admin will verify)
                password_reset_required=True,  # Will be set to True again with temp password on approval
                created_at=datetime.now(timezone.utc)
            )
            
            self.db.add(user)
            self.db.flush()  # Get user ID
            
            logger.info(f"[{request_id}] ✅ User created: {user.id}")
            
            # Create doctor profile with phone number
            doctor_profile = DoctorProfile(
                user_id=user.id,
                full_name=registration_data.full_name,
                medical_registration_number=registration_data.medical_registration_number.upper(),
                state_medical_council=registration_data.state_medical_council,
                phone_number=registration_data.phone,  # Store phone number
                application_date=datetime.now(timezone.utc),
                profile_completed=False
            )
            
            self.db.add(doctor_profile)
            
            logger.info(f"[{request_id}] ✅ Doctor profile created with phone: {registration_data.phone}")
            
            # Queue welcome email
            from app.models.email_queue import EmailQueue
            email_job = EmailQueue(
                recipient_email=user.email,
                template_name="application_received",
                template_data={
                    "full_name": registration_data.full_name,
                    "application_id": str(user.id),
                    "expected_review_days": 2
                },
                status="pending"
            )
            
            self.db.add(email_job)
            
            # Audit log
            from app.models.audit_log import AuditLog, AuditEventType
            audit_log = AuditLog.log_event(
                db_session=self.db,
                event_type=AuditEventType.DOCTOR_APPLIED,
                doctor_user_id=user.id,
                ip_address=ip_address,
                details={
                    "full_name": registration_data.full_name,
                    "medical_reg_number": registration_data.medical_registration_number,
                    "state_council": registration_data.state_medical_council,
                    "request_id": request_id
                }
            )
            
            self.db.commit()
            
            logger.info(f"[{request_id}] ✅ Doctor registered successfully: {user.id}")
            
            # ============================================================================
            # SEND EMAIL NOTIFICATIONS
            # ============================================================================
            try:
                from app.services.email_service import email_service
                
                # Prepare doctor data for email
                doctor_email_data = {
                    'user_id': str(user.id),
                    'full_name': registration_data.full_name,
                    'email': registration_data.email,
                    'phone': getattr(registration_data, 'phone', 'N/A'),
                    'medical_registration_number': registration_data.medical_registration_number.upper(),
                    'state_medical_council': registration_data.state_medical_council,
                    'specialization': 'Psychiatrist',  # Default specialization
                }
                
                # Send notification to admin
                logger.info(f"[{request_id}] 📧 Sending admin notification...")
                admin_email_sent = email_service.send_doctor_registration_notification(doctor_email_data)
                
                if admin_email_sent:
                    logger.info(f"[{request_id}] ✅ Admin notification sent successfully")
                else:
                    logger.error(f"[{request_id}] ❌ Failed to send admin notification")
                
                # Send confirmation to doctor
                logger.info(f"[{request_id}] 📧 Sending confirmation to doctor...")
                doctor_email_sent = email_service.send_doctor_registration_confirmation(
                    email=registration_data.email,
                    name=registration_data.full_name
                )
                
                if doctor_email_sent:
                    logger.info(f"[{request_id}] ✅ Doctor confirmation sent successfully")
                else:
                    logger.error(f"[{request_id}] ❌ Failed to send doctor confirmation")
                
            except Exception as email_error:
                # Don't fail registration if email fails
                logger.error(f"[{request_id}] ⚠️ Email notification error: {str(email_error)}")
            # ============================================================================
            
            return {
                "message": "Your application has been received and is pending verification",
                "application_id": str(user.id),
                "expected_review": "2-3 business days",
                "next_steps": "We will verify your credentials and send you an email once approved",
                "request_id": request_id
            }
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"[{request_id}] ❌ Registration error: {str(e)}", exc_info=True)
            self.db.rollback()
            raise HTTPException(
                status_code=500,
                detail={
                    "message": "Registration failed. Please try again.",
                    "request_id": request_id
                }
            )
    
    async def authenticate_user(
        self,
        login_data: UserLogin,
        ip_address: str,
        user_agent: str
    ) -> Tuple[LoginResponse, Optional[str]]:
        """
        Authenticate user and return tokens.
        Returns (LoginResponse, session_id)
        """
        request_id = str(uuid.uuid4())[:8]
        
        try:
            logger.info(f"[{request_id}] 🔐 Login attempt for: {login_data.email}")
            
            # FIX #1: Query by email_hash with proper error handling
            email_hash = User.hash_email(login_data.email)
            logger.debug(f"[{request_id}] Generated email_hash: {email_hash[:16]}...")
            
            user = self.db.query(User).filter(
                User.email_hash == email_hash
            ).first()
            
            if not user:
                logger.warning(f"[{request_id}] ❌ User not found for email_hash: {email_hash[:16]}...")
                
                # DEBUG: Show available users (only in development)
                if settings.DEBUG:
                    try:
                        sample_users = self.db.query(User.email_hash).limit(3).all()
                        logger.debug(f"[{request_id}] Sample email_hashes in DB: {[u.email_hash[:16] + '...' for u in sample_users]}")
                    except Exception as e:
                        logger.debug(f"[{request_id}] Could not query sample users: {e}")
                
                await self._log_failed_login(
                    email=login_data.email,
                    reason="user_not_found",
                    ip_address=ip_address,
                    user_agent=user_agent
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            logger.info(f"[{request_id}] ✅ User found: {user.id}")
        
            # Check if account is locked
            if user.is_account_locked():
                logger.warning(f"[{request_id}] 🔒 Account locked: {user.id}")
                await self._log_failed_login(
                    email=login_data.email,
                    reason="account_locked",
                    ip_address=ip_address,
                    user_agent=user_agent,
                    user_id=user.id
                )
                raise HTTPException(
                    status_code=status.HTTP_423_LOCKED,
                    detail="Account is temporarily locked due to multiple failed login attempts"
                )
            
            # Verify password
            logger.info(f"[{request_id}] Verifying password...")
            logger.debug(f"[{request_id}] Password hash from DB: {user.password_hash[:20]}...")
            
            if not self.hash_util.verify_password(login_data.password, user.password_hash):
                logger.warning(f"[{request_id}] ❌ Invalid password for user: {user.id}")
                await self._handle_failed_login(user, ip_address, user_agent, request_id)
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid credentials"
                )
            
            logger.info(f"[{request_id}] ✅ Password verified successfully")
        
            # Check doctor status if user is a doctor
            if user.role == "doctor":
                if user.doctor_status == "pending":
                    logger.warning(f"[{request_id}] ⚠️ Doctor application pending: {user.id}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "message": "Your application is pending verification. You will receive an email once approved.",
                            "code": "APPLICATION_PENDING",
                            "application_id": str(user.id)
                        }
                    )
                
                if user.doctor_status == "rejected":
                    logger.warning(f"[{request_id}] ⚠️ Doctor application rejected: {user.id}")
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail={
                            "message": "Your application was not approved. Please contact support for more information.",
                            "code": "APPLICATION_REJECTED"
                        }
                    )
        
            # Check if user is verified and active
            if not user.is_verified:
                logger.warning(f"[{request_id}] ⚠️ Email not verified: {user.id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email address not verified. Please check your email for verification instructions."
                )
            
            if not user.is_active:
                logger.warning(f"[{request_id}] ⚠️ Account disabled: {user.id}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account is disabled. Please contact administrator."
                )
        
            # FIX #2: Reset failed login attempts (as string per model definition)
            user.failed_login_attempts = "0"
            user.locked_until = None
            user.is_locked = False
            logger.info(f"[{request_id}] Reset failed login attempts")
            
            # Check if MFA is enabled
            if user.mfa_enabled:
                # For now, skip MFA implementation and proceed
                # TODO: Implement MFA verification flow
                pass
            
            # Check if doctor profile is completed (for verified doctors)
            profile_completed = True
            if user.role == "doctor" and user.doctor_status == "verified":
                from app.models.doctor_profile import DoctorProfile
                doctor_profile = self.db.query(DoctorProfile).filter(
                    DoctorProfile.user_id == user.id
                ).first()
                
                if doctor_profile:
                    profile_completed = doctor_profile.profile_completed
            
            # Generate JWT tokens
            token_data = {
                "sub": user.id,
                "email": user.email,
                "role": user.role,
                "doctor_status": user.doctor_status if user.role == "doctor" else None,
                "profile_completed": profile_completed if user.role == "doctor" else None,
                "session_type": "extended" if login_data.remember_me else "normal"
            }
            
            logger.info(f"[{request_id}] Generating JWT tokens...")
            access_token = self.jwt_manager.create_access_token(token_data)
            refresh_token = self.jwt_manager.create_refresh_token(token_data)
            
            # Update last login
            user.last_login = datetime.now(timezone.utc)
            
            try:
                self.db.commit()
                logger.info(f"[{request_id}] ✅ Database updated successfully")
            except Exception as e:
                logger.error(f"[{request_id}] ❌ Failed to commit to database: {str(e)}")
                self.db.rollback()
                raise
            
            # Create session info
            session_id = self.hash_util.generate_secure_token()
            
            # Log successful login
            await audit_logger.log_authentication_event(
                event_type=AuditEventType.USER_LOGIN,
                user_id=user.id,
                success=True,
                ip_address=ip_address,
                user_agent=user_agent,
                details={
                    "remember_me": login_data.remember_me,
                    "session_id": session_id,
                    "request_id": request_id
                }
            )
            
            logger.info(f"[{request_id}] 🎉 Login successful for user: {user.id}")
            
            # Prepare response
            login_response = LoginResponse(
                access_token=access_token,
                refresh_token=refresh_token,
                token_type="bearer",
                expires_in=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60,
                user_id=user.id,
                role=user.role,
                requires_mfa=user.mfa_enabled and False,  # TODO: Implement MFA check
                doctor_status=user.doctor_status if user.role == "doctor" else None,
                profile_completed=profile_completed if user.role == "doctor" else None,
                password_reset_required=user.password_reset_required
            )
            
            return login_response, session_id
        
        except HTTPException:
            raise
        except Exception as e:
            logger.error(
                f"[{request_id}] ❌ Unexpected authentication error: {str(e)}",
                exc_info=True
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error during authentication"
            )
    
    async def refresh_token(self, refresh_token: str) -> Dict[str, Any]:
        """
        Refresh access token using refresh token.
        """
        try:
            # Verify refresh token
            payload = self.jwt_manager.verify_token(refresh_token, "refresh")
            
            # Get user to verify still active
            user = self.db.query(User).filter(User.id == payload["sub"]).first()
            if not user or not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User no longer active"
                )
            
            # Generate new access token
            token_data = {
                "sub": user.id,
                "email": user.email,
                "role": user.role
            }
            
            new_access_token = self.jwt_manager.create_access_token(token_data)
            
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in": settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
    
    async def logout_user(
        self,
        user_id: str,
        session_id: Optional[str],
        ip_address: str,
        user_agent: str
    ) -> Dict[str, Any]:
        """
        Logout user and invalidate session.
        """
        # TODO: Implement token blacklisting in Redis
        # For now, just log the logout event
        
        await audit_logger.log_authentication_event(
            event_type=AuditEventType.USER_LOGOUT,
            user_id=user_id,
            success=True,
            ip_address=ip_address,
            user_agent=user_agent,
            details={"session_id": session_id}
        )
        
        return {
            "message": "Successfully logged out",
            "logged_out_at": datetime.now(timezone.utc).isoformat()
        }
    
    async def change_password(
        self,
        user_id: str,
        password_data: PasswordChange,
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Change user password.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not self.hash_util.verify_password(password_data.current_password, user.password_hash):
            await audit_logger.log_event(
                event_type=AuditEventType.SECURITY_UNAUTHORIZED_ACCESS,
                user_id=user_id,
                ip_address=ip_address,
                details={"action": "password_change_failed", "reason": "invalid_current_password"}
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Hash new password
        new_password_hash = self.hash_util.hash_password(password_data.new_password)
        
        # Update password
        user.password_hash = new_password_hash
        self.db.commit()
        
        # Log password change
        await audit_logger.log_event(
            event_type=AuditEventType.USER_PASSWORD_CHANGED,
            user_id=user_id,
            ip_address=ip_address,
            details={"action": "password_changed"}
        )
        
        return {"message": "Password changed successfully"}
    
    async def verify_email(self, token: str) -> Dict[str, Any]:
        """
        Verify user email with verification token.
        """
        user = self.db.query(User).filter(
            User.email_verification_token == token
        ).first()
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        if user.is_verified:
            return {"message": "Email already verified"}
        
        # Verify email
        user.is_verified = True
        user.email_verified_at = datetime.now(timezone.utc)
        user.email_verification_token = None
        self.db.commit()
        
        # Log email verification
        await audit_logger.log_event(
            event_type=AuditEventType.USER_UPDATED,
            user_id=user.id,
            details={"action": "email_verified"}
        )
        
        return {"message": "Email verified successfully"}
    
    async def request_password_reset(
        self,
        reset_data: PasswordResetRequest,
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Request password reset.
        """
        user = self.db.query(User).filter(
            User.email == reset_data.email
        ).first()
        
        if not user:
            # Don't reveal if email exists or not
            return {"message": "If the email exists, password reset instructions have been sent"}
        
        # Generate reset token
        reset_token = self.hash_util.generate_secure_token()
        reset_expires = datetime.now(timezone.utc) + timedelta(hours=1)
        
        # Save reset token
        user.password_reset_token = reset_token
        user.password_reset_expires = reset_expires
        self.db.commit()
        
        # Log password reset request
        await audit_logger.log_event(
            event_type=AuditEventType.SECURITY_PASSWORD_RESET_REQUESTED,
            user_id=user.id,
            ip_address=ip_address,
            details={"action": "password_reset_requested"}
        )
        
        # TODO: Send email with reset token
        
        return {"message": "If the email exists, password reset instructions have been sent"}
    
    async def setup_mfa(
        self,
        user_id: str,
        ip_address: str
    ) -> Dict[str, Any]:
        """
        Set up MFA for user.
        Returns QR code and backup codes.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        if user.mfa_enabled:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA is already enabled for this user"
            )
        
        # Generate MFA secret
        secret = pyotp.random_base32()
        
        # Create TOTP object
        totp = pyotp.TOTP(secret)
        
        # Generate QR code
        qr_uri = totp.provisioning_uri(
            name=user.email,
            issuer_name=settings.MFA_ISSUER
        )
        
        # Create QR code image
        qr = qrcode.QRCode(version=1, box_size=10, border=5)
        qr.add_data(qr_uri)
        qr.make(fit=True)
        
        # Convert to base64 string
        img = qr.make_image(fill_color="black", back_color="white")
        img_buffer = io.BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        qr_code_base64 = base64.b64encode(img_buffer.getvalue()).decode()
        
        # Generate backup codes
        backup_codes = [self.hash_util.generate_secure_token()[:8].upper() for _ in range(10)]
        
        # Store MFA secret (encrypted)
        user.mfa_secret = secret
        self.db.commit()
        
        # Log MFA setup
        await audit_logger.log_event(
            event_type=AuditEventType.USER_MFA_ENABLED,
            user_id=user_id,
            ip_address=ip_address,
            details={"mfa_setup": True}
        )
        
        return {
            "secret": secret,
            "qr_code": f"data:image/png;base64,{qr_code_base64}",
            "backup_codes": backup_codes
        }
    
    async def verify_mfa_setup(
        self,
        user_id: str,
        token: str,
        ip_address: str
    ) -> bool:
        """
        Verify MFA setup with TOTP token.
        Enables MFA if verification succeeds.
        """
        user = self.db.query(User).filter(User.id == user_id).first()
        if not user or not user.mfa_secret:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA setup not initiated"
            )
        
        # Verify TOTP token
        totp = pyotp.TOTP(user.mfa_secret)
        
        if not totp.verify(token):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid MFA token"
            )
        
        # Enable MFA
        user.mfa_enabled = True
        self.db.commit()
        
        # Log MFA verification
        await audit_logger.log_event(
            event_type=AuditEventType.USER_MFA_ENABLED,
            user_id=user_id,
            ip_address=ip_address,
            details={"mfa_verified": True}
        )
        
        return True
    
    async def _handle_failed_login(
        self,
        user: User,
        ip_address: str,
        user_agent: str,
        request_id: str = None
    ):
        """Handle failed login attempt."""
        if not request_id:
            request_id = str(uuid.uuid4())[:8]
        
        try:
            # FIX #2: Handle string-based failed_login_attempts (per model definition)
            current_attempts = int(user.failed_login_attempts or "0")
            new_attempts = current_attempts + 1
            user.failed_login_attempts = str(new_attempts)
            
            logger.warning(
                f"[{request_id}] Failed login attempt #{new_attempts} for user {user.id}"
            )
            
            # Lock account after 5 failed attempts
            if new_attempts >= 5:
                user.is_locked = True
                user.locked_until = datetime.now(timezone.utc) + timedelta(minutes=30)
                logger.warning(
                    f"[{request_id}] 🔒 Account locked until {user.locked_until}"
                )
            
            self.db.commit()
            logger.info(f"[{request_id}] ✅ Updated failed login attempts to {new_attempts}")
        
        except Exception as e:
            logger.error(
                f"[{request_id}] ❌ Failed to update login attempts: {str(e)}",
                exc_info=True
            )
            self.db.rollback()
        
        # Log failed login
        await self._log_failed_login(
            email=user.email,
            reason="invalid_password",
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user.id,
            attempts=new_attempts
        )
    
    async def _log_failed_login(
        self,
        email: str,
        reason: str,
        ip_address: str,
        user_agent: str,
        user_id: Optional[str] = None,
        attempts: int = 0
    ):
        """Log failed login attempt."""
        await audit_logger.log_authentication_event(
            event_type=AuditEventType.SECURITY_LOGIN_FAILED,
            user_id=user_id,
            success=False,
            ip_address=ip_address,
            user_agent=user_agent,
            details={
                "email": email,
                "reason": reason,
                "failed_attempts": attempts
            }
        )


def get_auth_service(db: Session = Depends(get_db)) -> AuthenticationService:
    """Dependency to get authentication service."""
    return AuthenticationService(db)
