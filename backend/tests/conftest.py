"""
Shared test fixtures and configuration.
This file is automatically loaded by pytest.
"""
import pytest
import os
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Set test environment
os.environ["ENVIRONMENT"] = "development"  # Must be development/staging/production
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
os.environ["REDIS_URL"] = "redis://localhost:6379/1"  # Use different DB for tests
os.environ["JWT_SECRET_KEY"] = "test-jwt-secret-key-for-testing-only"
os.environ["SECRET_KEY"] = "test-secret-key-for-testing-only-32"
os.environ["ENCRYPTION_KEY"] = "test-encryption-key-32-bytes-long!"
os.environ["FIELD_ENCRYPTION_KEY"] = "test-field-encryption-key-32-long!"

# Patch JSONB to use JSON for SQLite BEFORE importing models
from sqlalchemy import JSON, TypeDecorator
from sqlalchemy.dialects import postgresql
import sys

# Create a JSONB replacement that works with SQLite
class JSONBCompat(TypeDecorator):
    """JSONB compatibility layer for SQLite"""
    impl = JSON
    cache_ok = True
    
    def __init__(self, *args, **kwargs):
        # Ignore PostgreSQL-specific arguments
        kwargs.pop('astext_type', None)
        super().__init__()

# Replace JSONB with JSON-compatible version
postgresql.JSONB = JSONBCompat

from app.main import app
from app.core.database import Base, get_db

# Create in-memory SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """
    Create a fresh database for each test.
    Uses SQLite in-memory for speed.
    """
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """
    Create a test client with dependency override for database.
    """
    def override_get_db():
        try:
            yield db
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    # Clear overrides after test
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db: Session) -> dict:
    """
    Create a test user and return user data.
    """
    from app.models.user import User
    from app.core.encryption import HashingUtility
    import uuid
    
    user_id = uuid.uuid4()
    user = User(
        id=user_id,
        email="test@example.com",
        password_hash=HashingUtility.hash_password("testpass123"),
        role="doctor",
        is_active=True,
        first_name="Test",
        last_name="Doctor"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return {
        "id": str(user.id),
        "email": user.email,
        "password": "testpass123",  # Plain password for login
        "role": user.role
    }


@pytest.fixture(scope="function")
def auth_headers(client: TestClient, test_user: dict) -> dict:
    """
    Create a test user and return authentication headers.
    """
    # Login to get token
    response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user["email"], "password": test_user["password"]}
    )
    
    assert response.status_code == 200, f"Login failed: {response.json()}"
    token = response.json()["data"]["accessToken"]
    
    return {
        "Authorization": f"Bearer {token}",
        "user_id": test_user["id"]
    }


@pytest.fixture(scope="function")
def test_patient(db: Session, test_user: dict):
    """
    Create a test patient.
    """
    from app.models.patient import Patient
    import uuid
    
    patient_id = uuid.uuid4()
    patient = Patient(
        id=patient_id,
        first_name="Test",
        last_name="Patient",
        date_of_birth="1990-01-01",
        gender="male",
        phone="1234567890",
        email="patient@example.com"
    )
    db.add(patient)
    db.commit()
    db.refresh(patient)
    
    return patient


@pytest.fixture(scope="function")
def test_session(db: Session, test_patient, test_user: dict):
    """
    Create a test consultation session.
    """
    from app.models.session import ConsultationSession
    from datetime import datetime
    import uuid
    
    session_id = uuid.uuid4()
    session = ConsultationSession(
        id=session_id,
        session_id=f"CS-{datetime.now().strftime('%Y%m%d')}-TEST",
        patient_id=test_patient.id,
        doctor_id=uuid.UUID(test_user["id"]),
        chief_complaint="Test complaint",
        session_type="new_patient",
        status="in_progress",
        started_at=datetime.utcnow()
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    
    return session
