#!/bin/bash
# Manual Step-by-Step Deployment for SynapseAI

echo "🚀 MANUAL SYNAPSEAI DEPLOYMENT"
echo "============================="

# Step 1: Load environment variables
echo "📋 Step 1: Loading environment variables..."
if [ ! -f .env.prod ]; then
    echo "❌ ERROR: .env.prod not found!"
    exit 1
fi

export $(cat .env.prod | xargs)
echo "✅ Environment loaded"
echo "   POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:0:10}..."
echo "   GOOGLE_CLOUD_PROJECT: $GOOGLE_CLOUD_PROJECT"

# Step 2: Complete cleanup
echo "🧹 Step 2: Cleaning up..."
docker-compose -f docker-compose.prod.yml down --volumes --remove-orphans 2>/dev/null || true
docker network prune -f 2>/dev/null || true

# Step 3: Build
echo "🏗️  Step 3: Building containers..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Step 4: Start
echo "🚀 Step 4: Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Step 5: Check status
echo "📊 Step 5: Checking status..."
sleep 10
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "✅ Deployment complete!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend: http://localhost:8000"
