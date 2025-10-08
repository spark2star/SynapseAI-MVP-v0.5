#!/bin/bash

echo "🚀 Quick Start - SynapseAI EMR"

# Start infrastructure
echo "🔵 Starting PostgreSQL and Redis..."
cd infrastructure/docker
docker-compose up postgres redis -d
cd ../..
sleep 3

# Start backend
echo "🖥️  Starting Backend..."
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Start frontend
echo "🌐 Starting Frontend..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Services starting!"
echo "📍 Backend:  http://localhost:8080"
echo "📍 Frontend: http://localhost:3000"
echo ""
echo "📄 Logs:"
echo "   Backend:  tail -f backend.log"
echo "   Frontend: tail -f frontend.log"
echo ""
echo "🛑 Press Ctrl+C to stop"

# Wait for interrupt
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
