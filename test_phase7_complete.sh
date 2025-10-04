#!/bin/bash

# Phase 7: Complete End-to-End Testing Script
# Tests the entire doctor registration and admin verification system

set -e  # Exit on error

API_URL="${API_URL:-http://localhost:8080/api/v1}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_test() {
    echo -e "${YELLOW}TEST $1:${NC} $2"
}

print_success() {
    echo -e "${GREEN}✓ PASS:${NC} $1"
    ((TESTS_PASSED++))
    ((TOTAL_TESTS++))
}

print_failure() {
    echo -e "${RED}✗ FAIL:${NC} $1"
    ((TESTS_FAILED++))
    ((TOTAL_TESTS++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO:${NC} $1"
}

# Generate unique test data
TIMESTAMP=$(date +%s)
TEST_DOCTOR_EMAIL="test.doctor.${TIMESTAMP}@example.com"
TEST_DOCTOR_MED_REG="MH${TIMESTAMP}"
TEST_DOCTOR_PASSWORD="SecurePass123!"
ADMIN_EMAIL="test.doctor@example.com"
ADMIN_PASSWORD="SecurePass123!"

# Global variables for test data
DOCTOR_APPLICATION_ID=""
ADMIN_TOKEN=""
DOCTOR_TOKEN=""

# ============================================
# TEST SUITE 1: BACKEND HEALTH CHECKS
# ============================================

print_header "TEST SUITE 1: Backend Health Checks"

# Test 1.1: Backend health endpoint
print_test "1.1" "Backend health check"
HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL%/api/v1}/health" || echo "000")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Backend is healthy (HTTP 200)"
else
    print_failure "Backend health check failed (HTTP $HTTP_CODE)"
fi

# Test 1.2: API docs accessible
print_test "1.2" "API documentation accessible"
DOCS_RESPONSE=$(curl -s -w "\n%{http_code}" "${API_URL%/api/v1}/docs" || echo "000")
HTTP_CODE=$(echo "$DOCS_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "API docs accessible (HTTP 200)"
else
    print_failure "API docs not accessible (HTTP $HTTP_CODE)"
fi

# ============================================
# TEST SUITE 2: DOCTOR REGISTRATION FLOW
# ============================================

print_header "TEST SUITE 2: Doctor Registration Flow"

# Test 2.1: Register new doctor
print_test "2.1" "Doctor self-registration"
REGISTER_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/doctor/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"fullName\": \"Dr. Test Doctor ${TIMESTAMP}\",
        \"email\": \"${TEST_DOCTOR_EMAIL}\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\",
        \"medicalRegistrationNumber\": \"${TEST_DOCTOR_MED_REG}\",
        \"stateMedicalCouncil\": \"Maharashtra\"
    }" || echo "{}\n000")

HTTP_CODE=$(echo "$REGISTER_RESPONSE" | tail -n1)
RESPONSE_BODY=$(echo "$REGISTER_RESPONSE" | head -n -1)

if [ "$HTTP_CODE" = "202" ] || [ "$HTTP_CODE" = "200" ]; then
    DOCTOR_APPLICATION_ID=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('application_id', ''))" 2>/dev/null || echo "")
    print_success "Doctor registered successfully (HTTP $HTTP_CODE)"
    print_info "Application ID: $DOCTOR_APPLICATION_ID"
else
    print_failure "Doctor registration failed (HTTP $HTTP_CODE)"
    print_info "Response: $RESPONSE_BODY"
fi

# Test 2.2: Duplicate email registration (should fail)
print_test "2.2" "Duplicate email registration (should fail)"
DUP_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/doctor/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"fullName\": \"Dr. Duplicate Doctor\",
        \"email\": \"${TEST_DOCTOR_EMAIL}\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\",
        \"medicalRegistrationNumber\": \"MH999999\",
        \"stateMedicalCouncil\": \"Maharashtra\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$DUP_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "409" ]; then
    print_success "Duplicate email correctly rejected (HTTP $HTTP_CODE)"
else
    print_failure "Duplicate email not rejected properly (HTTP $HTTP_CODE)"
fi

# Test 2.3: Duplicate medical registration number (should fail)
print_test "2.3" "Duplicate medical registration number (should fail)"
DUP_MED_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/doctor/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"fullName\": \"Dr. Another Doctor\",
        \"email\": \"another.${TIMESTAMP}@example.com\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\",
        \"medicalRegistrationNumber\": \"${TEST_DOCTOR_MED_REG}\",
        \"stateMedicalCouncil\": \"Maharashtra\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$DUP_MED_RESPONSE" | tail -n1)
if [ "$HTTP_CODE" = "400" ] || [ "$HTTP_CODE" = "409" ]; then
    print_success "Duplicate medical reg number correctly rejected (HTTP $HTTP_CODE)"
else
    print_failure "Duplicate medical reg number not rejected properly (HTTP $HTTP_CODE)"
fi

# Test 2.4: Pending doctor login attempt (should fail with 403)
print_test "2.4" "Pending doctor login attempt (should be blocked)"
PENDING_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_DOCTOR_EMAIL}\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$PENDING_LOGIN" | tail -n1)
if [ "$HTTP_CODE" = "403" ]; then
    print_success "Pending doctor login correctly blocked (HTTP 403)"
else
    print_failure "Pending doctor login not blocked properly (HTTP $HTTP_CODE)"
fi

# ============================================
# TEST SUITE 3: ADMIN AUTHENTICATION & ACCESS
# ============================================

print_header "TEST SUITE 3: Admin Authentication & Access"

# Test 3.1: Admin login
print_test "3.1" "Admin login"
ADMIN_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${ADMIN_EMAIL}\",
        \"password\": \"${ADMIN_PASSWORD}\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$ADMIN_LOGIN" | tail -n1)
RESPONSE_BODY=$(echo "$ADMIN_LOGIN" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    ADMIN_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('access_token', ''))" 2>/dev/null || echo "")
    ADMIN_ROLE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('role', ''))" 2>/dev/null || echo "")
    
    if [ "$ADMIN_ROLE" = "admin" ]; then
        print_success "Admin login successful with correct role"
        print_info "Admin token: ${ADMIN_TOKEN:0:20}..."
    else
        print_failure "Admin login succeeded but role is incorrect: $ADMIN_ROLE"
    fi
else
    print_failure "Admin login failed (HTTP $HTTP_CODE)"
    print_info "Response: $RESPONSE_BODY"
fi

# Test 3.2: Admin can list applications
print_test "3.2" "Admin can list doctor applications"
if [ -n "$ADMIN_TOKEN" ]; then
    APPLICATIONS_LIST=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/applications?status=pending" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$APPLICATIONS_LIST" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Admin can list applications (HTTP 200)"
    else
        print_failure "Admin cannot list applications (HTTP $HTTP_CODE)"
    fi
else
    print_failure "Skipping test - no admin token"
fi

# Test 3.3: Admin can view application details
print_test "3.3" "Admin can view application details"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$DOCTOR_APPLICATION_ID" ]; then
    APP_DETAILS=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/admin/applications/${DOCTOR_APPLICATION_ID}" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$APP_DETAILS" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Admin can view application details (HTTP 200)"
    else
        print_failure "Admin cannot view application details (HTTP $HTTP_CODE)"
    fi
else
    print_failure "Skipping test - no admin token or application ID"
fi

# ============================================
# TEST SUITE 4: ADMIN APPROVAL WORKFLOW
# ============================================

print_header "TEST SUITE 4: Admin Approval Workflow"

# Test 4.1: Admin approves doctor application
print_test "4.1" "Admin approves doctor application"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$DOCTOR_APPLICATION_ID" ]; then
    APPROVAL_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/applications/${DOCTOR_APPLICATION_ID}/approve" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$APPROVAL_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Doctor application approved successfully (HTTP 200)"
    else
        print_failure "Doctor approval failed (HTTP $HTTP_CODE)"
        RESPONSE_BODY=$(echo "$APPROVAL_RESPONSE" | head -n -1)
        print_info "Response: $RESPONSE_BODY"
    fi
else
    print_failure "Skipping test - no admin token or application ID"
fi

# Wait a moment for database to update
sleep 2

# ============================================
# TEST SUITE 5: APPROVED DOCTOR LOGIN & PROFILE
# ============================================

print_header "TEST SUITE 5: Approved Doctor Login & Profile"

# Test 5.1: Approved doctor can login
print_test "5.1" "Approved doctor can login"
DOCTOR_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
        \"email\": \"${TEST_DOCTOR_EMAIL}\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$DOCTOR_LOGIN" | tail -n1)
RESPONSE_BODY=$(echo "$DOCTOR_LOGIN" | head -n -1)

if [ "$HTTP_CODE" = "200" ]; then
    DOCTOR_TOKEN=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('access_token', ''))" 2>/dev/null || echo "")
    DOCTOR_ROLE=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('role', ''))" 2>/dev/null || echo "")
    DOCTOR_STATUS=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('doctor_status', ''))" 2>/dev/null || echo "")
    PROFILE_COMPLETED=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('profile_completed', 'false'))" 2>/dev/null || echo "false")
    
    print_success "Approved doctor login successful (HTTP 200)"
    print_info "Doctor token: ${DOCTOR_TOKEN:0:20}..."
    print_info "Role: $DOCTOR_ROLE, Status: $DOCTOR_STATUS, Profile completed: $PROFILE_COMPLETED"
else
    print_failure "Approved doctor login failed (HTTP $HTTP_CODE)"
    print_info "Response: $RESPONSE_BODY"
fi

# Test 5.2: Doctor can complete profile
print_test "5.2" "Doctor can complete profile"
if [ -n "$DOCTOR_TOKEN" ]; then
    PROFILE_UPDATE=$(curl -s -w "\n%{http_code}" -X PUT "${API_URL}/doctor/profile" \
        -H "Authorization: Bearer ${DOCTOR_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"clinicName\": \"Test Clinic ${TIMESTAMP}\",
            \"clinicAddress\": \"123 Test Street, Mumbai, Maharashtra, 400001\",
            \"specializations\": [\"General Medicine\", \"Cardiology\"],
            \"yearsOfExperience\": 5,
            \"phoneNumber\": \"+919876543210\",
            \"alternateEmail\": \"alternate.${TIMESTAMP}@example.com\"
        }" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$PROFILE_UPDATE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Doctor profile completed successfully (HTTP 200)"
    else
        print_failure "Doctor profile completion failed (HTTP $HTTP_CODE)"
        RESPONSE_BODY=$(echo "$PROFILE_UPDATE" | head -n -1)
        print_info "Response: $RESPONSE_BODY"
    fi
else
    print_failure "Skipping test - no doctor token"
fi

# Test 5.3: Doctor can access profile endpoint
print_test "5.3" "Doctor can access user profile"
if [ -n "$DOCTOR_TOKEN" ]; then
    PROFILE_GET=$(curl -s -w "\n%{http_code}" -X GET "${API_URL}/users/profile" \
        -H "Authorization: Bearer ${DOCTOR_TOKEN}" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$PROFILE_GET" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Doctor can access profile endpoint (HTTP 200)"
    else
        print_failure "Doctor cannot access profile endpoint (HTTP $HTTP_CODE)"
    fi
else
    print_failure "Skipping test - no doctor token"
fi

# ============================================
# TEST SUITE 6: REJECTION WORKFLOW
# ============================================

print_header "TEST SUITE 6: Rejection Workflow"

# Register another doctor for rejection test
REJECT_DOCTOR_EMAIL="reject.doctor.${TIMESTAMP}@example.com"
REJECT_DOCTOR_MED_REG="MH${TIMESTAMP}REJECT"

print_test "6.1" "Register doctor for rejection test"
REJECT_REGISTER=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/doctor/register" \
    -H "Content-Type: application/json" \
    -d "{
        \"fullName\": \"Dr. Reject Test ${TIMESTAMP}\",
        \"email\": \"${REJECT_DOCTOR_EMAIL}\",
        \"password\": \"${TEST_DOCTOR_PASSWORD}\",
        \"medicalRegistrationNumber\": \"${REJECT_DOCTOR_MED_REG}\",
        \"stateMedicalCouncil\": \"Delhi\"
    }" 2>/dev/null || echo "{}\n000")

HTTP_CODE=$(echo "$REJECT_REGISTER" | tail -n1)
RESPONSE_BODY=$(echo "$REJECT_REGISTER" | head -n -1)

if [ "$HTTP_CODE" = "202" ] || [ "$HTTP_CODE" = "200" ]; then
    REJECT_APPLICATION_ID=$(echo "$RESPONSE_BODY" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('application_id', ''))" 2>/dev/null || echo "")
    print_success "Rejection test doctor registered (HTTP $HTTP_CODE)"
    print_info "Application ID: $REJECT_APPLICATION_ID"
else
    print_failure "Rejection test doctor registration failed (HTTP $HTTP_CODE)"
fi

# Test 6.2: Admin rejects doctor application
print_test "6.2" "Admin rejects doctor application"
if [ -n "$ADMIN_TOKEN" ] && [ -n "$REJECT_APPLICATION_ID" ]; then
    REJECTION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/admin/applications/${REJECT_APPLICATION_ID}/reject" \
        -H "Authorization: Bearer ${ADMIN_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "{
            \"rejectionReason\": \"Test rejection: Invalid medical registration number format for testing purposes.\"
        }" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$REJECTION_RESPONSE" | tail -n1)
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Doctor application rejected successfully (HTTP 200)"
    else
        print_failure "Doctor rejection failed (HTTP $HTTP_CODE)"
    fi
else
    print_failure "Skipping test - no admin token or rejection application ID"
fi

# Test 6.3: Rejected doctor cannot login
print_test "6.3" "Rejected doctor login attempt (should be blocked)"
if [ -n "$REJECT_APPLICATION_ID" ]; then
    sleep 2  # Wait for database update
    
    REJECTED_LOGIN=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{
            \"email\": \"${REJECT_DOCTOR_EMAIL}\",
            \"password\": \"${TEST_DOCTOR_PASSWORD}\"
        }" 2>/dev/null || echo "{}\n000")
    
    HTTP_CODE=$(echo "$REJECTED_LOGIN" | tail -n1)
    if [ "$HTTP_CODE" = "403" ]; then
        print_success "Rejected doctor login correctly blocked (HTTP 403)"
    else
        print_failure "Rejected doctor login not blocked properly (HTTP $HTTP_CODE)"
    fi
else
    print_failure "Skipping test - no rejection application ID"
fi

# ============================================
# TEST SUITE 7: FRONTEND ACCESSIBILITY
# ============================================

print_header "TEST SUITE 7: Frontend Accessibility"

# Test 7.1: Frontend homepage accessible
print_test "7.1" "Frontend homepage accessible"
FRONTEND_HOME=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}/" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$FRONTEND_HOME" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Frontend homepage accessible (HTTP 200)"
else
    print_failure "Frontend homepage not accessible (HTTP $HTTP_CODE)"
fi

# Test 7.2: Registration page accessible
print_test "7.2" "Registration page accessible"
REGISTER_PAGE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}/register" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$REGISTER_PAGE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Registration page accessible (HTTP 200)"
else
    print_failure "Registration page not accessible (HTTP $HTTP_CODE)"
fi

# Test 7.3: Login page accessible
print_test "7.3" "Login page accessible"
LOGIN_PAGE=$(curl -s -w "\n%{http_code}" "${FRONTEND_URL}/auth/login" 2>/dev/null || echo "000")
HTTP_CODE=$(echo "$LOGIN_PAGE" | tail -n1)
if [ "$HTTP_CODE" = "200" ]; then
    print_success "Login page accessible (HTTP 200)"
else
    print_failure "Login page not accessible (HTTP $HTTP_CODE)"
fi

# ============================================
# FINAL SUMMARY
# ============================================

print_header "TEST SUMMARY"

echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
echo -e "${GREEN}Passed:${NC} $TESTS_PASSED"
echo -e "${RED}Failed:${NC} $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}   ✓ ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}========================================${NC}\n"
    exit 0
else
    echo -e "\n${RED}========================================${NC}"
    echo -e "${RED}   ✗ SOME TESTS FAILED${NC}"
    echo -e "${RED}========================================${NC}\n"
    exit 1
fi

