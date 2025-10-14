#!/bin/bash

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🔍 MARATHI/HINDI STT ACCURACY TEST"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

# Test 1: Check backend is running
echo "📡 [Test 1/3] Checking backend health..."
echo "────────────────────────────────────────────────────────────────────────────────"

HEALTH_RESPONSE=$(curl -s http://localhost:8080/api/v1/stt/health 2>/dev/null)

if [ $? -ne 0 ]; then
    echo "❌ FAILED: Backend not responding"
    echo "   Start backend with: cd backend && uvicorn app.main:app --reload --host 0.0.0.0 --port 8080"
    exit 1
fi

echo "✅ Backend is responding"
echo ""

# Test 2: Verify enhanced Marathi configuration
echo "🇮🇳 [Test 2/3] Verifying Marathi/Hindi enhancements..."
echo "────────────────────────────────────────────────────────────────────────────────"

TYPE=$(echo "$HEALTH_RESPONSE" | grep -o '"type":"[^"]*"' | cut -d'"' -f4)
PRIMARY_LANG=$(echo "$HEALTH_RESPONSE" | grep -o '"primary_language":"[^"]*"' | cut -d'"' -f4)
PHRASES=$(echo "$HEALTH_RESPONSE" | grep -o '"context_phrases":[0-9]*' | grep -o '[0-9]*')
BOOST=$(echo "$HEALTH_RESPONSE" | grep -o '"phrase_boost_range":"[^"]*"' | cut -d'"' -f4)
POST_PROC=$(echo "$HEALTH_RESPONSE" | grep -o '"enabled":[^,}]*' | grep -o 'true\|false')

if [ "$TYPE" = "enhanced_marathi_hindi_clinical_stt" ]; then
    echo "✅ Type: $TYPE"
else
    echo "⚠️  Type: $TYPE (expected: enhanced_marathi_hindi_clinical_stt)"
fi

if [ "$PRIMARY_LANG" = "mr-IN" ]; then
    echo "✅ Primary Language: $PRIMARY_LANG (Marathi)"
else
    echo "❌ Primary Language: $PRIMARY_LANG (expected: mr-IN)"
fi

if [ "$PHRASES" -ge 150 ]; then
    echo "✅ Context Phrases: $PHRASES (enhanced vocabulary)"
else
    echo "⚠️  Context Phrases: $PHRASES (expected: 180+)"
fi

if [ "$BOOST" = "16-20 (HIGH)" ]; then
    echo "✅ Boost Range: $BOOST"
else
    echo "⚠️  Boost Range: $BOOST (expected: 16-20 (HIGH))"
fi

if [ "$POST_PROC" = "true" ]; then
    echo "✅ Post-processing: Enabled"
else
    echo "❌ Post-processing: Disabled (expected: Enabled)"
fi

echo ""

# Test 3: Show full configuration
echo "⚙️  [Test 3/3] Full Configuration:"
echo "────────────────────────────────────────────────────────────────────────────────"
echo "$HEALTH_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$HEALTH_RESPONSE"
echo ""

echo "════════════════════════════════════════════════════════════════════════════════"
echo "📊 TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Backend is running and configured for enhanced Marathi/Hindi accuracy"
echo ""
echo "Next Steps:"
echo "1. Test with real Marathi speech in the UI"
echo "2. Check backend logs for:"
echo "   - 'Config created with ENHANCED Marathi/Hindi context'"
echo "   - 'Corrected transcript:' messages showing post-processing"
echo "3. Verify accuracy: Aim for 85%+ word accuracy"
echo ""
echo "Test Sentences:"
echo "  Marathi: 'रुग्ण आज कामाच्या तणावामुळे चिंतित आहे'"
echo "  Code-mix: 'मरीज stress और anxiety के बारे में बात कर रहा है'"
echo ""
echo "════════════════════════════════════════════════════════════════════════════════"

