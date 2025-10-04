#!/bin/bash

# SynapseAI - Quick Start Script
# Starts backend and frontend with correct encryption keys

set -e

echo "🚀 Starting SynapseAI Services..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if PostgreSQL is running
echo -e "${BLUE}1️⃣ Checking PostgreSQL...${NC}"
if ! docker ps | grep -q synapseai_postgres; then
    echo -e "${YELLOW}   Starting PostgreSQL container...${NC}"
    docker-compose up -d db
    sleep 5
fi
echo -e "${GREEN}   ✅ PostgreSQL is running${NC}"
echo ""

# Check if Redis is running
echo -e "${BLUE}2️⃣ Checking Redis...${NC}"
if ! docker ps | grep -q synapseai_redis; then
    echo -e "${YELLOW}   Starting Redis container...${NC}"
    docker-compose up -d redis
    sleep 2
fi
echo -e "${GREEN}   ✅ Redis is running${NC}"
echo ""

# Stop any existing backend
echo -e "${BLUE}3️⃣ Starting Backend...${NC}"
pkill -f "uvicorn simple_main" 2>/dev/null || true
sleep 2

# Start backend with correct environment variables
cd backend
export DATABASE_URL="postgresql+asyncpg://emr_user:emr_password@localhost:5432/emr_db"
export REDIS_URL="redis://localhost:6379/0"
export ENCRYPTION_KEY="dev-encryption-key-32-bytes-long!"
export FIELD_ENCRYPTION_KEY="dev-field-encryption-key-32-bytes!"
export SECRET_KEY="dev-secret-key-change-in-development"
export JWT_SECRET_KEY="dev-jwt-secret-key-change-in-development"
export DEBUG="True"

uvicorn simple_main:app --host 0.0.0.0 --port 8080 --reload > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

echo -e "${GREEN}   ✅ Backend started (PID: $BACKEND_PID)${NC}"
echo ""

# Start frontend
echo -e "${BLUE}4️⃣ Starting Frontend...${NC}"
cd frontend
npm run dev > ../logs/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo -e "${GREEN}   ✅ Frontend started (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for services to be ready
echo -e "${BLUE}5️⃣ Waiting for services to be ready...${NC}"
sleep 8

# Test backend health
if curl -s http://localhost:8080/health > /dev/null; then
    echo -e "${GREEN}   ✅ Backend is healthy${NC}"
else
    echo -e "${YELLOW}   ⚠️  Backend health check failed (may still be starting)${NC}"
fi

# Test frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}   ✅ Frontend is healthy${NC}"
else
    echo -e "${YELLOW}   ⚠️  Frontend health check failed (may still be starting)${NC}"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo -e "${GREEN}🎉 SynapseAI Services Started Successfully!${NC}"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo -e "${BLUE}🔗 Access URLs:${NC}"
echo "   Frontend:  http://localhost:3000"
echo "   Backend:   http://localhost:8080"
echo "   API Docs:  http://localhost:8080/docs"
echo "   Redoc:     http://localhost:8080/redoc"
echo ""
echo -e "${BLUE}👤 Demo Credentials:${NC}"
echo "   Doctor:    doc@demo.com / password123"
echo "   Admin:     adm@demo.com / password123"
echo ""
echo -e "${BLUE}📊 New Production Endpoints:${NC}"
echo "   GET  /api/v1/patients/list/      - List patients with pagination"
echo "   GET  /api/v1/patients/{id}       - Get patient details"
echo "   GET  /api/v1/patients/search/    - Search patients"
echo "   GET  /api/v1/reports/list         - List reports with filters"
echo "   GET  /api/v1/reports/stats        - Get report statistics"
echo "   POST /api/v1/consultation/start   - Start consultation"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   Backend:  tail -f logs/backend.log"
echo "   Frontend: tail -f logs/frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop services:${NC}"
echo "   pkill -f 'uvicorn simple_main'"
echo "   pkill -f 'next-server'"
echo "   # Or use: ./stop-services.sh"
echo ""
echo "═══════════════════════════════════════════════════════════════"

