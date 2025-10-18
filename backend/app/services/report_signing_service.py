"""
Report Signing Service
Handles secure digital signature of clinical reports with password verification.
"""

import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.report import Report, ReportStatus
from app.models.user import User
from app.core.security import verify_password

logger = logging.getLogger(__name__)


class ReportSigningService:
    """Service for digitally signing clinical reports with cryptographic verification."""
    
    @staticmethod
    def generate_signature_hash(content: str) -> str:
        """
        Generate SHA-256 hash of report content for digital signature.
        
        Args:
            content: Report content to hash
            
        Returns:
            SHA-256 hash as hexadecimal string
        """
        if not content:
            raise ValueError("Cannot generate signature hash for empty content")
        
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    @staticmethod
    async def sign_report(
        db: Session,
        report: Report,
        user: User,
        password: str
    ) -> Report:
        """
        Sign a clinical report with password verification and cryptographic hash.
        
        Args:
            db: Database session
            report: Report to sign
            user: User attempting to sign
            password: Password for re-authentication
            
        Returns:
            Updated report with signature
            
        Raises:
            HTTPException: If verification fails or report cannot be signed
        """
        # Verify report ownership
        if str(report.session.doctor_id) != str(user.id):
            logger.warning(
                f"Unauthorized sign attempt - Report: {report.id}, "
                f"User: {user.id}, Owner: {report.session.doctor_id}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to sign this report"
            )
        
        # Verify report status is 'completed'
        if report.status != ReportStatus.COMPLETED.value:
            logger.warning(
                f"Invalid status for signing - Report: {report.id}, Status: {report.status}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Report must be completed before signing. Current status: {report.status}"
            )
        
        # Verify report is not already signed
        if report.signed_by or report.signature_hash:
            logger.warning(
                f"Report already signed - Report: {report.id}, Signed by: {report.signed_by}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Report has already been signed"
            )
        
        # Re-authenticate with password
        if not verify_password(password, user.password_hash):
            logger.warning(
                f"Invalid password for signing - Report: {report.id}, User: {user.id}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect password"
            )
        
        # Generate signature hash
        try:
            signature_hash = ReportSigningService.generate_signature_hash(
                report.generated_content or ""
            )
        except ValueError as e:
            logger.error(f"Failed to generate signature hash - Report: {report.id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot sign report with empty content"
            )
        
        # Update report with signature
        report.signature_hash = signature_hash
        report.signed_by = str(user.id)
        report.signed_at = datetime.now(timezone.utc).isoformat()
        report.status = ReportStatus.SIGNED.value
        report.updated_at = datetime.now(timezone.utc)
        
        try:
            db.commit()
            db.refresh(report)
            logger.info(
                f"Report signed successfully - Report: {report.id}, "
                f"User: {user.id}, Hash: {signature_hash[:16]}..."
            )
        except Exception as e:
            db.rollback()
            logger.error(f"Failed to save signed report - Report: {report.id}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save signed report"
            )
        
        return report
