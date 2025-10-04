#!/bin/bash

echo '🔧 Fixing SynapseAI Port Mismatch...'
echo ''

# Step 1: Verify .env.local exists
echo '1️⃣ Checking frontend/.env.local...'
if [ -f frontend/.env.local ]; then
    echo '✅ frontend/.env.local exists'
    echo 'Contents:'
    cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
else
    echo '❌ frontend/.env.local not found - creating it...'
    cat > frontend/.env.local << 'ENVEOF'
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
ENVEOF
    echo '✅ Created frontend/.env.local'
fi
echo ''

# Step 2: Clear Next.js cache
echo '2️⃣ Clearing Next.js cache...'
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache 2>/dev/null
echo '✅ Cache cleared'
echo ''

# Step 3: Check backend port configuration
echo '3️⃣ Checking backend port configuration...'
if grep -q 'port 8080' start-all.sh; then
    echo '✅ Backend configured for port 8080'
else
    echo '⚠️ WARNING: Backend port configuration unclear'
fi
echo ''

# Step 4: Test backend connectivity
echo '4️⃣ Testing backend connectivity...'
if curl -s http://localhost:8080/api/v1/health > /dev/null 2>&1; then
    echo '✅ Backend is running and accessible on port 8080'
else
    echo '⚠️ Backend is not responding on port 8080'
    echo '   Please start backend with: ./start-all.sh'
fi
echo ''

echo '🎉 Configuration check complete!'
echo ''
echo '📝 Next steps:'
echo '   1. If backend is not running: ./start-all.sh'
echo '   2. Restart frontend: cd frontend && npm run dev'
echo '   3. Open browser: http://localhost:3000'
echo '   4. Check console for: "🔧 API Service initialized with URL: http://localhost:8080/api/v1"'
echo ''

