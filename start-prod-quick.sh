#!/bin/bash
# Quick startup script - bypass PostgreSQL wait
set -e
echo "🚀 Quick startup - bypassing database wait..."

cd /app/backend
echo "🔄 Running database migrations..."
alembic upgrade head || echo "Migration failed, continuing..."

echo "🖥️  Starting FastAPI backend..."
uvicorn simple_main:app --host 0.0.0.0 --port 8000 --workers 4 --access-log --loop uvloop --http httptools &

cd /app/frontend
echo "🌐 Starting Next.js frontend..."
npm start --port 3000 &

wait
