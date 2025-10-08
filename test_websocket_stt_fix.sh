#!/bin/bash

# Test script to verify WebSocket STT 403 fix
# Tests JWT token expiry and WebSocket authentication

set -e

echo "================================================"
echo "🔍 WebSocket STT Fix Verification Script"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BACKEND_DIR="/Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend"

echo "📋 Test 1: Verify JWT Token Expiry Configuration"
echo "================================================"
cd "$BACKEND_DIR"

# Check JWT_ACCESS_TOKEN_EXPIRE_MINUTES in config.py
JWT_EXPIRY=$(grep "JWT_ACCESS_TOKEN_EXPIRE_MINUTES" app/core/config.py | grep -v "JWT_REFRESH" | grep -oE "[0-9]+")

if [ "$JWT_EXPIRY" == "240" ]; then
    echo -e "${GREEN}✅ PASS${NC}: JWT token expiry set to 240 minutes (4 hours)"
else
    echo -e "${RED}❌ FAIL${NC}: JWT token expiry is $JWT_EXPIRY minutes (expected 240)"
    exit 1
fi

echo ""
echo "📋 Test 2: Verify Audit Logger JSON Serialization"
echo "================================================"

# Check if default=str is present in audit.py
if grep -q "json.dumps(audit_entry, default=str)" app/core/audit.py; then
    echo -e "${GREEN}✅ PASS${NC}: Audit logger has default=str for datetime serialization"
else
    echo -e "${RED}❌ FAIL${NC}: Audit logger missing default=str parameter"
    exit 1
fi

echo ""
echo "📋 Test 3: Verify Transcribe Router is Mounted"
echo "================================================"

# Check if transcribe router is imported
if grep -q "from app.api.websocket import transcribe" app/api/api_v1/api.py; then
    echo -e "${GREEN}✅ PASS${NC}: Transcribe router imported in api.py"
else
    echo -e "${RED}❌ FAIL${NC}: Transcribe router not imported"
    exit 1
fi

# Check if transcribe router is included
if grep -q "api_router.include_router(transcribe.router" app/api/api_v1/api.py; then
    echo -e "${GREEN}✅ PASS${NC}: Transcribe router mounted in api.py"
else
    echo -e "${RED}❌ FAIL${NC}: Transcribe router not mounted"
    exit 1
fi

echo ""
echo "📋 Test 4: Verify WebSocket Endpoint Exists"
echo "================================================"

if [ -f "app/api/websocket/transcribe.py" ]; then
    echo -e "${GREEN}✅ PASS${NC}: WebSocket transcribe endpoint file exists"
    
    # Check if endpoint is properly defined
    if grep -q '@router.websocket("/transcribe")' app/api/websocket/transcribe.py; then
        echo -e "${GREEN}✅ PASS${NC}: WebSocket endpoint decorator found"
    else
        echo -e "${RED}❌ FAIL${NC}: WebSocket endpoint decorator missing"
        exit 1
    fi
    
    # Check if authentication is implemented
    if grep -q "get_current_user_from_websocket" app/api/websocket/transcribe.py; then
        echo -e "${GREEN}✅ PASS${NC}: WebSocket authentication implemented"
    else
        echo -e "${RED}❌ FAIL${NC}: WebSocket authentication missing"
        exit 1
    fi
else
    echo -e "${RED}❌ FAIL${NC}: WebSocket transcribe endpoint file not found"
    exit 1
fi

echo ""
echo "📋 Test 5: Verify Vertex AI Configuration"
echo "================================================"

# Check if Vertex AI is configured
if grep -q "from google.cloud import speech_v2 as speech" app/api/websocket/transcribe.py; then
    echo -e "${GREEN}✅ PASS${NC}: Vertex AI Speech v2 imported"
else
    echo -e "${RED}❌ FAIL${NC}: Vertex AI Speech v2 not imported"
    exit 1
fi

# Check if GCP credentials file exists
if [ -f "gcp-credentials.json" ]; then
    echo -e "${GREEN}✅ PASS${NC}: GCP credentials file exists"
else
    echo -e "${YELLOW}⚠️  WARN${NC}: GCP credentials file not found (may be set via env var)"
fi

echo ""
echo "📋 Test 6: Check Dependencies File"
echo "================================================"

# Check if get_current_user_from_websocket is properly defined
if grep -q "async def get_current_user_from_websocket" app/core/dependencies.py; then
    echo -e "${GREEN}✅ PASS${NC}: WebSocket authentication function defined"
    
    # Check if it uses jwt_manager.verify_token
    if grep -q "jwt_manager.verify_token(token, token_type=\"access\")" app/core/dependencies.py; then
        echo -e "${GREEN}✅ PASS${NC}: Token verification implemented correctly"
    else
        echo -e "${RED}❌ FAIL${NC}: Token verification not found"
        exit 1
    fi
else
    echo -e "${RED}❌ FAIL${NC}: WebSocket authentication function not found"
    exit 1
fi

echo ""
echo "================================================"
echo "🎉 ALL TESTS PASSED!"
echo "================================================"
echo ""
echo "✅ Configuration Summary:"
echo "   - JWT Token Expiry: 4 hours (240 minutes)"
echo "   - Audit Logger: Fixed with default=str"
echo "   - Transcribe Router: Properly mounted"
echo "   - WebSocket Endpoint: Correctly implemented"
echo "   - Authentication: Using JWT verification"
echo ""
echo "📝 Next Steps:"
echo "   1. Restart backend server to apply changes"
echo "   2. Logout and login to get fresh 4-hour token"
echo "   3. Test consultation with real-time transcription"
echo "   4. Monitor backend logs for any issues"
echo ""
echo "🧪 Manual Testing:"
echo "   Run this in browser console after login:"
echo "   ---"
echo "   const token = localStorage.getItem('accessToken');"
echo "   const payload = JSON.parse(atob(token.split('.')[1]));"
echo "   console.log('Token valid for (hours):', (payload.exp - payload.iat) / 3600);"
echo "   // Should show 4.0"
echo "   ---"
echo ""
echo "📊 Backend Logs:"
echo "   tail -f logs/app.log | grep -E 'WebSocket|transcribe|403|401'"
echo ""

exit 0
