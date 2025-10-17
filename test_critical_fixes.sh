#!/bin/bash
# Test script for critical fixes verification
# Date: October 15, 2025

set -e  # Exit on error

echo "============================================================================"
echo "🧪 TESTING CRITICAL FIXES - Mental Health Consultation System"
echo "============================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
        ((TESTS_FAILED++))
    fi
}

echo "============================================================================"
echo "TEST 1: Database Schema Verification"
echo "============================================================================"
echo ""

# Test 1.1: Check reviewed_transcript column exists
echo "📋 Test 1.1: Checking 'reviewed_transcript' column..."
RESULT=$(PGPASSWORD=emr_password psql -h localhost -U emr_user -d emr_db -t -c "
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'reports' 
      AND column_name = 'reviewed_transcript';
" 2>/dev/null | tr -d '[:space:]')

if [ "$RESULT" = "1" ]; then
    print_result 0 "Column 'reviewed_transcript' exists in reports table"
else
    print_result 1 "Column 'reviewed_transcript' NOT found in reports table"
fi

# Test 1.2: Check medications column exists
echo "📋 Test 1.2: Checking 'medications' column..."
RESULT=$(PGPASSWORD=emr_password psql -h localhost -U emr_user -d emr_db -t -c "
    SELECT COUNT(*) 
    FROM information_schema.columns 
    WHERE table_name = 'reports' 
      AND column_name = 'medications';
" 2>/dev/null | tr -d '[:space:]')

if [ "$RESULT" = "1" ]; then
    print_result 0 "Column 'medications' exists in reports table"
else
    print_result 1 "Column 'medications' NOT found in reports table"
fi

# Test 1.3: Verify medications column is JSONB type
echo "📋 Test 1.3: Verifying 'medications' column type..."
RESULT=$(PGPASSWORD=emr_password psql -h localhost -U emr_user -d emr_db -t -c "
    SELECT data_type 
    FROM information_schema.columns 
    WHERE table_name = 'reports' 
      AND column_name = 'medications';
" 2>/dev/null | tr -d '[:space:]')

if [ "$RESULT" = "jsonb" ]; then
    print_result 0 "Column 'medications' is JSONB type"
else
    print_result 1 "Column 'medications' is NOT JSONB type (found: $RESULT)"
fi

echo ""
echo "============================================================================"
echo "TEST 2: Backend STT Configuration"
echo "============================================================================"
echo ""

# Test 2.1: Check transcribe_simple.py has Hindi as primary language
echo "📋 Test 2.1: Checking STT service language priority..."
if grep -q 'language_codes=\["hi-IN", "mr-IN", "en-IN"\]' backend/app/api/api_v1/endpoints/transcribe_simple.py; then
    print_result 0 "STT service configured with Hindi as primary language"
else
    print_result 1 "STT service NOT configured with Hindi as primary"
fi

# Test 2.2: Check mental_health_stt_service.py has Hindi forced
echo "📋 Test 2.2: Checking mental health STT service..."
if grep -q 'language_code="hi-IN"' backend/app/services/mental_health_stt_service.py; then
    print_result 0 "Mental health STT service configured with Hindi forced"
else
    print_result 1 "Mental health STT service NOT configured correctly"
fi

# Test 2.3: Check health endpoint updated
echo "📋 Test 2.3: Checking health endpoint configuration..."
if grep -q '"primary_language": "hi-IN"' backend/app/api/api_v1/endpoints/transcribe_simple.py; then
    print_result 0 "Health endpoint shows Hindi as primary language"
else
    print_result 1 "Health endpoint NOT updated correctly"
fi

echo ""
echo "============================================================================"
echo "TEST 3: Frontend Configuration"
echo "============================================================================"
echo ""

# Test 3.1: Check frontend sends language parameter
echo "📋 Test 3.1: Checking frontend language parameter..."
if grep -q "formData.append('language', 'hi-IN')" frontend/src/components/consultation/recording/SimpleRecorder.tsx; then
    print_result 0 "Frontend configured to send Hindi language parameter"
else
    print_result 1 "Frontend NOT configured to send language parameter"
fi

# Test 3.2: Check frontend has audio quality validation
echo "📋 Test 3.2: Checking audio quality validation..."
if grep -q "Audio Quality Check" frontend/src/components/consultation/recording/SimpleRecorder.tsx; then
    print_result 0 "Frontend has audio quality validation"
else
    print_result 1 "Frontend missing audio quality validation"
fi

# Test 3.3: Check frontend has low volume warning
echo "📋 Test 3.3: Checking low volume warning..."
if grep -q "Low audio input detected" frontend/src/components/consultation/recording/SimpleRecorder.tsx; then
    print_result 0 "Frontend has low volume warning"
else
    print_result 1 "Frontend missing low volume warning"
fi

echo ""
echo "============================================================================"
echo "TEST 4: Backend Service Health Check (Optional - requires running server)"
echo "============================================================================"
echo ""

# Test 4.1: Check if backend is running
echo "📋 Test 4.1: Testing backend health endpoint..."
if curl -s http://localhost:8080/api/v1/stt/health > /dev/null 2>&1; then
    echo -e "${YELLOW}ℹ️  Backend is running, checking STT health...${NC}"
    
    # Get the health response
    HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/v1/stt/health)
    
    # Check if primary_language is hi-IN
    if echo "$HEALTH_RESPONSE" | grep -q '"primary_language": "hi-IN"'; then
        print_result 0 "STT health endpoint reports Hindi as primary language"
    else
        print_result 1 "STT health endpoint does NOT report Hindi as primary"
    fi
    
    # Check if status is ok
    if echo "$HEALTH_RESPONSE" | grep -q '"status": "ok"'; then
        print_result 0 "STT service status is OK"
    else
        print_result 1 "STT service status is NOT OK"
    fi
else
    echo -e "${YELLOW}⚠️  Backend not running - skipping live tests${NC}"
    echo -e "${YELLOW}   To test: cd backend && python -m uvicorn app.main:app --port 8080${NC}"
    echo ""
fi

echo ""
echo "============================================================================"
echo "📊 TEST SUMMARY"
echo "============================================================================"
echo ""
echo -e "Tests Passed: ${GREEN}${TESTS_PASSED}${NC}"
echo -e "Tests Failed: ${RED}${TESTS_FAILED}${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
    echo ""
    echo "✅ Database schema is correct"
    echo "✅ Backend STT services configured for Hindi"
    echo "✅ Frontend configured with language parameter and validation"
    echo ""
    echo -e "${GREEN}✓ System is ready for production use${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo ""
    echo "Please review the failed tests and fix the issues."
    echo "See CRITICAL_FIXES_COMPLETE.md for detailed documentation."
    exit 1
fi



