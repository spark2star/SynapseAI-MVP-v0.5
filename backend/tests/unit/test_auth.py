"""
Unit tests for authentication endpoints.

Tests:
- User registration
- Login (success and failure)
- Token validation
- Password hashing
- Rate limiting
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestUserLogin:
    """Test user login flow"""
    
    def test_login_success(self, client: TestClient, test_user: dict):
        """Test successful login with correct credentials"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "accessToken" in data["data"]
        assert "refreshToken" in data["data"]
        assert data["data"]["tokenType"] == "bearer"
    
    def test_login_wrong_password_fails(self, client: TestClient, test_user: dict):
        """Test that wrong password fails"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": "wrongpassword"}
        )
        
        assert response.status_code == 401
        error_msg = response.json()["error"]["message"].lower()
        assert "invalid" in error_msg or "incorrect" in error_msg
    
    def test_login_nonexistent_user_fails(self, client: TestClient):
        """Test that login with non-existent user fails"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "anypass"}
        )
        
        assert response.status_code == 401
    
    def test_login_inactive_user_fails(self, client: TestClient, db: Session):
        """Test that inactive users cannot login"""
        from app.models.user import User
        from app.core.security import get_password_hash
        import uuid
        
        user = User(
            id=uuid.uuid4(),
            email="inactive@example.com",
            password_hash=get_password_hash("pass123"),
            role="doctor",
            is_active=False,  # Inactive
            full_name="Inactive User"
        )
        db.add(user)
        db.commit()
        
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "inactive@example.com", "password": "pass123"}
        )
        
        assert response.status_code in [401, 403]
    
    def test_login_missing_email_fails(self, client: TestClient):
        """Test that missing email causes validation error"""
        response = client.post(
            "/api/v1/auth/login",
            json={"password": "somepass"}
        )
        
        assert response.status_code == 422
    
    def test_login_missing_password_fails(self, client: TestClient):
        """Test that missing password causes validation error"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com"}
        )
        
        assert response.status_code == 422
    
    def test_login_empty_credentials_fails(self, client: TestClient):
        """Test that empty credentials fail"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": "", "password": ""}
        )
        
        assert response.status_code == 422


class TestTokenValidation:
    """Test JWT token validation"""
    
    def test_access_protected_route_without_token_fails(self, client: TestClient):
        """Test that protected routes require authentication"""
        response = client.get("/api/v1/patients/list/")
        assert response.status_code == 401
    
    def test_access_protected_route_with_invalid_token_fails(self, client: TestClient):
        """Test that invalid tokens are rejected"""
        response = client.get(
            "/api/v1/patients/list/",
            headers={"Authorization": "Bearer invalid_token_here"}
        )
        assert response.status_code == 401
    
    def test_access_protected_route_with_valid_token_succeeds(self, client: TestClient, auth_headers: dict):
        """Test that valid tokens grant access"""
        response = client.get("/api/v1/patients/list/", headers=auth_headers)
        assert response.status_code == 200
    
    def test_access_without_bearer_prefix_fails(self, client: TestClient, auth_headers: dict):
        """Test that token without 'Bearer' prefix fails"""
        token = auth_headers["Authorization"].replace("Bearer ", "")
        response = client.get(
            "/api/v1/patients/list/",
            headers={"Authorization": token}
        )
        assert response.status_code == 401
    
    def test_expired_token_fails(self, client: TestClient):
        """Test that expired tokens are rejected"""
        # Use a token that's already expired
        expired_token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyMzkwMjJ9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
        
        response = client.get(
            "/api/v1/patients/list/",
            headers={"Authorization": f"Bearer {expired_token}"}
        )
        assert response.status_code == 401


class TestPasswordSecurity:
    """Test password hashing and security"""
    
    def test_password_is_hashed(self, db: Session):
        """Test that passwords are hashed, not stored in plaintext"""
        from app.models.user import User
        from app.core.encryption import HashingUtility
        import uuid
        
        plain_password = "MySecretPass123!"
        user = User(
            id=uuid.uuid4(),
            email="hash@example.com",
            password_hash=HashingUtility.hash_password(plain_password),
            role="doctor",
            is_active=True,
            full_name="Hash Test"
        )
        db.add(user)
        db.commit()
        
        # Verify password is not stored in plaintext
        assert user.password_hash != plain_password
        # Verify it's a bcrypt hash (starts with $2b$)
        assert user.password_hash.startswith("$2b$")
    
    def test_password_verification_works(self):
        """Test that password verification correctly validates passwords"""
        from app.core.encryption import HashingUtility
        
        password = "TestPass123!"
        hashed = HashingUtility.hash_password(password)
        
        # Correct password verifies
        assert HashingUtility.verify_password(password, hashed) is True
        
        # Wrong password doesn't verify
        assert HashingUtility.verify_password("WrongPass", hashed) is False
    
    def test_same_password_different_hashes(self):
        """Test that same password generates different hashes (salt)"""
        from app.core.encryption import HashingUtility
        
        password = "SamePassword123!"
        hash1 = HashingUtility.hash_password(password)
        hash2 = HashingUtility.hash_password(password)
        
        # Hashes should be different due to salt
        assert hash1 != hash2


class TestLogout:
    """Test logout functionality"""
    
    def test_logout_success(self, client: TestClient, auth_headers: dict):
        """Test successful logout"""
        response = client.post("/api/v1/auth/logout", headers=auth_headers)
        
        # Logout should succeed (200 or 204)
        assert response.status_code in [200, 204]
    
    def test_logout_without_auth_fails(self, client: TestClient):
        """Test that logout without auth fails"""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 401


class TestHealthCheck:
    """Test health check endpoint"""
    
    def test_health_check_returns_200(self, client: TestClient):
        """Test that health check endpoint is accessible"""
        response = client.get("/health")
        assert response.status_code == 200
    
    def test_health_check_returns_status(self, client: TestClient):
        """Test that health check returns status"""
        response = client.get("/health")
        data = response.json()
        assert "status" in data
        assert data["status"] == "healthy"


class TestAuthResponseFormat:
    """Test that auth responses follow camelCase format (P0-4)"""
    
    def test_login_response_uses_camelcase(self, client: TestClient, test_user: dict):
        """Test that login response uses camelCase"""
        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user["email"], "password": test_user["password"]}
        )
        
        assert response.status_code == 200
        data = response.json()["data"]
        
        # Check camelCase fields
        assert "accessToken" in data
        assert "refreshToken" in data
        assert "tokenType" in data
        
        # Ensure snake_case not present
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert "token_type" not in data


class TestAuthErrorHandling:
    """Test error handling in auth endpoints"""
    
    def test_login_with_invalid_json_fails(self, client: TestClient):
        """Test that invalid JSON is handled gracefully"""
        response = client.post(
            "/api/v1/auth/login",
            data="not json",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [400, 422]
    
    def test_login_with_sql_injection_attempt_fails(self, client: TestClient):
        """Test that SQL injection attempts are handled safely"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "admin' OR '1'='1",
                "password": "password' OR '1'='1"
            }
        )
        # Should fail authentication, not cause SQL error
        assert response.status_code == 401
    
    def test_login_with_xss_attempt_sanitized(self, client: TestClient):
        """Test that XSS attempts are sanitized"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "<script>alert('xss')</script>@example.com",
                "password": "password"
            }
        )
        # Should fail validation or authentication
        assert response.status_code in [401, 422]
