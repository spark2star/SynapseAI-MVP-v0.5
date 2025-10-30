#!/usr/bin/env python3
"""Quick test to verify Gemini service is working with the new model"""

import sys
import asyncio
sys.path.insert(0, 'backend')

from app.services.gemini_service import gemini_service

async def test_report_generation():
    print("🧪 Testing Gemini report generation...")
    print(f"📦 Model: {gemini_service.model_name}")
    print(f"📍 Location: {gemini_service.location}")
    
    # Test transcript (Hindi/Marathi)
    test_transcript = """हमारे पास जो मरीज आए हैं वह काफी वक्त से परेशान चल रही 
    आपकी नींद में गड़बड़ है और आपको रात में नींद नहीं आती ठीक से 
    3 साल से आप इस प्रॉब्लम से जूझ रही हैं"""
    
    result = await gemini_service.generate_medical_report(
        transcription=test_transcript,
        session_type="follow_up",
        patient_status="stable",
        medications="No medications prescribed"
    )
    
    print(f"\n✅ Status: {result['status']}")
    print(f"📊 Model used: {result.get('model_used', 'N/A')}")
    print(f"🎯 Confidence: {result.get('confidence_score', 0)}")
    print(f"📝 Report preview: {result.get('report', '')[:200]}...")
    
    if result['status'] == 'success' and result.get('model_used') != 'template-fallback':
        print("\n🎉 SUCCESS! Gemini is generating real reports!")
        return True
    else:
        print("\n❌ FAILED! Still using fallback template")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_report_generation())
    sys.exit(0 if success else 1)
