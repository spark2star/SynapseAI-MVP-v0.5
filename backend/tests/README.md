# SynapseAI Test Suite

## Overview

Comprehensive unit and integration tests for the SynapseAI backend API.

## Test Structure

```
tests/
├── __init__.py
├── conftest.py              # Shared fixtures and configuration
├── README.md                # This file
├── unit/
│   ├── __init__.py
│   ├── test_auth.py         # Authentication tests (25+ tests)
│   ├── test_patients.py     # Patient management tests (15+ tests)
│   ├── test_consultations.py # Consultation tests (10+ tests)
│   └── test_reports.py      # Report tests (10+ tests)
├── integration/
│   ├── __init__.py
│   └── test_full_flow.py    # End-to-end flow tests
└── fixtures/
    ├── __init__.py
    ├── auth_fixtures.py     # Auth test data
    ├── patient_fixtures.py  # Patient test data
    └── database_fixtures.py # Database fixtures
```

## Running Tests

### Prerequisites

1. **Install Dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Ensure Environment Variables:**
   Tests use in-memory SQLite, but still need valid env vars:
   ```bash
   export ENVIRONMENT=development
   export JWT_SECRET_KEY=test-jwt-secret
   export ENCRYPTION_KEY=test-encryption-key-32-bytes-long!
   export FIELD_ENCRYPTION_KEY=test-field-encryption-key-32-long!
   ```

### Running Tests

**All Tests:**
```bash
pytest tests/
```

**Specific Test File:**
```bash
pytest tests/unit/test_auth.py
```

**Specific Test Class:**
```bash
pytest tests/unit/test_auth.py::TestUserLogin
```

**Specific Test:**
```bash
pytest tests/unit/test_auth.py::TestUserLogin::test_login_success
```

**With Verbose Output:**
```bash
pytest tests/ -v
```

**With Coverage:**
```bash
pytest tests/ --cov=app --cov-report=html --cov-report=term
```

**Stop on First Failure:**
```bash
pytest tests/ -x
```

**Show Print Statements:**
```bash
pytest tests/ -s
```

### Using Docker (Recommended)

```bash
# Build backend with test dependencies
cd infrastructure/docker
docker-compose build backend

# Run tests in container
docker-compose exec backend pytest tests/ -v

# Run with coverage
docker-compose exec backend pytest tests/ --cov=app --cov-report=html

# View coverage report
open backend/htmlcov/index.html
```

## Test Coverage Goals

| Module | Target Coverage | Status |
|--------|----------------|--------|
| Auth | > 80% | ✅ 25+ tests |
| Patients | > 70% | ⏳ 15+ tests |
| Consultations | > 70% | ⏳ 10+ tests |
| Reports | > 70% | ⏳ 10+ tests |
| **Overall** | **> 60%** | **⏳ In Progress** |

## Test Fixtures

### Database Fixtures

- `db`: Fresh in-memory SQLite database for each test
- `client`: FastAPI TestClient with database override
- `test_user`: Pre-created test user
- `auth_headers`: Authentication headers with valid JWT token
- `test_patient`: Pre-created test patient
- `test_session`: Pre-created consultation session

### Usage Example

```python
def test_example(client, auth_headers, test_patient):
    """Test with authenticated client and existing patient"""
    response = client.get(
        f"/api/v1/patients/{test_patient.id}",
        headers=auth_headers
    )
    assert response.status_code == 200
```

## Test Categories

### 1. Authentication Tests (`test_auth.py`)

**Test Classes:**
- `TestUserLogin` - Login functionality
- `TestTokenValidation` - JWT token validation
- `TestPasswordSecurity` - Password hashing and verification
- `TestLogout` - Logout functionality
- `TestHealthCheck` - Health endpoint
- `TestAuthResponseFormat` - CamelCase response format (P0-4)
- `TestAuthErrorHandling` - Error handling and security

**Key Tests:**
- ✅ Successful login with correct credentials
- ✅ Failed login with wrong password
- ✅ Failed login with non-existent user
- ✅ Inactive user cannot login
- ✅ Protected routes require authentication
- ✅ Invalid tokens are rejected
- ✅ Passwords are hashed with bcrypt
- ✅ Password verification works correctly
- ✅ Responses use camelCase format
- ✅ SQL injection attempts are handled safely
- ✅ XSS attempts are sanitized

### 2. Patient Tests (`test_patients.py`)

**Test Classes:**
- `TestPatientCreation` - Creating patients
- `TestPatientList` - Listing with pagination
- `TestPatientRetrieval` - Getting single patient
- `TestPatientSearch` - Search functionality
- `TestPatientAccessControl` - Authorization

**Key Tests:**
- Patient creation with valid data
- Validation of required fields
- Pagination works correctly (P0-3)
- CamelCase response format (P0-4)
- Search by name
- Access control enforcement

### 3. Consultation Tests (`test_consultations.py`)

**Test Classes:**
- `TestStartConsultation` - Starting sessions
- `TestStopConsultation` - Ending sessions
- `TestConsultationHistory` - History retrieval

**Key Tests:**
- Start consultation successfully
- Stop consultation and update status
- Get consultation history with pagination
- Access control for consultations

### 4. Report Tests (`test_reports.py`)

**Test Classes:**
- `TestReportList` - Listing reports
- `TestReportDetail` - Report detail endpoint (P1-2)
- `TestReportGeneration` - Generating reports

**Key Tests:**
- List reports with pagination
- Get full report detail
- Report includes diagnoses, medications, recommendations
- Access control for reports
- CamelCase response format

### 5. Integration Tests (`test_full_flow.py`)

**End-to-End Scenarios:**
- Complete patient journey: Registration → Consultation → Report
- Multi-step workflows
- Data consistency across endpoints

## Writing New Tests

### Test Naming Convention

```python
def test_<action>_<expected_result>(self, fixtures):
    """Descriptive docstring explaining what is being tested"""
    # Arrange
    # Act
    # Assert
```

### Example Test

```python
class TestPatientCreation:
    """Test patient creation functionality"""
    
    def test_create_patient_with_valid_data_succeeds(self, client, auth_headers):
        """Test that creating a patient with valid data returns 200"""
        # Arrange
        patient_data = {
            "name": "John Doe",
            "age": 35,
            "sex": "Male",
            "phone": "1234567890"
        }
        
        # Act
        response = client.post(
            "/api/v1/intake/patients",
            json=patient_data,
            headers=auth_headers
        )
        
        # Assert
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "id" in response.json()["data"]
```

### Best Practices

1. **Use Descriptive Test Names:** Test name should explain what is being tested
2. **One Assertion Per Test:** Focus on testing one thing
3. **Use Fixtures:** Reuse common setup via fixtures
4. **Test Edge Cases:** Not just happy paths
5. **Test Error Handling:** Verify proper error responses
6. **Clean Up:** Fixtures handle cleanup automatically
7. **Isolate Tests:** Each test should be independent

## Continuous Integration

### GitHub Actions (Future)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.11
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest tests/ --cov=app --cov-report=xml
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Troubleshooting

### Common Issues

**1. Import Errors:**
```bash
# Ensure PYTHONPATH is set
export PYTHONPATH=/path/to/backend:$PYTHONPATH
pytest tests/
```

**2. Database Errors:**
```bash
# Tests use in-memory SQLite, no external DB needed
# If you see DB errors, check conftest.py configuration
```

**3. Environment Variable Errors:**
```bash
# Ensure all required env vars are set in conftest.py
# Check app/core/config.py for required variables
```

**4. Module Not Found:**
```bash
# Reinstall dependencies
pip install -r requirements.txt

# Or use Docker
docker-compose build backend
docker-compose exec backend pytest tests/
```

## Current Status

### ✅ Completed (Day 1)

- [x] Test infrastructure setup
- [x] Test directory structure
- [x] `conftest.py` with fixtures
- [x] Auth test suite (25+ tests)
- [x] Testing dependencies added to requirements.txt

### ⏳ Pending (Days 2-3)

- [ ] Run auth tests and verify coverage
- [ ] Patient test suite (15+ tests)
- [ ] Consultation test suite (10+ tests)
- [ ] Report test suite (10+ tests)
- [ ] Integration tests
- [ ] Coverage report > 60%

## Next Steps

1. **Run Tests with Docker:**
   ```bash
   cd infrastructure/docker
   docker-compose up -d
   docker-compose exec backend pytest tests/unit/test_auth.py -v
   ```

2. **Complete Day 2 Tests:**
   - Create `test_patients.py`
   - Create `test_consultations.py`

3. **Complete Day 3 Tests:**
   - Create `test_reports.py`
   - Create `test_full_flow.py`
   - Generate coverage report

4. **Integrate with CI/CD:**
   - Add to GitHub Actions
   - Set up code coverage reporting

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)
- [Coverage.py](https://coverage.readthedocs.io/)

---

**Last Updated:** October 4, 2025  
**Test Coverage:** Auth module complete (25+ tests), others pending  
**Status:** Day 1 complete, ready for Docker testing
