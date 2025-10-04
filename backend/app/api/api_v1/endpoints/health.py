"""
Health check endpoints for monitoring and load balancer health checks.
"""

from fastapi import APIRouter
from alembic.config import Config
from alembic.script import ScriptDirectory
from app.core.database import db_health
from pathlib import Path

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


@router.get("/migration")
async def migration_health():
    """Report current Alembic migration version (head vs current)."""
    try:
        alembic_ini = str(Path("backend/alembic.ini")) if Path("backend/alembic.ini").exists() else str(Path("alembic.ini"))
        cfg = Config(alembic_ini)
        script = ScriptDirectory.from_config(cfg)
        head = script.get_current_head()

        # Read current version table directly
        current = None
        try:
            from sqlalchemy import text
            from app.core.database import engine
            with engine.connect() as conn:
                current = conn.execute(text("SELECT version_num FROM alembic_version")).scalar()
        except Exception:
            current = None

        status = "up_to_date" if current == head else "out_of_date"
        return {"status": status, "current": current, "head": head}
    except Exception as e:
        return {"status": "unknown", "error": str(e)}
