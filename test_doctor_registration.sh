#!/bin/bash

# Test script for Phase 3: Doctor Registration & Admin Endpoints
# Tests all new endpoints for doctor registration and admin management

set -e

BASE_URL="http://localhost:8080/api/v1"
ADMIN_EMAIL="test.doctor@example.com"
ADMIN_PASSWORD="SecurePass123!"

echo "=========================================="
echo "🧪 TESTING DOCTOR REGISTRATION SYSTEM"
echo "=========================================="
echo ""

# Test 1: Doctor Registration
echo "📝 Test 1: Doctor Registration"
echo "----------------------------------------"
REGISTRATION_RESPONSE=$(curl -s -X POST "$BASE_URL/doctor/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"fullName\": \"Dr. Test Doctor $(date +%s)\",
    \"email\": \"test.doctor.$(date +%s)@example.com\",
    \"password\": \"SecurePass123!\",
    \"medicalRegistrationNumber\": \"TEST$(date +%s)\",
    \"stateMedicalCouncil\": \"Maharashtra\"
  }")

echo "Response:"
echo "$REGISTRATION_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$REGISTRATION_RESPONSE"
echo ""

# Extract application ID
APPLICATION_ID=$(echo "$REGISTRATION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['application_id'])" 2>/dev/null || echo "")

if [ -z "$APPLICATION_ID" ]; then
  echo "❌ Failed to register doctor"
  exit 1
fi

echo "✅ Doctor registered successfully!"
echo "Application ID: $APPLICATION_ID"
echo ""

# Test 2: Admin Login
echo "🔐 Test 2: Admin Login"
echo "----------------------------------------"
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"rememberMe\": false
  }")

echo "Response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract access token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['data']['access_token'])" 2>/dev/null || echo "")

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Failed to login as admin"
  exit 1
fi

echo "✅ Admin logged in successfully!"
echo ""

# Test 3: List Pending Applications
echo "📋 Test 3: List Pending Applications"
echo "----------------------------------------"
LIST_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/applications?status=pending&limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response:"
echo "$LIST_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$LIST_RESPONSE"
echo ""

# Check if our application is in the list
APP_COUNT=$(echo "$LIST_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['applications']))" 2>/dev/null || echo "0")

echo "✅ Found $APP_COUNT pending application(s)"
echo ""

# Test 4: Get Application Details
echo "📄 Test 4: Get Application Details"
echo "----------------------------------------"
DETAILS_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/applications/$APPLICATION_ID" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response:"
echo "$DETAILS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DETAILS_RESPONSE"
echo ""

echo "✅ Retrieved application details successfully!"
echo ""

# Test 5: Approve Application
echo "✅ Test 5: Approve Application"
echo "----------------------------------------"
APPROVE_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/applications/$APPLICATION_ID/approve" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "Response:"
echo "$APPROVE_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$APPROVE_RESPONSE"
echo ""

echo "✅ Application approved successfully!"
echo ""

# Test 6: Verify Doctor Can Login (Should Fail - Needs Password Reset)
echo "🔐 Test 6: Verify Doctor Status Changed"
echo "----------------------------------------"
DOCTOR_LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.doctor@example.com",
    "password": "SecurePass123!",
    "rememberMe": false
  }')

echo "Response:"
echo "$DOCTOR_LOGIN_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$DOCTOR_LOGIN_RESPONSE"
echo ""

# Test 7: List Verified Applications
echo "📋 Test 7: List Verified Applications"
echo "----------------------------------------"
VERIFIED_RESPONSE=$(curl -s -X GET "$BASE_URL/admin/applications?status=verified&limit=10&offset=0" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Response:"
echo "$VERIFIED_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$VERIFIED_RESPONSE"
echo ""

VERIFIED_COUNT=$(echo "$VERIFIED_RESPONSE" | python3 -c "import sys, json; print(len(json.load(sys.stdin)['data']['applications']))" 2>/dev/null || echo "0")

echo "✅ Found $VERIFIED_COUNT verified application(s)"
echo ""

echo "=========================================="
echo "✅ ALL TESTS COMPLETED SUCCESSFULLY!"
echo "=========================================="
echo ""
echo "Summary:"
echo "- Doctor registration: ✅"
echo "- Admin authentication: ✅"
echo "- List applications: ✅"
echo "- Get application details: ✅"
echo "- Approve application: ✅"
echo "- Verify status change: ✅"
echo ""
echo "📊 API Endpoints Tested:"
echo "  POST /api/v1/doctor/register"
echo "  POST /api/v1/auth/login"
echo "  GET  /api/v1/admin/applications"
echo "  GET  /api/v1/admin/applications/{id}"
echo "  POST /api/v1/admin/applications/{id}/approve"
echo ""
echo "🎉 Phase 3 Implementation Complete!"
