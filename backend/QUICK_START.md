# SynapseAI Backend - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- PostgreSQL 15+
- Redis (optional, for production rate limiting)
- Google Cloud Platform account with enabled services

### 1. Environment Setup

```bash
# Clone the repository
cd /path/to/SynapseAI/MVP/MVP_v0.5/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp env.example .env

# Edit .env with your actual values
nano .env  # or vim .env, or use your favorite editor
```

**Critical Configuration Items:**

```bash
# Generate secure keys
python -c "import secrets; print('SECRET_KEY=' + secrets.token_urlsafe(32))"
python -c "import secrets; print('JWT_SECRET_KEY=' + secrets.token_urlsafe(32))"
python -c "from cryptography.fernet import Fernet; print('ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
python -c "from cryptography.fernet import Fernet; print('FIELD_ENCRYPTION_KEY=' + Fernet.generate_key().decode())"

# Set your database URL
DATABASE_URL=postgresql://username:password@localhost:5432/synapseai

# Set Google Cloud credentials path
GCP_CREDENTIALS_PATH=path/to/your/gcp-credentials.json
```

### 3. Database Setup

```bash
# Create database
createdb synapseai

# Run migrations
alembic upgrade head

# (Optional) Create demo users
python create_demo_users.py
```

### 4. Start the Server

```bash
# Development mode (with auto-reload)
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Production mode
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 5. Access the API

- **API Base URL:** http://localhost:8000
- **API Docs (Swagger UI):** http://localhost:8000/api/v1/docs (only in DEBUG mode)
- **API Docs (ReDoc):** http://localhost:8000/api/v1/redoc (only in DEBUG mode)
- **Health Check:** http://localhost:8000/health

## 📋 API Usage Examples

### Authentication

#### Register a New User
```bash
curl -X POST "http://localhost:8000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePassword123!",
    "role": "doctor"
  }'
```

#### Login
```bash
curl -X POST "http://localhost:8000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doctor@example.com",
    "password": "SecurePassword123!"
  }'
```

**Response:**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "token_type": "bearer",
  "expires_in": 1800
}
```

Save the `access_token` for subsequent requests.

### Patient Management

#### Create a Patient
```bash
curl -X POST "http://localhost:8000/api/v1/patients" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "date_of_birth": "1990-01-15",
    "gender": "male",
    "phone_primary": "+1234567890",
    "email": "john.doe@example.com"
  }'
```

#### Search Patients
```bash
curl -X GET "http://localhost:8000/api/v1/patients/search?query=john+doe" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Consultation Sessions

#### Start a Session
```bash
curl -X POST "http://localhost:8000/api/v1/sessions" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PATIENT_UUID",
    "session_type": "consultation",
    "chief_complaint": "Headache for 3 days"
  }'
```

#### Upload Audio
```bash
curl -X POST "http://localhost:8000/api/v1/sessions/SESSION_ID/audio" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audio_file_url": "https://storage.googleapis.com/bucket/audio.mp3",
    "audio_file_size": 1024000,
    "audio_format": "mp3",
    "audio_duration": 300.5
  }'
```

#### Complete Session
```bash
curl -X POST "http://localhost:8000/api/v1/sessions/SESSION_ID/complete" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Report Generation

#### Generate Report from Session
```bash
curl -X POST "http://localhost:8000/api/v1/sessions/SESSION_ID/generate-report" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "report_type": "consultation"
  }'
```

#### Sign a Report
```bash
curl -X POST "http://localhost:8000/api/v1/reports/REPORT_ID/sign" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Templates

#### Create Custom Template
```bash
curl -X POST "http://localhost:8000/api/v1/templates" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "template_name": "My Custom Template",
    "report_type": "consultation",
    "template_structure": {
      "sections": [
        {"id": "chief_complaint", "title": "Chief Complaint", "required": true},
        {"id": "assessment", "title": "Assessment", "required": true}
      ]
    },
    "ai_prompt_template": "Generate a medical report based on: {transcript_text}"
  }'
```

## 🔒 Security Best Practices

### 1. Environment Variables
- **Never** commit `.env` to version control
- Use different `.env` files for each environment
- Rotate keys regularly
- Use Google Secret Manager in production

### 2. Authentication
- Always use HTTPS in production
- Tokens expire after 30 minutes (configurable)
- Implement refresh token flow
- Enable MFA for sensitive accounts

### 3. Data Protection
- All PII is automatically encrypted at rest
- Search uses SHA-256 hashes
- Passwords use bcrypt (cost factor 12)
- Database connections use SSL in production

### 4. Access Control
- Role-based access control (RBAC)
- Doctors can only access their own patients
- Admins have full access
- Receptionists have limited access

## 🧪 Testing

### Run Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_patients.py
```

### Create Test Data
```bash
# Create demo users
python create_demo_users.py

# Create test patients
python -c "from tests.factories import create_test_patient; create_test_patient()"
```

## 📊 Database Migrations

### Create a New Migration
```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Add new field to patient model"

# Create empty migration
alembic revision -m "Custom migration"
```

### Apply Migrations
```bash
# Upgrade to latest
alembic upgrade head

# Upgrade to specific revision
alembic upgrade abc123

# Downgrade one revision
alembic downgrade -1

# Show current revision
alembic current

# Show migration history
alembic history
```

## 🐛 Debugging

### Enable Debug Mode
```bash
# In .env
DEBUG=True
LOG_LEVEL=DEBUG
DB_ECHO=True  # Log SQL queries
```

### View Logs
```bash
# Application logs
tail -f backend.log

# Database queries (when DB_ECHO=True)
# Visible in console output
```

### Common Issues

#### "Connection refused" error
```bash
# Check if PostgreSQL is running
pg_isready

# Check if Redis is running (if using)
redis-cli ping
```

#### "Invalid encryption key" error
```bash
# Regenerate encryption keys
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

#### "Database migration failed"
```bash
# Drop all tables and recreate (CAUTION: loses data)
alembic downgrade base
alembic upgrade head
```

## 🚢 Deployment

### Using Docker
```bash
# Build image
docker build -t synapseai-backend .

# Run container
docker run -p 8000:8000 --env-file .env synapseai-backend
```

### Using Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop all services
docker-compose down
```

### Manual Deployment
```bash
# Install dependencies
pip install -r requirements.txt

# Run migrations
alembic upgrade head

# Start with Gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

## 📞 Support

### Documentation
- **API Docs:** http://localhost:8000/api/v1/docs
- **Implementation Summary:** See `IMPLEMENTATION_SUMMARY.md`
- **Data Model:** See `DATA_MODEL_AND_ARCHITECTURE.md`

### Troubleshooting
- Check logs in `backend.log`
- Enable DEBUG mode for detailed errors
- Review `IMPLEMENTATION_SUMMARY.md` for known issues

### Contact
- GitHub Issues: [Create an issue]
- Email: support@synapseai.com

---

**Happy Coding! 🎉**

Last Updated: September 30, 2025
