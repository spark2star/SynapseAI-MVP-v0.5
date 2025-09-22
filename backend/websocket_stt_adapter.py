"""
WebSocket STT Adapter - Adapts the reference Google STT implementation 
to work with browser WebSocket audio streams.

Based on Google's reference implementation but adapted for web environments.
"""

import queue
import threading
import time
import logging
from typing import Generator, Optional, Dict, Any
from datetime import datetime, timezone

from google.cloud import speech
from google.cloud.speech import StreamingRecognizeRequest, StreamingRecognitionConfig, RecognitionConfig
from google.oauth2 import service_account
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class WebSocketAudioStream:
    """
    Adapts browser WebSocket audio to Google STT reference pattern.
    Mimics the MicrophoneStream class from the reference implementation.
    """
    
    def __init__(self, rate: int = 16000, chunk_ms: int = 100):
        """
        Initialize WebSocket audio stream.
        
        Args:
            rate: Sample rate in Hz (16000 for Google STT)
            chunk_ms: Chunk size in milliseconds (100ms like reference)
        """
        self._rate = rate
        self._chunk_size = int(rate * chunk_ms / 1000)  # Convert ms to samples
        
        # Thread-safe audio buffer (like reference implementation)
        self._audio_queue: queue.Queue[bytes] = queue.Queue(maxsize=200)
        self.closed = True
        
        # WebSocket connection
        self._websocket: Optional[WebSocket] = None
        self._audio_thread: Optional[threading.Thread] = None
        
    def __enter__(self):
        """Context manager entry - start the stream"""
        self.closed = False
        return self
        
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - clean up the stream"""
        self.close()
        
    def close(self):
        """Close the audio stream and clean up resources"""
        self.closed = True
        # Signal generator to terminate (like reference implementation)
        self._audio_queue.put(None)
        
        if self._audio_thread and self._audio_thread.is_alive():
            self._audio_thread.join(timeout=1.0)
            
    async def connect_websocket(self, websocket: WebSocket):
        """Connect to WebSocket and start receiving audio"""
        self._websocket = websocket
        self.closed = False
        
        # Start background thread to receive audio (like PyAudio callback)
        self._audio_thread = threading.Thread(
            target=self._websocket_audio_receiver,
            daemon=True
        )
        self._audio_thread.start()
        
    def _websocket_audio_receiver(self):
        """
        Background thread to receive WebSocket audio and put in queue.
        Mimics the PyAudio stream_callback from reference implementation.
        """
        try:
            import asyncio
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
            async def receive_loop():
                while not self.closed and self._websocket:
                    try:
                        # Receive audio data from WebSocket
                        audio_data = await self._websocket.receive_bytes()
                        
                        # Convert to proper format if needed (WebRTC -> LINEAR16)
                        processed_audio = self._process_audio_chunk(audio_data)
                        
                        # Put in queue (like reference _fill_buffer)
                        if processed_audio and not self.closed:
                            self._audio_queue.put(processed_audio)
                            
                    except Exception as e:
                        if not self.closed:
                            logger.error(f"WebSocket audio receive error: {e}")
                        break
                        
                # Signal end of stream
                self._audio_queue.put(None)
                
            loop.run_until_complete(receive_loop())
            
        except Exception as e:
            logger.error(f"WebSocket receiver thread error: {e}")
            self._audio_queue.put(None)
            
    def _process_audio_chunk(self, raw_audio: bytes) -> Optional[bytes]:
        """
        Process raw WebSocket audio to LINEAR16 format.
        Converts WebRTC audio to format expected by Google STT.
        """
        try:
            # For now, assume audio is already in correct format
            # TODO: Add proper WebRTC -> LINEAR16 conversion if needed
            return raw_audio
        except Exception as e:
            logger.error(f"Audio processing error: {e}")
            return None
            
    def generator(self) -> Generator[bytes, None, None]:
        """
        Generate audio chunks for Google STT (like reference implementation).
        Yields audio data from the queue in the exact same pattern as the reference.
        """
        while not self.closed:
            # Use blocking get() like reference implementation
            chunk = self._audio_queue.get()
            if chunk is None:
                return  # End of stream signal
                
            data = [chunk]
            
            # Consume any additional buffered data (like reference)
            while True:
                try:
                    chunk = self._audio_queue.get(block=False)
                    if chunk is None:
                        return
                    data.append(chunk)
                except queue.Empty:
                    break
                    
            # Yield combined audio data
            yield b"".join(data)

class GoogleSTTStreamer:
    """
    Google STT streaming client adapted from reference implementation.
    Handles the streaming recognition and response processing.
    """
    
    def __init__(self, credentials_path: str):
        """Initialize Google STT client"""
        self.credentials = service_account.Credentials.from_service_account_file(
            credentials_path,
            scopes=['https://www.googleapis.com/auth/cloud-platform']
        )
        self.client = speech.SpeechClient(credentials=self.credentials)
        
    def get_streaming_config(self, 
                           language_code: str = "mr-IN",
                           alt_languages: list = None,
                           mental_health_phrases: list = None) -> StreamingRecognitionConfig:
        """
        Create streaming recognition config (enhanced from reference).
        Adds mental health specific configuration.
        """
        if alt_languages is None:
            alt_languages = ["en-IN", "hi-IN"]
            
        # Build recognition config like reference
        recognition_config = RecognitionConfig(
            encoding=RecognitionConfig.AudioEncoding.LINEAR16,
            sample_rate_hertz=16000,  # Match reference RATE
            language_code=language_code,
            alternative_language_codes=alt_languages,
            model="latest_long",  # Best for medical conversations
            use_enhanced=True,
            enable_automatic_punctuation=True,
            enable_word_confidence=True,
        )
        
        # Add mental health speech contexts if provided
        if mental_health_phrases:
            recognition_config.speech_contexts = [
                speech.SpeechContext(
                    phrases=mental_health_phrases[:500],  # Limit for performance
                    boost=15.0
                )
            ]
            
        # Create streaming config (like reference)
        streaming_config = StreamingRecognitionConfig(
            config=recognition_config,
            interim_results=True  # Enable interim results like reference
        )
        
        return streaming_config
        
    async def stream_recognition(self, 
                                audio_stream: WebSocketAudioStream,
                                websocket: WebSocket,
                                config: StreamingRecognitionConfig,
                                session_id: str = "unknown") -> None:
        """
        Run streaming recognition (adapted from reference main() function).
        Processes responses and sends back to WebSocket.
        """
        try:
            logger.info(f"🎤 Starting Google STT streaming for session {session_id}")
            
            # Create audio generator (like reference)
            audio_generator = audio_stream.generator()
            
            # Create streaming requests (exactly like reference)
            requests = (
                StreamingRecognizeRequest(audio_content=content)
                for content in audio_generator
            )
            
            # Start streaming recognition (like reference)
            responses = self.client.streaming_recognize(config, requests)
            
            # Process responses (adapted from reference listen_print_loop)
            await self._process_streaming_responses(responses, websocket, session_id)
            
        except Exception as e:
            logger.error(f"🔥 STT streaming error for session {session_id}: {e}")
            await self._send_error_response(websocket, str(e), session_id)
            
    async def _process_streaming_responses(self, 
                                         responses, 
                                         websocket: WebSocket,
                                         session_id: str):
        """
        Process streaming responses (adapted from reference listen_print_loop).
        Sends interim and final results back through WebSocket.
        """
        try:
            for response in responses:
                if not response.results:
                    continue
                    
                # Get first result (like reference)
                result = response.results[0]
                if not result.alternatives:
                    continue
                    
                # Get transcript (like reference)
                transcript = result.alternatives[0].transcript
                confidence = getattr(result.alternatives[0], 'confidence', 0.0)
                
                # Send response based on finality (like reference interim/final handling)
                if not result.is_final:
                    # Interim result
                    await websocket.send_json({
                        "type": "interim_transcript",
                        "text": transcript,
                        "confidence": confidence,
                        "session_id": session_id,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                else:
                    # Final result (like reference print with newline)
                    await websocket.send_json({
                        "type": "final_transcript", 
                        "text": transcript,
                        "confidence": confidence,
                        "session_id": session_id,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    
                    logger.info(f"📝 Final STT result: {transcript[:50]}...")
                    
        except Exception as e:
            logger.error(f"Response processing error: {e}")
            await self._send_error_response(websocket, str(e), session_id)
            
    async def _send_error_response(self, websocket: WebSocket, error_msg: str, session_id: str):
        """Send error response through WebSocket"""
        try:
            await websocket.send_json({
                "type": "stt_error",
                "error": error_msg,
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
        except:
            pass  # WebSocket might be closed
