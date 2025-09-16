# Getting Started with Intelligent EMR System

Welcome to the next-generation EMR system with **Privacy by Design**! This guide will help you set up and run the system locally.

## ✅ **Phase 1 MVP - Ready to Use!**

The system includes:
- 🔐 **Complete Authentication System** (JWT, Role-based access, MFA-ready)
- 🏥 **Patient Management** (Encrypted demographics, search, CRUD operations)
- 📊 **Dashboard Interface** (Modern, trustworthy sky-blue design)
- 🛡️ **Security by Design** (Field-level encryption, HIPAA compliance, audit logging)
- 🐳 **Docker Development Environment** (PostgreSQL, Redis, all services)

## 🚀 **Quick Start (5 minutes)**

### Prerequisites
- Docker Desktop installed and running
- Git
- 8GB RAM available for containers

### 1. Clone and Setup
```bash
# Clone the repository
git clone <repository-url>
cd MVP_v0.5

# Make setup script executable (if not already)
chmod +x scripts/setup-dev.sh

# Run the automated setup
./scripts/setup-dev.sh
```

### 2. Access the Application
After setup completes, access:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/v1/docs
- **Database Admin**: http://localhost:5050 (admin@emr.com / admin123)

### 3. Login with Demo Accounts
The system includes demo accounts for testing:

| Role | Email | Password |
|------|-------|----------|
| Doctor | doctor@demo.com | password123 |
| Admin | admin@demo.com | password123 |
| Receptionist | reception@demo.com | password123 |

## 🏥 **Core Features Walkthrough**

### Patient Registration Workflow
1. **Login** → Use demo credentials above
2. **Dashboard** → Click "New Patient" or navigate to Patients → New
3. **Register Patient** → Fill out the secure, multi-step form
4. **Search & Manage** → Find patients using encrypted search
5. **View Details** → Access complete patient information

### Security Features in Action
- **Encrypted Storage**: All PII data encrypted at field level
- **Audit Logging**: Every action logged for compliance
- **Role-Based Access**: Different permissions by user role
- **Secure Authentication**: JWT tokens with refresh mechanism

## 🛠️ **Development Environment**

### Project Structure
```
MVP_v0.5/
├── backend/           # FastAPI backend with encryption
├── frontend/          # Next.js 14 frontend (sky blue design)
├── infrastructure/    # Docker, Terraform, K8s configs
├── scripts/           # Setup and deployment scripts
└── docs/             # Documentation
```

### Backend Stack
- **FastAPI** - High-performance Python web framework
- **PostgreSQL** - Encrypted database with field-level encryption  
- **Redis** - Session management and caching
- **SQLAlchemy** - ORM with encryption decorators
- **Alembic** - Database migrations

### Frontend Stack
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling with medical theme
- **React Hook Form** - Form handling with validation
- **Zustand** - State management
- **Heroicons** - Professional icon set

## 🔧 **Manual Development Setup**

If you prefer manual setup instead of the automated script:

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run migrations
alembic upgrade head

# Start backend
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local
# Edit with your settings

# Start frontend
npm run dev
```

### Database Setup
```bash
# Start PostgreSQL and Redis with Docker
cd infrastructure/docker
docker-compose up -d postgres redis
```

## 📊 **Key Features Implemented**

### ✅ Authentication & Security
- JWT-based authentication with refresh tokens
- Role-based access control (Admin/Doctor/Receptionist)
- Field-level encryption for all PII data
- Comprehensive audit logging for HIPAA compliance
- Security headers and CORS protection
- Rate limiting and DDoS protection

### ✅ Patient Management
- Encrypted patient demographics
- Multi-step registration form with validation
- Privacy-preserving search using hashed identifiers
- Complete patient CRUD operations
- Secure data export capabilities

### ✅ User Interface
- Modern, trustworthy sky-blue design system
- Responsive design for all devices
- Accessibility features built-in
- Loading states and error handling
- Professional medical aesthetic

### ✅ Development Environment
- Docker-based local development
- Database migrations with Alembic
- Hot reload for frontend and backend
- Development tools (PgAdmin, Redis Commander)
- Comprehensive logging and monitoring

## 🔍 **Testing the System**

### Basic Workflow Test
1. **Start Services**: `./scripts/setup-dev.sh`
2. **Login**: Visit http://localhost:3000, use demo credentials
3. **Create Patient**: Navigate to Patients → New Patient
4. **Fill Form**: Complete the multi-step registration form
5. **Search Patient**: Use the search functionality to find patients
6. **View Dashboard**: Check the overview statistics

### API Testing
- **API Docs**: Visit http://localhost:8000/api/v1/docs
- **Health Check**: GET http://localhost:8000/health
- **Authentication**: POST http://localhost:8000/api/v1/auth/login

## 📋 **Next Development Steps**

### Phase 2 Features (Weeks 5-8)
- [ ] Consultation session recording
- [ ] Speech-to-text integration (Google STT)
- [ ] AI report generation (Gemini 2.5 Flash)
- [ ] Appointment scheduling calendar
- [ ] Billing and invoice generation
- [ ] Advanced template customization

### Phase 3 Features (Weeks 9-12)
- [ ] Event-driven architecture (Pub/Sub)
- [ ] AI agent plugin system
- [ ] Analytics dashboard
- [ ] Performance optimization
- [ ] Multi-tenant architecture

## 🚨 **Important Security Notes**

- **Demo Environment**: Current setup is for development only
- **Production Deployment**: Requires proper secret management
- **Data Encryption**: All sensitive data encrypted at field level
- **Audit Compliance**: Full audit trail for HIPAA requirements
- **Access Control**: Role-based permissions enforced throughout

## 💡 **Troubleshooting**

### Common Issues

**Services won't start:**
```bash
# Check Docker is running
docker --version
docker-compose --version

# Restart services
cd infrastructure/docker
docker-compose down
docker-compose up -d
```

**Database connection errors:**
```bash
# Check database status
cd infrastructure/docker
docker-compose exec postgres pg_isready -U emr_user -d emr_db

# View database logs
docker-compose logs postgres
```

**Frontend won't connect to backend:**
- Check `NEXT_PUBLIC_API_URL` in frontend/.env.local
- Ensure backend is running on port 8000
- Verify CORS settings in backend configuration

**Port conflicts:**
- Frontend: 3000 (change in package.json)
- Backend: 8000 (change in backend/.env)
- PostgreSQL: 5432 (change in docker-compose.yml)
- Redis: 6379 (change in docker-compose.yml)

### Getting Help
- Check application logs: `docker-compose logs [service-name]`
- View API documentation: http://localhost:8000/api/v1/docs
- Inspect database: http://localhost:5050 (PgAdmin)
- Monitor Redis: http://localhost:8081 (Redis Commander)

## 📞 **Support**

For issues or questions:
1. Check this documentation first
2. Review the API documentation
3. Check Docker logs for error messages
4. Ensure all prerequisites are installed

## 🎉 **Success!**

You now have a fully functional, secure EMR system with:
- **Privacy by Design** - All data encrypted
- **HIPAA Compliance** - Complete audit trails  
- **Modern Interface** - Professional medical UI
- **Production Ready** - Scalable architecture
- **Developer Friendly** - Hot reload, documentation, tooling

Ready to revolutionize healthcare data management! 🏥✨
