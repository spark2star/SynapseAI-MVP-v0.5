"""
Main FastAPI application entry point.
Implements secure EMR system with privacy by design.
"""

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import time
import logging
from contextlib import asynccontextmanager
from pathlib import Path

from app.core.config import settings
from app.core.database import create_tables, db_health
from app.api.api_v1.api import api_router
from app.api.websocket.transcribe import router as transcribe_router
from app.core.security import SecurityHeaders
from app.core.audit import audit_logger
from app.core.exceptions import register_exception_handlers
from app.core.logging_config import setup_logging
from app.core.middleware import RequestIDMiddleware, ErrorLoggingMiddleware
from app.core.rate_limit import limiter, rate_limit_handler, RateLimitExceeded
import app.models  # Ensure all models are registered before create_tables


# Setup structured logging (P0-5)
logger = setup_logging(log_level=settings.LOG_LEVEL.upper())


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown."""
    # Startup
    logger.info("Starting EMR System...")
    
    # Create database tables
    try:
        create_tables()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {str(e)}")
        raise
    
    # Check database health
    if not db_health.check_connection():
        logger.error("Database health check failed")
        raise Exception("Database connection failed")
    
    logger.info("EMR System started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down EMR System...")


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.VERSION,
    description="Next-generation EMR system with AI-powered transcription and reporting",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json" if settings.DEBUG else None,
    docs_url=f"{settings.API_V1_PREFIX}/docs" if settings.DEBUG else None,
    redoc_url=f"{settings.API_V1_PREFIX}/redoc" if settings.DEBUG else None,
    lifespan=lifespan
)

# Register exception handlers
register_exception_handlers(app)

# Add rate limiter (P1-1)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_handler)

# Add structured logging middleware (P0-5) - Order matters!
app.add_middleware(ErrorLoggingMiddleware)
app.add_middleware(RequestIDMiddleware)

# Security Middleware
app.add_middleware(SecurityHeaders)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=settings.ALLOWED_METHODS,
    allow_headers=settings.ALLOWED_HEADERS,
)

# Trusted Host Middleware (production security)
if settings.ENVIRONMENT == "production":
    app.add_middleware(
        TrustedHostMiddleware,
        allowed_hosts=settings.ALLOWED_ORIGINS
    )


app.include_router(api_router, prefix=settings.API_V1_PREFIX)
app.include_router(transcribe_router, prefix="/api/v1", tags=["websocket", "transcription"])


# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    """Add processing time to response headers."""
    start_time = time.time()
    
    # Log request for audit
    if settings.ENABLE_AUDIT_LOGGING:
        await audit_logger.log_request(request)
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response for audit
    if settings.ENABLE_AUDIT_LOGGING:
        await audit_logger.log_response(request, response, process_time)
    
    return response


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unhandled exceptions globally."""
    logger.error(f"Unhandled exception: {str(exc)}", exc_info=True)
    
    # Log security incident
    if settings.ENABLE_AUDIT_LOGGING:
        await audit_logger.log_security_event(
            event_type="unhandled_exception",
            request=request,
            details={"error": str(exc)}
        )
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "status": "error",
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An internal server error occurred",
                "details": {} if settings.ENVIRONMENT == "production" else {"error": str(exc)}
            },
            "metadata": {
                "timestamp": time.time(),
                "version": settings.VERSION
            }
        }
    )


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint for load balancers."""
    db_status = db_health.get_connection_info()
    
    return {
        "status": "healthy" if db_status["status"] == "healthy" else "unhealthy",
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "timestamp": time.time()
    }


# WebSocket transcription health check (for testing)
@app.get("/api/v1/transcribe/health")
async def transcribe_health_check():
    """Health check for WebSocket transcription endpoint."""
    return {
        "status": "ok",
        "websocket_path": "/api/v1/transcribe",
        "message": "WebSocket transcription endpoint is available"
    }


# Include API routes
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

# Include WebSocket routes - FIXED: Use /api/v1 prefix to match frontend
app.include_router(
    transcribe_router,
    prefix="/api/v1",  # Changed from "/ws" to match frontend URL
    tags=["websocket", "transcription"]
)

# Mount static files directory for logo uploads
static_dir = Path("./static")
static_dir.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with system information."""
    return {
        "name": settings.APP_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "api_version": "v1",
        "docs_url": f"{settings.API_V1_PREFIX}/docs" if settings.DEBUG else None
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )
