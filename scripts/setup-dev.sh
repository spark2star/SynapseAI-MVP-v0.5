#!/bin/bash

# Development environment setup script for EMR System
# This script sets up the local development environment

set -e  # Exit on any error

echo "🏥 EMR System - Development Setup"
echo "================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker Desktop first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not available. Please install Docker Compose."
    exit 1
fi

# Set Docker Compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo "✅ Docker is available"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/logs
mkdir -p backend/uploads
mkdir -p infrastructure/docker/init-scripts

# Copy environment file if it doesn't exist
if [ ! -f backend/.env ]; then
    echo "📝 Creating environment file..."
    cat > backend/.env << EOF
# Database Configuration
DATABASE_URL=postgresql://emr_user:emr_password@localhost:5432/emr_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10

# Redis Configuration
REDIS_URL=redis://localhost:6379/0
REDIS_SESSION_DB=1

# JWT Configuration
JWT_SECRET_KEY=dev-jwt-secret-key-change-this-in-production-with-secure-random-string
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7

# Encryption Keys (Use Google Cloud KMS in production)
ENCRYPTION_KEY=dev-encryption-key-32-bytes-long-change-in-production!
FIELD_ENCRYPTION_KEY=dev-field-encryption-key-32-bytes-change-in-production!

# Security Configuration
SECRET_KEY=dev-secret-app-key-change-this-in-production-with-secure-random-string
BCRYPT_ROUNDS=12
MFA_ISSUER=EMR-System-Dev

# API Configuration
API_V1_PREFIX=/api/v1
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "http://localhost:8000"]
ALLOWED_METHODS=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
ALLOWED_HEADERS=["*"]

# Rate Limiting
RATE_LIMIT_PER_MINUTE=100
RATE_LIMIT_PER_HOUR=1000

# Audit & Logging
LOG_LEVEL=INFO
AUDIT_LOG_RETENTION_DAYS=2555
ENABLE_AUDIT_LOGGING=true

# Data Retention Policies
PATIENT_DATA_RETENTION_YEARS=7
AUDIT_LOG_RETENTION_YEARS=7
SESSION_AUDIO_RETENTION_DAYS=30

# File Upload Configuration
MAX_UPLOAD_SIZE=50MB
ALLOWED_AUDIO_FORMATS=["wav", "mp3", "m4a", "webm"]

# Environment
ENVIRONMENT=development

# Google Cloud (for future use - set these when ready)
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
GEMINI_API_KEY=your-vertex-ai-gemini-key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_PROJECT_ID=your-gcp-project-id
GEMINI_LOCATION=us-central1
GOOGLE_STT_MODEL=medical_conversation
GOOGLE_STT_LANGUAGE=en-IN
EOF
    echo "✅ Environment file created at backend/.env"
else
    echo "⚠️  Environment file already exists"
fi

# Navigate to docker directory
cd infrastructure/docker

# Stop any existing containers
echo "🛑 Stopping existing containers..."
$DOCKER_COMPOSE down --remove-orphans || true

# Pull latest images
echo "📥 Pulling Docker images..."
$DOCKER_COMPOSE pull postgres redis

# Build and start services
echo "🔨 Building and starting services..."
$DOCKER_COMPOSE up -d postgres redis

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is ready
echo "🔍 Checking database connection..."
until $DOCKER_COMPOSE exec postgres pg_isready -U emr_user -d emr_db; do
    echo "Waiting for PostgreSQL..."
    sleep 2
done

echo "✅ Database is ready!"

# Go back to project root
cd ../../

# Create initial database migration
echo "📊 Creating initial database migration..."
cd backend
if [ ! -d "alembic/versions" ]; then
    mkdir -p alembic/versions
fi

# Check if there are any existing migrations
if [ -z "$(ls -A alembic/versions 2>/dev/null)" ]; then
    echo "Creating initial migration..."
    alembic revision --autogenerate -m "Initial migration with all models"
else
    echo "Migrations already exist"
fi

# Run migrations
echo "🔄 Running database migrations..."
alembic upgrade head

cd ..

# Start backend (for initial test)
echo "🚀 Testing backend startup..."
cd infrastructure/docker
$DOCKER_COMPOSE up -d

# Wait a bit for services to start
sleep 15

# Check service health
echo "🏥 Checking service health..."
if curl -f http://localhost:8000/health > /dev/null 2>&1; then
    echo "✅ Backend is running and healthy!"
else
    echo "⚠️  Backend might be starting up, check logs with: docker-compose logs backend"
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend is running!"
else
    echo "⚠️  Frontend is not ready yet, check logs with: docker-compose logs frontend"
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Services running at:"
echo "  • Backend API: http://localhost:8000"
echo "  • Frontend: http://localhost:3000"
echo "  • API Documentation: http://localhost:8000/api/v1/docs"
echo "  • PostgreSQL: localhost:5432"
echo "  • Redis: localhost:6379"
echo ""
echo "Management Tools (run with --profile dev-tools):"
echo "  • PgAdmin: http://localhost:5050 (admin@emr.com / admin123)"
echo "  • Redis Commander: http://localhost:8081"
echo ""
echo "To start with dev tools:"
echo "  cd infrastructure/docker && docker-compose --profile dev-tools up -d"
echo ""
echo "To stop all services:"
echo "  cd infrastructure/docker && docker-compose down"
echo ""
echo "To view logs:"
echo "  cd infrastructure/docker && docker-compose logs -f [service-name]"
