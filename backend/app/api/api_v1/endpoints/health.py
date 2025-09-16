"""
Health check endpoints for monitoring and load balancer health checks.
"""

from fastapi import APIRouter
from app.core.database import db_health

router = APIRouter()


@router.get("/check")
async def health_check():
    """Detailed health check endpoint."""
    db_status = db_health.get_connection_info()
    
    return {
        "status": "healthy" if db_status["status"] == "healthy" else "unhealthy",
        "checks": {
            "database": db_status
        }
    }


@router.get("/ready")
async def readiness_check():
    """Kubernetes readiness probe endpoint."""
    if db_health.check_connection():
        return {"status": "ready"}
    else:
        return {"status": "not_ready"}


@router.get("/live")
async def liveness_check():
    """Kubernetes liveness probe endpoint."""
    return {"status": "alive"}
