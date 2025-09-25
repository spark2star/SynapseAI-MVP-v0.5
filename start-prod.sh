#!/bin/bash
# Production startup script for SynapseAI

set -e

echo "🚀 Starting SynapseAI in PRODUCTION mode..."

# Wait for database to be ready
echo "⏳ Waiting for PostgreSQL..."
while ! curl -f http://postgres:5432 2>/dev/null; do
    sleep 2
done

echo "⏳ Waiting for Redis..."
while ! redis-cli -h redis ping 2>/dev/null; do
    sleep 2
done

# Navigate to backend directory
cd /app/backend

# Run database migrations
echo "🔄 Running database migrations..."
alembic upgrade head

# Start backend server with production settings
echo "🖥️  Starting FastAPI backend..."
uvicorn simple_main:app \
    --host 0.0.0.0 \
    --port 8000 \
    --workers 4 \
    --access-log \
    --loop uvloop \
    --http httptools &

# Navigate to frontend directory
cd /app/frontend

# Start frontend server for production
echo "🌐 Starting Next.js frontend..."
npm start --port 3000 &

# Keep container running
wait


