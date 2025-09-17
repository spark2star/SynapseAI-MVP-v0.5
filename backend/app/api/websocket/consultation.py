"""
WebSocket endpoints for real-time consultation features.
Handles audio streaming and live transcription.
"""

import asyncio
import json
import logging
from typing import Dict, Any
from datetime import datetime, timezone

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.session import ConsultationSession, SessionStatus
from app.services.stt_service import stt_service
from app.core.audit import audit_logger, AuditEventType

logger = logging.getLogger(__name__)

router = APIRouter()

class ConsultationWebSocketManager:
    """Manages WebSocket connections for consultation sessions."""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.session_metadata: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, websocket: WebSocket, session_id: str):
        """Accept WebSocket connection for consultation session."""
        await websocket.accept()
        self.active_connections[session_id] = websocket
        self.session_metadata[session_id] = {
            "connected_at": datetime.now(timezone.utc),
            "audio_chunks_received": 0,
            "last_activity": datetime.now(timezone.utc)
        }
        logger.info(f"WebSocket connected for session {session_id}")
    
    def disconnect(self, session_id: str):
        """Disconnect WebSocket and cleanup."""
        if session_id in self.active_connections:
            del self.active_connections[session_id]
        if session_id in self.session_metadata:
            del self.session_metadata[session_id]
        logger.info(f"WebSocket disconnected for session {session_id}")
    
    async def send_message(self, session_id: str, message: Dict[str, Any]):
        """Send message to specific session."""
        if session_id in self.active_connections:
            try:
                await self.active_connections[session_id].send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to session {session_id}: {str(e)}")
    
    async def broadcast_to_session(self, session_id: str, data: Dict[str, Any]):
        """Broadcast data to consultation session participants."""
        await self.send_message(session_id, data)

# Global WebSocket manager
websocket_manager = ConsultationWebSocketManager()

@router.websocket("/ws/consultation/{session_id}")
async def consultation_websocket(
    websocket: WebSocket, 
    session_id: str,
    db: Session = Depends(get_db)
):
    """
    WebSocket endpoint for real-time consultation features.
    Handles audio streaming, transcription, and live updates.
    """
    
    # Verify session exists and is active
    consultation = db.query(ConsultationSession).filter(
        ConsultationSession.session_id == session_id
    ).first()
    
    if not consultation:
        await websocket.close(code=1008, reason="Session not found")
        return
    
    if consultation.status not in [SessionStatus.IN_PROGRESS.value, SessionStatus.PAUSED.value]:
        await websocket.close(code=1008, reason="Session not active")
        return
    
    # Connect WebSocket
    await websocket_manager.connect(websocket, session_id)
    
    try:
        # Send initial connection confirmation
        await websocket_manager.send_message(session_id, {
            "type": "connected",
            "session_id": session_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "message": "Connected to consultation session"
        })
        
        # Start STT streaming in background
        stt_task = None
        if consultation.status == SessionStatus.IN_PROGRESS.value:
            stt_task = asyncio.create_task(
                start_stt_streaming(session_id, websocket)
            )
        
        # Handle incoming messages
        while True:
            try:
                # Receive data from WebSocket
                data = await websocket.receive()
                
                if "bytes" in data:
                    # Handle audio data
                    audio_data = data["bytes"]
                    await handle_audio_data(session_id, audio_data, db)
                    
                elif "text" in data:
                    # Handle control messages
                    try:
                        message = json.loads(data["text"])
                        await handle_control_message(session_id, message, websocket, db)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON message received for session {session_id}")
                
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket data for session {session_id}: {str(e)}")
                await websocket_manager.send_message(session_id, {
                    "type": "error",
                    "message": str(e),
                    "timestamp": datetime.now(timezone.utc).isoformat()
                })
                
    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {str(e)}")
    finally:
        # Cleanup
        if stt_task and not stt_task.done():
            stt_task.cancel()
        websocket_manager.disconnect(session_id)

async def start_stt_streaming(session_id: str, websocket: WebSocket):
    """Start STT streaming for the consultation session."""
    try:
        # Create a mock WebSocket URI for the STT service
        websocket_uri = f"ws://localhost:8000/ws/audio/{session_id}"
        
        # Stream STT results
        async for stt_result in stt_service.start_streaming_recognition(session_id, websocket_uri):
            # Forward STT results to frontend
            await websocket_manager.send_message(session_id, {
                "type": "transcription",
                "data": stt_result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
    except Exception as e:
        logger.error(f"STT streaming error for session {session_id}: {str(e)}")
        await websocket_manager.send_message(session_id, {
            "type": "stt_error",
            "error": str(e),
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

async def handle_audio_data(session_id: str, audio_data: bytes, db: Session):
    """Handle incoming audio data from WebSocket."""
    try:
        # Update session metadata
        if session_id in websocket_manager.session_metadata:
            metadata = websocket_manager.session_metadata[session_id]
            metadata["audio_chunks_received"] += 1
            metadata["last_activity"] = datetime.now(timezone.utc)
        
        # TODO: Forward audio data to STT service
        # For now, we'll use mock processing
        logger.debug(f"Received {len(audio_data)} bytes of audio for session {session_id}")
        
    except Exception as e:
        logger.error(f"Error handling audio data for session {session_id}: {str(e)}")

async def handle_control_message(
    session_id: str, 
    message: Dict[str, Any], 
    websocket: WebSocket,
    db: Session
):
    """Handle control messages from the frontend."""
    try:
        message_type = message.get("type")
        
        if message_type == "start_recording":
            # Start recording and transcription
            await websocket_manager.send_message(session_id, {
                "type": "recording_started",
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        elif message_type == "stop_recording":
            # Stop recording and finalize transcription
            result = await stt_service.finalize_session_transcription(session_id)
            await websocket_manager.send_message(session_id, {
                "type": "recording_stopped",
                "session_id": session_id,
                "transcription_result": result,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        elif message_type == "pause_recording":
            # Pause recording
            await websocket_manager.send_message(session_id, {
                "type": "recording_paused",
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        elif message_type == "resume_recording":
            # Resume recording
            await websocket_manager.send_message(session_id, {
                "type": "recording_resumed",
                "session_id": session_id,
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        elif message_type == "ping":
            # Respond to ping with pong
            await websocket_manager.send_message(session_id, {
                "type": "pong",
                "timestamp": datetime.now(timezone.utc).isoformat()
            })
            
        else:
            logger.warning(f"Unknown control message type: {message_type}")
            
    except Exception as e:
        logger.error(f"Error handling control message for session {session_id}: {str(e)}")
        await websocket_manager.send_message(session_id, {
            "type": "error",
            "message": f"Error processing control message: {str(e)}",
            "timestamp": datetime.now(timezone.utc).isoformat()
        })

# Export the router and manager for use in main app
__all__ = ["router", "websocket_manager"]
