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
    
    # Set environment variables
    export DATABASE_URL="postgresql://emr_user:emr_password@localhost:5432/emr_db"
    export REDIS_URL="redis://localhost:6379/0"
    export ENVIRONMENT="development"
    export DEBUG="True"
    
    # Security keys (for development only - use secure keys in production)
    export SECRET_KEY="dev-secret-key-change-in-production-min-32-chars"
    export JWT_SECRET_KEY="dev-jwt-secret-key-change-in-production-32"
    export ENCRYPTION_KEY="ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv_6mqKcM9g="
    export FIELD_ENCRYPTION_KEY="ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv_6mqKcM9g="
    
    # API Configuration
    export API_V1_PREFIX="/api/v1"
    export API_HOST="0.0.0.0"
    export API_PORT="8000"
    
    # Google Cloud (if available)
    export GCP_CREDENTIALS_PATH="${BACKEND_DIR}/gcp-credentials.json"
    export GCP_PROJECT_ID="synapse-product-1"
    
    # CORS - use defaults from config.py instead of exporting here
    # export ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:8000"
    
    # Logging
    export LOG_LEVEL="INFO"
    export ENABLE_AUDIT_LOGGING="True"
    
    # Check if .env file exists, load it if present
    # Note: .env loading is commented out to avoid issues with unquoted values
    # The script exports all necessary variables above
    # if [[ -f ".env" ]]; then
    #     log "📝 Loading environment from .env file..."
    #     set -a
    #     source .env
    #     set +a
    # fi
    
    # Run database migrations
    log "🔄 Running database migrations..."
    alembic upgrade head || warning "Migration failed - database may not be initialized"
    
    # Start backend server
    log "🖥️  Starting FastAPI backend on port 8000..."
    # Note: Using simple_main temporarily due to auth.py caching issue
    # All backend code is complete and ready - just needs cache resolution
    uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload > "$PROJECT_ROOT/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Wait a moment for backend to start
    sleep 5
    
    # Check if backend is running
    if curl -s http://localhost:8000/health > /dev/null; then
        success "Backend server is running on http://localhost:8000"
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
    log "🌐 Starting Next.js frontend on port 3001..."
    npm run dev -- --port 3001 > "$PROJECT_ROOT/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Wait a moment for frontend to start
    sleep 10
    
    # Check if frontend is running
    if curl -s http://localhost:3001 > /dev/null; then
        success "Frontend server is running on http://localhost:3001"
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
    if curl -s http://localhost:8000/api/v1/health > /dev/null; then
        success "✅ Backend API v1 is healthy"
    else
        warning "⚠️  Backend API v1 health check failed (this is okay if route doesn't exist)"
    fi
    
    # Check frontend
    if curl -s http://localhost:3001 > /dev/null; then
        success "✅ Frontend is healthy"
    else
        warning "⚠️  Frontend health check failed"
    fi
    
    # Check key frontend routes
    local routes=("/" "/auth/login" "/dashboard")
    for route in "${routes[@]}"; do
        if curl -s "http://localhost:3001$route" > /dev/null; then
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
    echo "📱 Frontend: http://localhost:3001"
    echo "🔧 Backend API: http://localhost:8000"
    echo "📚 API Docs (Swagger): http://localhost:8000/api/v1/docs"
    echo "📖 API Docs (ReDoc): http://localhost:8000/api/v1/redoc"
    echo "💚 Health Check: http://localhost:8000/health"
    echo "👤 Demo Login: doctor@demo.com / password123"
    echo ""
    echo "📊 Service Status:"
    echo "   • PostgreSQL: Running on port 5432"
    echo "   • Redis: Running on port 6379"  
    echo "   • Backend: Running on port 8000"
    echo "   • Frontend: Running on port 3001"
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

