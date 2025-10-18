"""
File Upload Service for Google Cloud Storage
Handles secure file uploads with validation and sanitization.
"""

import os
import re
import uuid
import logging
from typing import Optional
from datetime import datetime
from pathlib import Path

from fastapi import UploadFile, HTTPException
from google.cloud import storage
from google.cloud.exceptions import GoogleCloudError

from app.core.config import settings

logger = logging.getLogger(__name__)


class FileUploadService:
    """Handles secure file uploads to Google Cloud Storage."""
    
    def __init__(self):
        """Initialize the file upload service with GCS client."""
        try:
            # Initialize Google Cloud Storage client
            self.storage_client = storage.Client(project=settings.GCP_PROJECT_ID)
            self.bucket_name = settings.GCP_STORAGE_BUCKET
            self.bucket = self.storage_client.bucket(self.bucket_name)
            
            logger.info(f"FileUploadService initialized with bucket: {self.bucket_name}")
        except Exception as e:
            logger.error(f"Failed to initialize FileUploadService: {str(e)}")
            raise
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Sanitize filename to prevent security issues.
        
        Args:
            filename: Original filename
            
        Returns:
            Sanitized filename with only safe characters
        """
        # Get file extension
        name, ext = os.path.splitext(filename)
        
        # Remove any non-alphanumeric characters except hyphens and underscores
        safe_name = re.sub(r'[^a-zA-Z0-9_-]', '_', name)
        
        # Limit length
        safe_name = safe_name[:50]
        
        # Ensure extension is lowercase
        safe_ext = ext.lower()
        
        return f"{safe_name}{safe_ext}"
    
    def _validate_file(
        self,
        file: UploadFile,
        allowed_formats: list[str],
        max_size_mb: int
    ) -> None:
        """
        Validate file type and size.
        
        Args:
            file: Uploaded file object
            allowed_formats: List of allowed file extensions
            max_size_mb: Maximum file size in megabytes
            
        Raises:
            HTTPException: If validation fails
        """
        # Validate file extension
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_FILE",
                    "message": "Filename is required",
                    "field": "file"
                }
            )
        
        file_ext = Path(file.filename).suffix.lower().lstrip('.')
        
        if file_ext not in allowed_formats:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_FILE_FORMAT",
                    "message": f"Invalid file format. Allowed formats: {', '.join(allowed_formats)}",
                    "field": "file",
                    "allowed_formats": allowed_formats,
                    "received_format": file_ext
                }
            )
        
        # Validate file size
        # Read file content to check size
        file.file.seek(0, 2)  # Seek to end
        file_size = file.file.tell()  # Get position (file size)
        file.file.seek(0)  # Reset to beginning
        
        max_size_bytes = max_size_mb * 1024 * 1024
        
        if file_size > max_size_bytes:
            file_size_mb = file_size / (1024 * 1024)
            raise HTTPException(
                status_code=413,
                detail={
                    "error": "FILE_TOO_LARGE",
                    "message": f"File size exceeds {max_size_mb}MB limit",
                    "field": "file",
                    "max_size_mb": max_size_mb,
                    "file_size_mb": round(file_size_mb, 2)
                }
            )
        
        # Validate minimum file size (avoid empty files)
        if file_size < 100:  # Less than 100 bytes
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "FILE_TOO_SMALL",
                    "message": "File appears to be empty or corrupted",
                    "field": "file"
                }
            )
        
        # Validate content type
        if file.content_type and not file.content_type.startswith('image/'):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "INVALID_CONTENT_TYPE",
                    "message": "File must be an image",
                    "field": "file",
                    "expected": "image/*",
                    "received": file.content_type
                }
            )
    
    def _generate_unique_path(
        self,
        user_id: str,
        file_type: str,
        filename: str
    ) -> str:
        """
        Generate unique file path in GCS.
        
        Args:
            user_id: User ID for path organization
            file_type: Type of file (logo, signature)
            filename: Sanitized filename
            
        Returns:
            Unique file path in format: {file_type}/{user_id}/{timestamp}_{uuid}_{filename}
        """
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        unique_id = str(uuid.uuid4())[:8]
        
        # Determine base path based on file type
        if file_type == 'logo':
            base_path = settings.GCP_STORAGE_PATH_LOGOS
        elif file_type == 'signature':
            base_path = settings.GCP_STORAGE_PATH_SIGNATURES
        else:
            base_path = 'uploads'
        
        return f"{base_path}/{user_id}/{timestamp}_{unique_id}_{filename}"
    
    async def upload_file(
        self,
        file: UploadFile,
        user_id: str,
        file_type: str
    ) -> str:
        """
        Upload file to Google Cloud Storage.
        
        Args:
            file: Uploaded file object
            user_id: User ID for path organization
            file_type: Type of file (logo, signature)
            
        Returns:
            Public URL of uploaded file
            
        Raises:
            HTTPException: If upload fails or validation fails
        """
        try:
            # Validate file
            self._validate_file(
                file=file,
                allowed_formats=settings.ALLOWED_IMAGE_FORMATS,
                max_size_mb=settings.MAX_IMAGE_SIZE_MB
            )
            
            # Sanitize filename
            safe_filename = self._sanitize_filename(file.filename)
            
            # Generate unique path
            file_path = self._generate_unique_path(user_id, file_type, safe_filename)
            
            # Create blob
            blob = self.bucket.blob(file_path)
            
            # Set content type
            content_type = file.content_type or 'image/jpeg'
            blob.content_type = content_type
            
            # Upload file
            file.file.seek(0)  # Reset file pointer
            blob.upload_from_file(file.file, content_type=content_type)
            
            # Make blob publicly accessible
            blob.make_public()
            
            # Get public URL
            public_url = blob.public_url
            
            logger.info(f"File uploaded successfully: {file_path}")
            logger.info(f"Public URL: {public_url}")
            
            return public_url
            
        except HTTPException:
            # Re-raise HTTP exceptions
            raise
        except GoogleCloudError as e:
            logger.error(f"Google Cloud Storage error: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "UPLOAD_FAILED",
                    "message": "File upload failed due to storage service error. Please try again.",
                    "field": "file",
                    "retry": True
                }
            )
        except Exception as e:
            logger.error(f"Unexpected error during file upload: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error": "UPLOAD_FAILED",
                    "message": "File upload failed. Please try again.",
                    "field": "file",
                    "retry": True
                }
            )
    
    async def delete_file(self, file_url: str) -> bool:
        """
        Delete file from Google Cloud Storage.
        
        Args:
            file_url: Public URL of the file to delete
            
        Returns:
            True if deletion successful, False otherwise
        """
        try:
            # Extract blob path from URL
            # URL format: https://storage.googleapis.com/{bucket}/{path}
            if not file_url.startswith('https://storage.googleapis.com/'):
                logger.warning(f"Invalid GCS URL format: {file_url}")
                return False
            
            # Extract path after bucket name
            url_parts = file_url.split(f'{self.bucket_name}/')
            if len(url_parts) < 2:
                logger.warning(f"Could not extract blob path from URL: {file_url}")
                return False
            
            blob_path = url_parts[1]
            
            # Delete blob
            blob = self.bucket.blob(blob_path)
            blob.delete()
            
            logger.info(f"File deleted successfully: {blob_path}")
            return True
            
        except GoogleCloudError as e:
            logger.error(f"Google Cloud Storage error during deletion: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error during file deletion: {str(e)}")
            return False


# Singleton instance
_file_upload_service: Optional[FileUploadService] = None


def get_file_upload_service() -> FileUploadService:
    """
    Get or create FileUploadService singleton instance.
    
    Returns:
        FileUploadService instance
    """
    global _file_upload_service
    
    if _file_upload_service is None:
        _file_upload_service = FileUploadService()
    
    return _file_upload_service
