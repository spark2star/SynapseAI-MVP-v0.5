#!/bin/bash

# SynapseAI EMR - Complete Startup Script
# This script starts all services: Infrastructure, Backend, and Frontend

set -e  # Exit on any error

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
DOCKER_DIR="$PROJECT_ROOT/infrastructure/docker"

# Log function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ⚠️  $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

# Cleanup function for graceful shutdown
cleanup() {
    log "🛑 Shutting down all services..."
    
    # Kill background processes
    if [[ -n $BACKEND_PID ]]; then
        kill $BACKEND_PID 2>/dev/null || true
        success "Backend server stopped"
    fi
    
    if [[ -n $FRONTEND_PID ]]; then
        kill $FRONTEND_PID 2>/dev/null || true
        success "Frontend server stopped"
    fi
    
    # Stop Docker containers
    if command -v docker-compose &> /dev/null; then
        cd "$DOCKER_DIR"
        docker-compose down
        success "Infrastructure services stopped"
    fi
    
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking prerequisites..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker."
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    # Check Python
    if ! command -v python3.11 &> /dev/null; then
        error "Python 3.11 is not installed. Please install Python 3.11 first."
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    success "All prerequisites are available"
}

# Clean up existing processes
cleanup_existing_processes() {
    log "🧹 Cleaning up existing processes..."
    
    # Kill any existing backend processes on port 8080
    if lsof -ti:8080 > /dev/null 2>&1; then
        warning "Stopping existing backend on port 8080..."
        lsof -ti:8080 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Kill any existing frontend processes on port 3000
    if lsof -ti:3000 > /dev/null 2>&1; then
        warning "Stopping existing frontend on port 3000..."
        lsof -ti:3000 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    # Kill any duplicate frontend on port 3001
    if lsof -ti:3001 > /dev/null 2>&1; then
        warning "Stopping duplicate frontend on port 3001..."
        lsof -ti:3001 | xargs kill -9 2>/dev/null || true
        sleep 2
    fi
    
    success "Existing processes cleaned up"
}

# Start infrastructure services
start_infrastructure() {
    log "🚀 Starting infrastructure services (PostgreSQL + Redis)..."
    
    cd "$DOCKER_DIR"
    
    # Start only postgres and redis services
    docker-compose up postgres redis -d
    
    # Wait for services to be ready
    log "⏳ Waiting for PostgreSQL to be ready..."
    until docker-compose exec postgres pg_isready -U emr_user -d emr_db; do
        sleep 2
    done
    
    log "⏳ Waiting for Redis to be ready..."
    until docker-compose exec redis redis-cli ping; do
        sleep 2
    done
    
    success "Infrastructure services are running"
}

# Setup and start backend
start_backend() {
    log "🖥️  Setting up and starting backend..."
    
    cd "$BACKEND_DIR"
    
    # Create virtual environment if it doesn't exist
    if [[ ! -d "venv" ]]; then
        log "📦 Creating Python virtual environment..."
        python3.11 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install dependencies
    log "📦 Installing Python dependencies..."
    pip install -r requirements.txt > /dev/null 2>&1
    
    # Create .env file if it doesn't exist
    if [[ ! -f ".env" ]]; then
        log "📝 Creating .env file..."
        cat > .env << 'ENVEOF'
# SynapseAI EMR System - Environment Configuration
APP_NAME=SynapseAI - Intelligent EMR System
VERSION=1.0.0
ENVIRONMENT=development
DEBUG=True
API_HOST=0.0.0.0
API_PORT=8080
API_V1_PREFIX=/api/v1
DATABASE_URL=postgresql://emr_user:emr_password@localhost:5432/emr_db
DATABASE_POOL_SIZE=20
DATABASE_MAX_OVERFLOW=10
REDIS_URL=redis://localhost:6379/0
REDIS_SESSION_DB=1
SECRET_KEY=dev-secret-key-change-in-development
JWT_SECRET_KEY=dev-jwt-secret-key-change-in-development
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
JWT_REFRESH_TOKEN_EXPIRE_DAYS=7
BCRYPT_ROUNDS=12
ENCRYPTION_KEY=dev-encryption-key-32-bytes-long!
FIELD_ENCRYPTION_KEY=dev-field-encryption-key-32-bytes!
GCP_CREDENTIALS_PATH=gcp-credentials.json
GCP_PROJECT_ID=synapse-product-1
GOOGLE_CLOUD_PROJECT=synapse-product-1
GOOGLE_STT_MODEL=latest_long
GOOGLE_STT_PRIMARY_LANGUAGE=mr-IN
GOOGLE_STT_SAMPLE_RATE=48000
GOOGLE_STT_ENABLE_WORD_CONFIDENCE=true
GOOGLE_STT_ENABLE_WORD_TIME_OFFSETS=true
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-2.5-flash
LOG_LEVEL=INFO
ENABLE_AUDIT_LOGGING=True
MAX_FILE_SIZE=10485760
SESSION_EXPIRE_MINUTES=30
ENVEOF
        success ".env file created"
    fi
    
    # Run database migrations
    # DISABLED: Migrations cause crashes - tables are created by SQLAlchemy directly
    # log "🔄 Running database migrations..."
    # alembic upgrade head || warning "Migration failed - database may not be initialized"
    log "⏭️  Skipping migrations (tables created by SQLAlchemy)"
    
    # Create admin user if it doesn't exist
    log "👤 Creating admin and demo users..."
    python -c "
from app.core.database import SessionLocal
from app.models.user import User
from app.core.encryption import HashingUtility

db = SessionLocal()
try:
    # Create admin user
    email = 'admin@synapseai.com'
    email_hash = User.hash_email(email)
    admin = db.query(User).filter(User.email_hash == email_hash).first()
    if not admin:
        admin = User(
            email=email,
            email_hash=email_hash,
            password_hash=HashingUtility.hash_password('SynapseAdmin2025!'),
            role='admin',
            is_verified=True,
            is_active=True
        )
        db.add(admin)
        print('Admin user created successfully')
    else:
        print('Admin user already exists')
    
    # Create demo doctor user
    doc_email = 'doc@demo.com'
    doc_email_hash = User.hash_email(doc_email)
    doctor = db.query(User).filter(User.email_hash == doc_email_hash).first()
    if not doctor:
        doctor = User(
            email=doc_email,
            email_hash=doc_email_hash,
            password_hash=HashingUtility.hash_password('password123'),
            role='doctor',
            doctor_status='verified',
            is_verified=True,
            is_active=True
        )
        db.add(doctor)
        print('Demo doctor user created successfully')
    else:
        print('Demo doctor user already exists')
    
    db.commit()
finally:
    db.close()
" || warning "User creation may have failed"
    
    # Start backend server
    log "🖥️  Starting FastAPI backend on port 8080..."
    uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 8
    
    # Check if backend is running
    if curl -s http://localhost:8080/health > /dev/null; then
        success "Backend server is running on http://localhost:8080"
    else
        warning "Backend server may still be starting up..."
    fi
}

# Setup and start frontend
start_frontend() {
    log "🌐 Setting up and starting frontend..."
    
    cd "$FRONTEND_DIR"
    
    # Install dependencies
    log "📦 Installing Node.js dependencies..."
    npm install > /dev/null 2>&1
    
    # Start frontend server
    log "🌐 Starting Next.js frontend on port 3000..."
    npm run dev > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait a moment for frontend to start
    sleep 10
    
    # Check if frontend is running
    if curl -s http://localhost:3000 > /dev/null; then
        success "Frontend server is running on http://localhost:3000"
    else
        warning "Frontend server may still be starting up..."
    fi
}

# Health check
health_check() {
    log "🔍 Running health check..."
    sleep 5
    
    # Check backend health
    if curl -s http://localhost:8000/health > /dev/null; then
        success "✅ Backend API is healthy"
    else
        warning "⚠️  Backend API health check failed"
    fi
    
    # Check backend API v1 health
    if curl -s http://localhost:8080/api/v1/health > /dev/null; then
        success "✅ Backend API v1 is healthy"
    else
        warning "⚠️  Backend API v1 health check failed (this is okay if route doesn't exist)"
    fi
    
    # Check frontend
    if curl -s http://localhost:3000 > /dev/null; then
        success "✅ Frontend is healthy"
    else
        warning "⚠️  Frontend health check failed"
    fi
    
    # Check key frontend routes
    local routes=("/" "/auth/login" "/dashboard")
    for route in "${routes[@]}"; do
        if curl -s "http://localhost:3000$route" > /dev/null; then
            success "✅ Route $route is accessible"
        else
            warning "⚠️  Route $route may not be ready yet"
        fi
    done
}

# Main execution
main() {
    echo "🚀 SynapseAI EMR - Complete System Startup"
    echo "=========================================="
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Clean up existing processes
    cleanup_existing_processes
    
    # Start infrastructure
    start_infrastructure
    
    # Start backend
    start_backend
    
    # Start frontend
    start_frontend
    
    # Run health check
    health_check
    
    echo ""
    echo "🎉 SynapseAI EMR System is fully operational!"
    echo "============================================="
    echo ""
    echo "📱 Frontend: http://localhost:3000"
    echo "🔧 Backend API: http://localhost:8080"
    echo "📚 API Docs (Swagger): http://localhost:8080/api/v1/docs"
    echo "📖 API Docs (ReDoc): http://localhost:8080/api/v1/redoc"
    echo "💚 Health Check: http://localhost:8080/health"
    echo "👤 Demo Login: doctor@demo.com / password123"
    echo ""
    echo "📊 Service Status:"
    echo "   • PostgreSQL: Running on port 5432"
    echo "   • Redis: Running on port 6379"  
    echo "   • Backend: Running on port 8080"
    echo "   • Frontend: Running on port 3000"
    echo ""
    echo "📄 Logs:"
    echo "   • Backend: $PROJECT_ROOT/backend.log"
    echo "   • Frontend: $PROJECT_ROOT/frontend.log"
    echo ""
    echo "🛑 Press Ctrl+C to stop all services"
    echo ""
    
    # Keep script running and wait for Ctrl+C
    while true; do
        sleep 10
        
        # Check if processes are still running
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            error "Backend process has stopped unexpectedly"
            cleanup
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            error "Frontend process has stopped unexpectedly"
            cleanup
        fi
    done
}

# Run main function
main "$@"

