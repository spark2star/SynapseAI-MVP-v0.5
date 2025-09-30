#!/bin/bash

# SynapseAI EMR - Stop All Services Script

# Colors for better output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Project paths
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_DIR="$PROJECT_ROOT/infrastructure/docker"

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ✅ $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} ❌ $1"
}

echo "🛑 SynapseAI EMR - Stopping All Services"
echo "========================================"

# Stop frontend processes
log "🌐 Stopping frontend processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "next-server" 2>/dev/null || true
success "Frontend processes stopped"

# Stop backend processes  
log "🖥️  Stopping backend processes..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "app.main:app" 2>/dev/null || true
pkill -f "simple_main:app" 2>/dev/null || true
success "Backend processes stopped"

# Stop Docker containers
log "🐳 Stopping Docker containers..."
if command -v docker-compose &> /dev/null; then
    cd "$DOCKER_DIR"
    docker-compose down
    success "Docker containers stopped"
else
    error "Docker Compose not found, skipping container cleanup"
fi

# Clean up log files
if [[ -f "$PROJECT_ROOT/backend.log" ]]; then
    rm "$PROJECT_ROOT/backend.log"
    success "Backend log file cleaned up"
fi

if [[ -f "$PROJECT_ROOT/frontend.log" ]]; then
    rm "$PROJECT_ROOT/frontend.log"  
    success "Frontend log file cleaned up"
fi

echo ""
success "🎉 All SynapseAI EMR services have been stopped"
echo ""

