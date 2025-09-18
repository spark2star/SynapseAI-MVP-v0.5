#!/usr/bin/env python3

"""
Simple test of Google Cloud STT with real speech
"""

import os
import asyncio
import websockets
import json
import pyaudio
import wave
import numpy as np
from google.cloud import speech
from google.oauth2 import service_account
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

async def test_real_audio_stt():
    print("🧪 Testing STT with real speech (speak into microphone)...")
    
    # Connect to WebSocket endpoint
    uri = "ws://localhost:8000/ws/consultation/REAL-TEST"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Wait for STT ready
            try:
                while True:
                    message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
                    data = json.loads(message)
                    print(f"📥 Received: {data.get('type', 'unknown')}")
                    
                    if data.get('type') == 'stt_ready':
                        print("🎯 STT is ready!")
                        break
            except asyncio.TimeoutError:
                print("⚠️ No STT ready message")
                return False
            
            print("🎤 Speak now for 5 seconds...")
            
            # Record from microphone
            CHUNK = 1365  # Half of 2730 to match frontend chunk size
            FORMAT = pyaudio.paInt16
            CHANNELS = 1
            RATE = 16000
            RECORD_SECONDS = 5
            
            p = pyaudio.PyAudio()
            
            try:
                stream = p.open(format=FORMAT,
                              channels=CHANNELS,
                              rate=RATE,
                              input=True,
                              frames_per_buffer=CHUNK)
                
                print("🔴 Recording... speak now!")
                
                frames = []
                for i in range(0, int(RATE / CHUNK * RECORD_SECONDS)):
                    data = stream.read(CHUNK)
                    frames.append(data)
                    # Send real-time to WebSocket
                    await websocket.send(data)
                    
                    if i % 10 == 0:  # Every 10th chunk
                        print(f"📤 Sent chunk {i+1}")
                    
                    # Check for responses
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=0.01)
                        data = json.loads(message)
                        if data.get('type') == 'transcription':
                            transcript = data.get('data', {}).get('transcript', '')
                            transcript_type = data.get('data', {}).get('type', '')
                            print(f"✅ Transcription ({transcript_type}): '{transcript}'")
                            if transcript_type == 'final':
                                print("🎉 Got final transcription!")
                                return True
                    except asyncio.TimeoutError:
                        pass  # No response yet
                
                print("🔴 Recording finished")
                
                stream.stop_stream()
                stream.close()
                
                # Wait a bit more for final responses
                print("⏳ Waiting for final transcription...")
                for _ in range(30):  # Wait up to 3 seconds
                    try:
                        message = await asyncio.wait_for(websocket.recv(), timeout=0.1)
                        data = json.loads(message)
                        if data.get('type') == 'transcription':
                            transcript = data.get('data', {}).get('transcript', '')
                            transcript_type = data.get('data', {}).get('type', '')
                            print(f"✅ Final transcription ({transcript_type}): '{transcript}'")
                            if transcript_type == 'final':
                                return True
                    except asyncio.TimeoutError:
                        pass
                        
            finally:
                p.terminate()
            
            # Send stop signal
            await websocket.send(json.dumps({"type": "stop_recording"}))
            
    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False
    
    return False

if __name__ == "__main__":
    print("⚠️ Make sure your microphone is working and you're in a quiet environment")
    print("📢 You'll need to speak clearly in Marathi, English, or Hindi")
    
    try:
        result = asyncio.run(test_real_audio_stt())
        print(f"\n{'✅ Real audio test PASSED' if result else '❌ Real audio test FAILED'}")
    except KeyboardInterrupt:
        print("\n🛑 Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test error: {e}")
