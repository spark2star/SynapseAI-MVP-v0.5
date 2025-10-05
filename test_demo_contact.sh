#!/bin/bash

# Demo Request & Contact System - Test Script
# This script tests the API endpoints to ensure everything is working

echo "=========================================="
echo "🧪 Testing Demo & Contact System"
echo "=========================================="
echo ""

# Check if backend is running
echo "📡 Checking if backend is running..."
BACKEND_URL="http://localhost:8080/api/v1"
if curl -s "$BACKEND_URL/health/check" > /dev/null 2>&1; then
    echo "✅ Backend is running"
else
    echo "❌ Backend is not running. Start it with:"
    echo "   cd backend && uvicorn app.main:app --reload --port 8080"
    exit 1
fi

echo ""
echo "=========================================="
echo "🎯 Test 1: Submit Demo Request"
echo "=========================================="

DEMO_RESPONSE=$(curl -s -X POST "$BACKEND_URL/forms/demo-requests" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+91 9876543210",
    "organization": "Test Hospital",
    "job_title": "Psychiatrist",
    "message": "This is a test demo request",
    "preferred_date": "Next Tuesday"
  }')

if echo "$DEMO_RESPONSE" | grep -q "success"; then
    echo "✅ Demo request submitted successfully"
    echo "📧 Check mohdanees1717@gmail.com for notification"
else
    echo "❌ Demo request failed"
    echo "Response: $DEMO_RESPONSE"
fi

echo ""
echo "=========================================="
echo "📧 Test 2: Submit Contact Message"
echo "=========================================="

CONTACT_RESPONSE=$(curl -s -X POST "$BACKEND_URL/forms/contact-messages" \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "Test User",
    "email": "test@example.com",
    "phone": "+91 9876543210",
    "subject": "Test Contact Message",
    "message": "This is a test contact message",
    "category": "general"
  }')

if echo "$CONTACT_RESPONSE" | grep -q "success"; then
    echo "✅ Contact message submitted successfully"
    echo "📧 Check mohdanees1717@gmail.com for notification"
else
    echo "❌ Contact message failed"
    echo "Response: $CONTACT_RESPONSE"
fi

echo ""
echo "=========================================="
echo "🎉 Testing Complete!"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Check your email: mohdanees1717@gmail.com"
echo "2. Visit frontend: http://localhost:3000/demo"
echo "3. Visit frontend: http://localhost:3000/contact"
echo "4. Check API docs: http://localhost:8080/docs"
echo ""
echo "If emails didn't arrive, check backend logs for errors."
echo "=========================================="
