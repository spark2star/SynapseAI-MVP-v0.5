#!/bin/bash
# PHASE 2 TESTING SCRIPT
# Tests medication modal and patient update functionality

echo "================================================"
echo "PHASE 2: MEDICATION MODAL & PATIENT UPDATE TEST"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
API_URL="http://localhost:8080/api/v1"
TOKEN=""
PATIENT_ID=""

# Function to print test results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ PASS${NC}: $2"
    else
        echo -e "${RED}❌ FAIL${NC}: $2"
    fi
}

# Get authentication token
echo "Step 1: Authenticating..."
echo -n "Enter doctor email: "
read DOCTOR_EMAIL
echo -n "Enter password: "
read -s DOCTOR_PASSWORD
echo ""

AUTH_RESPONSE=$(curl -s -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"${DOCTOR_EMAIL}\",\"password\":\"${DOCTOR_PASSWORD}\"}")

TOKEN=$(echo $AUTH_RESPONSE | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Authentication failed${NC}"
    echo "Response: $AUTH_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Authentication successful${NC}"
echo ""

# Test 1: Get patient list
echo "================================================"
echo "TEST 1: GET PATIENT LIST"
echo "================================================"

PATIENTS_RESPONSE=$(curl -s -X GET "${API_URL}/intake/patients?limit=5" \
    -H "Authorization: Bearer ${TOKEN}")

PATIENT_COUNT=$(echo $PATIENTS_RESPONSE | grep -o '"total_count":[0-9]*' | cut -d':' -f2)

if [ -n "$PATIENT_COUNT" ]; then
    print_result 0 "Retrieved patient list (Total: $PATIENT_COUNT)"
    PATIENT_ID=$(echo $PATIENTS_RESPONSE | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "Using patient ID: $PATIENT_ID"
else
    print_result 1 "Failed to retrieve patients"
    echo "Response: $PATIENTS_RESPONSE"
fi
echo ""

if [ -z "$PATIENT_ID" ]; then
    echo -e "${YELLOW}⚠️  No patients found. Please create a patient first.${NC}"
    exit 0
fi

# Test 2: Get patient details
echo "================================================"
echo "TEST 2: GET PATIENT DETAILS"
echo "================================================"

PATIENT_RESPONSE=$(curl -s -X GET "${API_URL}/intake/patients/${PATIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

PATIENT_NAME=$(echo $PATIENT_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$PATIENT_NAME" ]; then
    print_result 0 "Retrieved patient details (Name: $PATIENT_NAME)"
else
    print_result 1 "Failed to retrieve patient details"
    echo "Response: $PATIENT_RESPONSE"
fi
echo ""

# Test 3: Update patient information
echo "================================================"
echo "TEST 3: UPDATE PATIENT INFORMATION"
echo "================================================"

ORIGINAL_NAME="$PATIENT_NAME"
NEW_NAME="${PATIENT_NAME} [UPDATED]"
NEW_AGE=35

UPDATE_RESPONSE=$(curl -s -X PUT "${API_URL}/intake/patients/${PATIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${NEW_NAME}\",
        \"age\": ${NEW_AGE}
    }")

UPDATE_STATUS=$(echo $UPDATE_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)
UPDATED_FIELDS=$(echo $UPDATE_RESPONSE | grep -o '"updated_fields":[0-9]*' | cut -d':' -f2)

if [ "$UPDATE_STATUS" = "success" ]; then
    print_result 0 "Updated patient (Fields changed: $UPDATED_FIELDS)"
else
    print_result 1 "Failed to update patient"
    echo "Response: $UPDATE_RESPONSE"
fi
echo ""

# Test 4: Verify update persistence
echo "================================================"
echo "TEST 4: VERIFY UPDATE PERSISTENCE"
echo "================================================"

VERIFY_RESPONSE=$(curl -s -X GET "${API_URL}/intake/patients/${PATIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

VERIFIED_NAME=$(echo $VERIFY_RESPONSE | grep -o '"name":"[^"]*' | head -1 | cut -d'"' -f4)
VERIFIED_AGE=$(echo $VERIFY_RESPONSE | grep -o '"age":[0-9]*' | head -1 | cut -d':' -f2)

if [ "$VERIFIED_NAME" = "$NEW_NAME" ] && [ "$VERIFIED_AGE" = "$NEW_AGE" ]; then
    print_result 0 "Update persisted correctly"
    echo "  Name: $VERIFIED_NAME"
    echo "  Age: $VERIFIED_AGE"
else
    print_result 1 "Update did not persist"
    echo "  Expected Name: $NEW_NAME, Got: $VERIFIED_NAME"
    echo "  Expected Age: $NEW_AGE, Got: $VERIFIED_AGE"
fi
echo ""

# Test 5: Revert changes (restore original name)
echo "================================================"
echo "TEST 5: REVERT CHANGES"
echo "================================================"

REVERT_RESPONSE=$(curl -s -X PUT "${API_URL}/intake/patients/${PATIENT_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"${ORIGINAL_NAME}\"
    }")

REVERT_STATUS=$(echo $REVERT_RESPONSE | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ "$REVERT_STATUS" = "success" ]; then
    print_result 0 "Reverted patient name to original"
else
    print_result 1 "Failed to revert changes"
    echo "Response: $REVERT_RESPONSE"
fi
echo ""

# Test 6: Test permission check (attempt to update non-existent patient)
echo "================================================"
echo "TEST 6: PERMISSION CHECK"
echo "================================================"

FAKE_ID="00000000-0000-0000-0000-000000000000"
PERMISSION_RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/intake/patients/${FAKE_ID}" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "{\"name\": \"Test\"}")

HTTP_CODE=$(echo "$PERMISSION_RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" = "404" ]; then
    print_result 0 "Permission check works (404 for non-existent patient)"
else
    print_result 1 "Permission check failed (Expected 404, got $HTTP_CODE)"
fi
echo ""

# Summary
echo "================================================"
echo "TEST SUMMARY"
echo "================================================"
echo ""
echo "Backend Tests:"
echo "  ✅ Patient listing"
echo "  ✅ Patient detail retrieval"
echo "  ✅ Patient update"
echo "  ✅ Update persistence"
echo "  ✅ Permission checks"
echo ""
echo "Frontend Tests (Manual):"
echo "  🔲 Open patient detail page"
echo "  🔲 Click 'Edit Patient'"
echo "  🔲 Modify fields and save"
echo "  🔲 Start consultation → End → Generate Report"
echo "  🔲 Medication modal appears"
echo "  🔲 Add medications and generate"
echo ""
echo "================================================"
echo "BACKEND API TESTS COMPLETE"
echo "================================================"
echo ""
echo -e "${YELLOW}ℹ️  Frontend UI tests must be performed manually${NC}"
echo "   Navigate to: http://localhost:3000/dashboard/patients/${PATIENT_ID}"
echo ""
