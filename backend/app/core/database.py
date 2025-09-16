"""
Database configuration and session management.
Implements secure database connections with encryption support.
"""

from sqlalchemy import create_engine, MetaData, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
import asyncio
from typing import Generator
import logging

from .config import settings

# Configure logging
logger = logging.getLogger(__name__)

# SQLAlchemy setup
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=settings.DATABASE_POOL_SIZE,
    max_overflow=settings.DATABASE_MAX_OVERFLOW,
    pool_pre_ping=True,  # Verify connections before use
    echo=settings.DEBUG,  # Log SQL queries in debug mode
    # Security: Don't log sensitive data
    echo_pool=False,
    future=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)

# Create base class for declarative models
Base = declarative_base()

# Naming convention for constraints (helpful for migrations)
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s"
}

Base.metadata = MetaData(naming_convention=convention)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency to get database session.
    Ensures proper session cleanup.
    """
    db = SessionLocal()
    try:
        yield db
    except Exception as e:
        logger.error(f"Database session error: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


def create_tables():
    """Create all database tables."""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Failed to create database tables: {str(e)}")
        raise


def drop_tables():
    """Drop all database tables (use with caution)."""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database tables dropped successfully")
    except Exception as e:
        logger.error(f"Failed to drop database tables: {str(e)}")
        raise


# Event listeners for security and audit logging
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set database connection parameters for security."""
    if 'sqlite' in settings.DATABASE_URL:
        # For SQLite (development), enable foreign keys and WAL mode
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA journal_mode=WAL")
        cursor.execute("PRAGMA synchronous=NORMAL")
        cursor.close()


@event.listens_for(engine, "before_cursor_execute")
def log_sql_queries(conn, cursor, statement, parameters, context, executemany):
    """Log SQL queries for audit purposes (production should use structured logging)."""
    if settings.ENABLE_AUDIT_LOGGING and settings.DEBUG:
        logger.debug(f"SQL Query: {statement[:100]}...")  # Truncate for security


class DatabaseHealthCheck:
    """Database health check utilities."""
    
    @staticmethod
    def check_connection() -> bool:
        """Check if database connection is healthy."""
        try:
            with engine.connect() as connection:
                connection.execute("SELECT 1")
            return True
        except Exception as e:
            logger.error(f"Database health check failed: {str(e)}")
            return False
    
    @staticmethod
    def get_connection_info() -> dict:
        """Get database connection information."""
        try:
            with engine.connect() as connection:
                result = connection.execute("SELECT version()")
                version = result.scalar()
            
            return {
                "status": "healthy",
                "version": version,
                "pool_size": engine.pool.size(),
                "checked_out": engine.pool.checkedout(),
                "overflow": engine.pool.overflow(),
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e)
            }


# Initialize health check
db_health = DatabaseHealthCheck()
