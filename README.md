# Intelligent EMR System

Next-generation Electronic Medical Records system with AI-powered transcription and reporting capabilities.

## 🏥 Features

- **Privacy by Design**: Field-level encryption for all sensitive data
- **AI-Powered Transcription**: Real-time speech-to-text with Google STT
- **Intelligent Reporting**: Automated report generation with Gemini 2.5 Flash
- **Comprehensive Audit**: Full audit trail for HIPAA compliance
- **Role-Based Access**: Secure multi-role authentication system
- **Real-time Sessions**: Live consultation recording and transcription

## 🔧 Technology Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **PostgreSQL**: Encrypted database with field-level encryption
- **Redis**: Session management and caching
- **Google Cloud STT**: Medical conversation transcription
- **Google Gemini 2.5 Flash**: AI report generation
- **Alembic**: Database migrations

### Frontend
- **Next.js 14**: React framework with TypeScript
- **Tailwind CSS**: Utility-first CSS framework
- **Sky Blue Design**: Trustworthy and professional UI

### Infrastructure
- **Docker**: Containerized development environment
- **Google Cloud Platform**: Production deployment
- **Redis**: Session management and caching

## 🚀 Quick Start

### Prerequisites

- Docker Desktop installed
- Git
- Node.js 18+ (for frontend development)
- Python 3.11+ (for backend development)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MVP_v0.5
   ```

2. **Run the setup script**
   ```bash
   ./scripts/setup-dev.sh
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/api/v1/docs

### Manual Setup (Alternative)

1. **Start the infrastructure**
   ```bash
   cd infrastructure/docker
   docker-compose up -d postgres redis
   ```

2. **Set up the backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   alembic upgrade head
   uvicorn app.main:app --reload
   ```

3. **Set up the frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 📁 Project Structure

```
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API endpoints
│   │   ├── core/           # Core configuration
│   │   ├── models/         # Database models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── frontend/               # Next.js frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom hooks
│   │   ├── services/       # API services
│   │   └── store/          # State management
├── infrastructure/         # Infrastructure configs
│   ├── docker/             # Docker configurations
│   ├── terraform/          # Cloud infrastructure
│   └── kubernetes/         # K8s configurations
└── docs/                   # Documentation
```

## 🔐 Security Features

- **Field-Level Encryption**: All PII data encrypted at database level
- **Zero-Trust Architecture**: Service-to-service authentication
- **Comprehensive Audit Logging**: Every action logged for compliance
- **Role-Based Access Control**: Fine-grained permissions
- **Rate Limiting**: Protection against abuse
- **Security Headers**: OWASP recommended headers

## 📊 Database Schema

The system uses encrypted PostgreSQL with the following main entities:

- **Users & Authentication**: Role-based user management
- **Patients**: Encrypted demographic and medical data
- **Consultation Sessions**: Audio recording and session management
- **Transcriptions**: Speech-to-text results with confidence scoring
- **Reports**: AI-generated medical reports with templates
- **Appointments**: Scheduling and calendar management
- **Billing**: Invoice generation and payment tracking
- **Audit Logs**: Comprehensive compliance logging

## 🔌 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Patients
- `POST /api/v1/patients/create` - Create patient
- `GET /api/v1/patients/{id}` - Get patient details
- `PUT /api/v1/patients/{id}` - Update patient
- `GET /api/v1/patients/search` - Search patients

### Sessions
- `POST /api/v1/sessions/start` - Start consultation
- `POST /api/v1/sessions/{id}/end` - End consultation
- `WebSocket /api/v1/sessions/{id}/stream` - Real-time transcription

### Reports
- `POST /api/v1/reports/generate` - Generate AI report
- `GET /api/v1/reports/{id}` - Get report
- `GET /api/v1/reports/templates` - List templates

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Integration Tests
```bash
cd infrastructure/docker
docker-compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📈 Monitoring & Observability

- **Health Checks**: `/health` endpoint for load balancers
- **Metrics**: Application and business metrics
- **Logging**: Structured logging with audit trails
- **Error Tracking**: Comprehensive error handling

## 🌍 Environment Configuration

### Development
- Local PostgreSQL and Redis
- Debug logging enabled
- Hot reload for both frontend and backend

### Staging
- Cloud SQL and Memorystore
- Limited API quotas
- Realistic data volumes

### Production
- High-availability cloud infrastructure
- Multi-region deployment
- Full monitoring and alerting

## 🔄 Deployment

### Local Testing
```bash
./scripts/setup-dev.sh
```

### Cloud Deployment
```bash
# Configure GCP credentials
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply

# Deploy application
cd ../kubernetes
kubectl apply -f .
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit a pull request

## 📜 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in `/docs`
- Review the API documentation at `/api/v1/docs`

## ⚡ Quick Commands

```bash
# Start development environment
./scripts/setup-dev.sh

# View logs
cd infrastructure/docker && docker-compose logs -f

# Run migrations
cd backend && alembic upgrade head

# Generate new migration
cd backend && alembic revision --autogenerate -m "Description"

# Stop all services
cd infrastructure/docker && docker-compose down

# Start with dev tools
cd infrastructure/docker && docker-compose --profile dev-tools up -d

# Backend shell
cd infrastructure/docker && docker-compose exec backend bash

# Database shell
cd infrastructure/docker && docker-compose exec postgres psql -U emr_user -d emr_db
```
