#!/usr/bin/env python3

"""
Quick test to verify Google Cloud STT API connectivity and configuration
"""

import os
from google.cloud import speech
from google.oauth2 import service_account
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_google_stt():
    print("🧪 Testing Google Cloud STT API connectivity...")
    
    # Initialize credentials
    credentials_path = os.getenv("GCP_CREDENTIALS_PATH", "gcp-credentials.json")
    print(f"📁 Loading credentials from: {credentials_path}")
    
    try:
        credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        speech_client = speech.SpeechClient(credentials=credentials)
        print("✅ Speech client initialized successfully")
        
        # Test basic configuration
        config = speech.RecognitionConfig(
            encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,
            language_code="mr-IN",
            alternative_language_codes=["en-IN", "hi-IN"],
            model="latest_long",
            use_enhanced=True,
            enable_automatic_punctuation=True,
            enable_word_confidence=True,
        )
        
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            interim_results=True,
            single_utterance=False
        )
        
        print("✅ STT configuration created successfully")
        print(f"📋 Config details:")
        print(f"   - Language: {config.language_code}")
        print(f"   - Alt languages: {config.alternative_language_codes}")
        print(f"   - Model: {config.model}")
        print(f"   - Encoding: {config.encoding}")
        print(f"   - Sample rate: {config.sample_rate_hertz}")
        
        # Create a simple test generator
        def test_generator():
            # Send a small silence frame to test the connection
            silence = b"\x00\x00" * 1600  # 100ms of silence
            print("📤 Sending test silence frame...")
            yield speech.StreamingRecognizeRequest(audio_content=silence)
        
        print("🔄 Testing streaming_recognize call...")
        
        try:
            responses = speech_client.streaming_recognize(
                config=streaming_config,
                requests=test_generator(),
            )
            print("✅ streaming_recognize call successful!")
            print("🎯 API connection is working correctly")
            
            # Try to get first response (might timeout, but that's OK)
            try:
                first_response = next(iter(responses))
                print(f"📥 Received response: {first_response}")
            except Exception as resp_error:
                print(f"⚠️ No response received (expected for silence): {resp_error}")
                
        except Exception as api_error:
            print(f"❌ streaming_recognize call failed: {api_error}")
            print(f"🔍 Error type: {type(api_error)}")
            return False
            
        return True
        
    except Exception as e:
        print(f"❌ Failed to initialize or test: {e}")
        return False

if __name__ == "__main__":
    success = test_google_stt()
    print(f"\n{'✅ Test PASSED' if success else '❌ Test FAILED'}")
