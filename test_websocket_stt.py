#!/usr/bin/env python3

"""
Test WebSocket STT connection directly
"""

import asyncio
import websockets
import json
import wave
import numpy as np

async def test_websocket_stt():
    print("🧪 Testing WebSocket STT connection...")
    
    # Connect to WebSocket endpoint
    uri = "ws://localhost:8000/ws/consultation/TEST-SESSION"
    
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Wait for initial messages
            try:
                while True:
                    message = await asyncio.wait_for(websocket.recv(), timeout=2.0)
                    data = json.loads(message)
                    print(f"📥 Received: {data.get('type', 'unknown')} - {data.get('message', '')[:100]}")
                    
                    if data.get('type') == 'stt_ready':
                        print("🎯 STT is ready, sending test audio...")
                        break
            except asyncio.TimeoutError:
                print("⚠️ No initial messages received")
            
            # Create fake audio data (PCM 16-bit, 16kHz)
            duration = 2.0  # 2 seconds
            sample_rate = 16000
            samples = int(duration * sample_rate)
            
            # Generate a simple tone instead of silence
            frequency = 440  # A note
            t = np.linspace(0, duration, samples, False)
            audio_data = np.sin(frequency * 2 * np.pi * t) * 0.1  # Low volume
            audio_bytes = (audio_data * 32767).astype(np.int16).tobytes()
            
            print(f"📤 Sending {len(audio_bytes)} bytes of test audio...")
            
            # Send audio in chunks
            chunk_size = 2730  # Same as real frontend
            for i in range(0, len(audio_bytes), chunk_size):
                chunk = audio_bytes[i:i+chunk_size]
                await websocket.send(chunk)
                await asyncio.sleep(0.1)  # Simulate real-time streaming
                print(f"📤 Sent chunk {i//chunk_size + 1}")
            
            print("🎯 Waiting for transcription responses...")
            
            # Wait for responses
            try:
                for _ in range(10):  # Wait up to 10 responses
                    message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                    data = json.loads(message)
                    print(f"📥 STT Response: {data}")
                    
                    if data.get('type') == 'transcription':
                        print("✅ Received transcription!")
                        return True
                        
            except asyncio.TimeoutError:
                print("⚠️ No transcription responses received")
            
            # Send stop signal
            await websocket.send(json.dumps({"type": "stop_recording"}))
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    return False

if __name__ == "__main__":
    result = asyncio.run(test_websocket_stt())
    print(f"\n{'✅ WebSocket test PASSED' if result else '❌ WebSocket test FAILED'}")
