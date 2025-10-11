"""
Core configuration management for the EMR system.
Implements secure configuration handling with environment variables.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field, validator
import secrets
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings with secure defaults and validation."""
    
    # Application
    APP_NAME: str = "SynapseAI - Intelligent EMR System"
    VERSION: str = "1.0.0"
    DEBUG: bool = False
    ENVIRONMENT: str = Field(default="development", pattern="^(development|staging|production)$")
    
    ALGORITHM: str = "HS256"  # JWT algorithm

    # Database
    DATABASE_URL: str = Field(..., min_length=1)
    DATABASE_POOL_SIZE: int = 20
    DATABASE_MAX_OVERFLOW: int = 10
    
    # Redis
    REDIS_URL: str = Field(..., min_length=1)
    REDIS_SESSION_DB: int = 1
    
    # Security
    SECRET_KEY: str = Field(default="dev-secret-key-change-in-production")
    JWT_SECRET_KEY: str = Field(default="dev-jwt-secret-key-change-in-production")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 240
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    BCRYPT_ROUNDS: int = 12


    
    # Encryption (Use Google Cloud KMS in production)
    ENCRYPTION_KEY: str = Field(..., min_length=32)
    FIELD_ENCRYPTION_KEY: str = Field(..., min_length=32)
    
    # Google Cloud Service Account
    GCP_CREDENTIALS_PATH: str = "gcp-credentials.json"
    GCP_PROJECT_ID: str = "synapse-product-1"
    
    # Google STT for Healthcare (Multi-language with code-switching)
    GOOGLE_STT_MODEL: str = "latest_long"  # Use 'chirp' for multilingual
    GOOGLE_STT_PRIMARY_LANGUAGE: str = "hi-IN"  # Hindi (India) - Listed first for priority
    GOOGLE_STT_ALTERNATE_LANGUAGES: list = ["hi-IN", "mr-IN", "en-IN"]  # All languages equal (Hindi, Marathi, English)
    GOOGLE_STT_SAMPLE_RATE: int = 48000
    GOOGLE_STT_ENCODING: str = "WEBM_OPUS"
    GOOGLE_STT_ENABLE_WORD_CONFIDENCE: bool = True
    GOOGLE_STT_ENABLE_WORD_TIME_OFFSETS: bool = True
    GOOGLE_STT_ENABLE_PUNCTUATION: bool = True
    GOOGLE_STT_ENABLE_DIARIZATION: bool = False  # Disabled - only doctor's voice matters
    GOOGLE_STT_DIARIZATION_SPEAKER_COUNT: int = 1  # Single speaker (doctor)
    GOOGLE_STT_INTERIM_RESULTS: bool = True
    GOOGLE_STT_PROFANITY_FILTER: bool = False  # Medical terms may be flagged
    
    # Gemini AI (Vertex AI)
    GOOGLE_CLOUD_PROJECT: str = "synapse-product-1"
    VERTEX_AI_LOCATION: str = "asia-south1"  # Mumbai, India
    GEMINI_MODEL: str = "gemini-2.5-flash"
    GOOGLE_APPLICATION_CREDENTIALS: str = "gcp-credentials.json"
    
    # API Configuration
    API_V1_PREFIX: str = "/api/v1"
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
    "http://localhost:3000",
    "http://localhost:8000", 
    "https://synapseai.health",
    "https://synapseai-frontend-910625707162.asia-south1.run.app"
]
    # ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    # ALLOWED_HEADERS: List[str] = ["*"]
    ALLOWED_METHODS: list[str] = ["*"]  # Or ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    ALLOWED_HEADERS: list[str] = ["*"]  # Or ["Content-Type", "Authorization", "Accept"]

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    RATE_LIMIT_PER_HOUR: int = 1000
    
    # Logging & Audit
    LOG_LEVEL: str = "INFO"
    AUDIT_LOG_RETENTION_DAYS: int = 2555  # 7 years for HIPAA compliance
    ENABLE_AUDIT_LOGGING: bool = True
    
    # Data Retention
    PATIENT_DATA_RETENTION_YEARS: int = 7
    AUDIT_LOG_RETENTION_YEARS: int = 7
    SESSION_AUDIO_RETENTION_DAYS: int = 30
    
    # File Upload
    MAX_UPLOAD_SIZE: str = "50MB"
    MAX_FILE_SIZE: int = 10485760  # 10MB (for backward compatibility with env template)
    ALLOWED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "m4a", "webm"]
    ALLOWED_FILE_TYPES: List[str] = ["pdf", "doc", "docx", "jpg", "jpeg", "png"]
    
    # Session
    SESSION_EXPIRE_MINUTES: int = 30
    
    # MFA
    MFA_ISSUER: str = "EMR-System"
    
    # Email Configuration
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_FROM_EMAIL: str = ""
    SMTP_FROM_NAME: str = "SynapseAI Notifications"
    
    # Admin Notifications
    ADMIN_EMAIL: str = ""
    ADMIN_NOTIFICATION_ENABLED: bool = True
    
    # Frontend URL
    FRONTEND_URL: str = "http://localhost:3000"
    
    @validator("ENVIRONMENT")
    def validate_environment(cls, v):
        """Ensure environment is one of the allowed values."""
        allowed = ["development", "staging", "production"]
        if v not in allowed:
            raise ValueError(f"Environment must be one of: {allowed}")
        return v
    
    @validator("ALLOWED_ORIGINS", pre=True)
    def validate_origins(cls, v):
        """Parse comma-separated origins if provided as string."""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("ALLOWED_METHODS", pre=True)
    def validate_methods(cls, v):
        """Parse comma-separated methods if provided as string."""
        if isinstance(v, str):
            return [method.strip() for method in v.split(",")]
        return v
    
    @validator("ALLOWED_AUDIO_FORMATS", pre=True)
    def validate_audio_formats(cls, v):
        """Parse comma-separated formats if provided as string."""
        if isinstance(v, str):
            return [fmt.strip() for fmt in v.split(",")]
        return v
    
    @validator("ALLOWED_FILE_TYPES", pre=True)
    def validate_file_types(cls, v):
        """Parse comma-separated file types if provided as string."""
        if isinstance(v, str):
            return [fmt.strip() for fmt in v.split(",")]
        return v
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
