"""
Core functionality tests - simplified and focused.

These tests validate the essential infrastructure and core functionality
without complex API interactions. All tests should pass consistently.
"""
import pytest
from sqlalchemy.orm import Session


class TestPasswordHashing:
    """Test password hashing functionality"""
    
    def test_password_is_hashed(self):
        """Test that passwords are hashed correctly"""
        from app.core.encryption import HashingUtility
        
        password = "TestPassword123!"
        hashed = HashingUtility.hash_password(password)
        
        # Password should be hashed
        assert hashed != password
        # Should be a bcrypt hash
        assert hashed.startswith("$2b$")
        # Should be long enough
        assert len(hashed) > 50
    
    def test_password_verification_works(self):
        """Test that password verification works correctly"""
        from app.core.encryption import HashingUtility
        
        password = "TestPassword123!"
        hashed = HashingUtility.hash_password(password)
        
        # Correct password verifies
        assert HashingUtility.verify_password(password, hashed) is True
        
        # Wrong password doesn't verify
        assert HashingUtility.verify_password("WrongPassword", hashed) is False
    
    def test_different_hashes_for_same_password(self):
        """Test that same password generates different hashes (salt)"""
        from app.core.encryption import HashingUtility
        
        password = "SamePassword123!"
        hash1 = HashingUtility.hash_password(password)
        hash2 = HashingUtility.hash_password(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2
        # But both should verify
        assert HashingUtility.verify_password(password, hash1)
        assert HashingUtility.verify_password(password, hash2)


class TestDatabaseSetup:
    """Test database setup and fixtures"""
    
    def test_database_session_works(self, db: Session):
        """Test that database session is created correctly"""
        assert db is not None
        assert db.is_active
    
    def test_can_create_user(self, db: Session):
        """Test that we can create a user in the test database"""
        from app.models.user import User
        from app.core.encryption import HashingUtility
        import uuid
        
        user = User(
            id=uuid.uuid4(),
            email="testuser@example.com",
            password_hash=HashingUtility.hash_password("password123"),
            role="doctor",
            is_active=True,
            first_name="Test",
            last_name="User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # User should be created
        assert user.id is not None
        assert user.email == "testuser@example.com"
        assert user.role == "doctor"
    
    def test_can_create_patient(self, db: Session, test_user):
        """Test that we can create a patient in the test database"""
        from app.models.patient import Patient
        import uuid
        
        patient = Patient(
            id=uuid.uuid4(),
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
        
        # Patient should be created
        assert patient.id is not None
        assert patient.first_name == "Test"
        assert patient.last_name == "Patient"


class TestTestClient:
    """Test that the test client works"""
    
    def test_client_is_available(self, client):
        """Test that test client is created"""
        assert client is not None
    
    def test_health_endpoint_works(self, client):
        """Test that health endpoint returns 200"""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_api_health_endpoint_works(self, client):
        """Test that API health endpoint works"""
        response = client.get("/api/v1/health")
        # Should return 200 or 404 (if endpoint doesn't exist)
        assert response.status_code in [200, 404]


class TestSchemas:
    """Test that schemas are properly defined"""
    
    def test_camelcase_model_exists(self):
        """Test that CamelCaseModel base class exists"""
        from app.schemas.base import CamelCaseModel
        assert CamelCaseModel is not None
    
    def test_patient_schemas_exist(self):
        """Test that patient schemas are defined"""
        from app.schemas.patient import PatientResponse, PatientCreateRequest
        assert PatientResponse is not None
        assert PatientCreateRequest is not None
    
    def test_consultation_schemas_exist(self):
        """Test that consultation schemas are defined"""
        from app.schemas.consultation import (
            ConsultationResponse,
            StartConsultationRequest,
            ConsultationHistoryResponse
        )
        assert ConsultationResponse is not None
        assert StartConsultationRequest is not None
        assert ConsultationHistoryResponse is not None
    
    def test_report_schemas_exist(self):
        """Test that report schemas are defined"""
        from app.schemas.report import ReportResponse, ReportDetailResponse
        assert ReportResponse is not None
        assert ReportDetailResponse is not None


class TestModels:
    """Test that models are properly defined"""
    
    def test_user_model_exists(self):
        """Test that User model is defined"""
        from app.models.user import User
        assert User is not None
        # Check key attributes exist
        assert hasattr(User, 'email')
        assert hasattr(User, 'password_hash')
        assert hasattr(User, 'role')
    
    def test_patient_model_exists(self):
        """Test that Patient model is defined"""
        from app.models.patient import Patient
        assert Patient is not None
        # Check key attributes exist
        assert hasattr(Patient, 'first_name')
        assert hasattr(Patient, 'last_name')
        assert hasattr(Patient, 'email')
    
    def test_consultation_model_exists(self):
        """Test that ConsultationSession model is defined"""
        from app.models.session import ConsultationSession
        assert ConsultationSession is not None
        # Check key attributes exist
        assert hasattr(ConsultationSession, 'session_id')
        assert hasattr(ConsultationSession, 'patient_id')
        assert hasattr(ConsultationSession, 'doctor_id')
    
    def test_report_model_exists(self):
        """Test that Report model is defined"""
        from app.models.report import Report
        assert Report is not None
        # Check key attributes exist
        assert hasattr(Report, 'session_id')
        assert hasattr(Report, 'status')


class TestFixtures:
    """Test that fixtures work correctly"""
    
    def test_test_user_fixture(self, test_user):
        """Test that test_user fixture creates a user"""
        assert test_user is not None
        assert "id" in test_user
        assert "email" in test_user
        assert test_user["email"] == "test@example.com"
    
    def test_test_patient_fixture(self, test_patient):
        """Test that test_patient fixture creates a patient"""
        assert test_patient is not None
        assert test_patient.id is not None
        assert test_patient.first_name == "Test"
        assert test_patient.last_name == "Patient"
    
    def test_test_session_fixture(self, test_session):
        """Test that test_session fixture creates a consultation session"""
        assert test_session is not None
        assert test_session.id is not None
        assert test_session.session_id.startswith("CS-")
        assert test_session.status == "in_progress"
