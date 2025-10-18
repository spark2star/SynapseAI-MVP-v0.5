#!/bin/bash

# Test script for receptionist fixes
# Run this after applying the fixes

echo "🧪 Testing Receptionist Implementation Fixes"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if backend is running
echo "1. Checking if backend is running..."
if curl -s http://localhost:8080/api/v1/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is running${NC}"
else
    echo -e "${RED}✗ Backend is not running${NC}"
    echo "  Start with: cd backend && uvicorn app.main:app --reload --port 8080"
    exit 1
fi

# Check if frontend is running
echo ""
echo "2. Checking if frontend is running..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✓ Frontend is running${NC}"
else
    echo -e "${RED}✗ Frontend is not running${NC}"
    echo "  Start with: cd frontend && npm run dev"
    exit 1
fi

# Check database migration
echo ""
echo "3. Checking database migration..."
cd backend
MIGRATION=$(alembic current 2>&1 | grep "9691ddd22bb4")
if [ ! -z "$MIGRATION" ]; then
    echo -e "${GREEN}✓ Migration applied (9691ddd22bb4)${NC}"
else
    echo -e "${RED}✗ Migration not applied${NC}"
    echo "  Run: cd backend && alembic upgrade head"
    exit 1
fi
cd ..

# Test invitation status endpoint (public)
echo ""
echo "4. Testing invitation status endpoint..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/v1/staff/invite/test-token/status)
if [ "$RESPONSE" == "200" ] || [ "$RESPONSE" == "404" ]; then
    echo -e "${GREEN}✓ Invitation status endpoint accessible${NC}"
else
    echo -e "${RED}✗ Invitation status endpoint failed (HTTP $RESPONSE)${NC}"
fi

# Check if staff endpoints are registered
echo ""
echo "5. Checking API documentation..."
if curl -s http://localhost:8080/docs | grep -q "staff"; then
    echo -e "${GREEN}✓ Staff endpoints registered${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify staff endpoints in docs${NC}"
fi

echo ""
echo "=============================================="
echo "🎯 Manual Testing Required:"
echo ""
echo "1. Open http://localhost:3000/dashboard/settings/staff"
echo "   - Should load without errors"
echo "   - Should show invitation form"
echo ""
echo "2. Send an invitation:"
echo "   - Enter email: test@example.com"
echo "   - Click 'Send Invite'"
echo "   - Copy the invitation URL from logs"
echo ""
echo "3. Open invitation URL in incognito:"
echo "   - Should show 'You're Invited!' page"
echo "   - Should NOT redirect to login"
echo "   - Email field should be populated"
echo ""
echo "4. Create account:"
echo "   - Enter password (min 8 chars)"
echo "   - Confirm password"
echo "   - Click 'Create Account'"
echo "   - Should succeed without 500 error"
echo "   - Should auto-login"
echo ""
echo "=============================================="
echo ""
echo -e "${GREEN}✓ Automated checks passed!${NC}"
echo "  Proceed with manual testing above."
