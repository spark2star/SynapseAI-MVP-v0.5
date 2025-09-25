#!/bin/bash
# Fixed deployment script for SynapseAI

set -e

echo "🚀 SynapseAI Production Deployment Script"
echo "========================================"

# Load environment variables from .env.prod
if [ ! -f .env.prod ]; then
    echo "❌ ERROR: .env.prod file not found!"
    echo "Please copy .env.prod.template to .env.prod and configure it."
    exit 1
fi

echo "📋 Loading environment variables from .env.prod..."
set -a  # automatically export all variables
source .env.prod
set +a

# Export critical variables explicitly  
export POSTGRES_PASSWORD
export SECRET_KEY
export JWT_SECRET
export ENCRYPTION_KEY
export GOOGLE_CLOUD_PROJECT

echo "✅ Environment variables loaded"
echo "   - POSTGRES_PASSWORD: [REDACTED]"
echo "   - SECRET_KEY: [REDACTED]"  
echo "   - GOOGLE_CLOUD_PROJECT: $GOOGLE_CLOUD_PROJECT"

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down || true

# Clean networks
echo "🧹 Cleaning Docker networks..."
docker network prune -f

# Build and start
echo "🏗️  Building production containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

echo ""
echo "⏳ Waiting for services to start..."
sleep 30

echo "🔍 Checking service health..."
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🎉 Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8000" 
