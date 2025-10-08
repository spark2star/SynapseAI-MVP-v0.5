"""
WebSocket endpoint for real-time Speech-to-Text transcription.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
import logging
import json

from app.core.database import get_db
from app.core.auth_websocket import get_current_user_websocket
from app.services.stt_service import stt_service
from app.services.report_service import ReportService
from app.models.session import ConsultationSession
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.websocket("/ws/transcribe")
async def websocket_transcribe_endpoint(
    websocket: WebSocket,
    token: str = Query(...),
    session_id: str = Query(...),
):
    """
    WebSocket endpoint for real-time transcription.
    """
    
    # Get database session
    db = next(get_db())
    
    try:
        # Accept connection first
        await websocket.accept()
        
        # Verify token and get user
        user = await get_current_user_websocket(token, db)
        
        if not user:
            await websocket.send_json({"error": "Invalid authentication token"})
            await websocket.close(code=1008)
            return
        
        # Verify session exists and belongs to doctor
        session = db.query(ConsultationSession).filter(
            ConsultationSession.session_id == session_id
        ).first()
        
        if not session:
            error_msg = {
                "error": "Session not found or not active",
                "code": "SESSION_NOT_FOUND",
                "detail": f"No active session found with ID {session_id} for user {user.id}"
            }
            logger.warning(f"Session {session_id} not found in database for user {user.id}")
            await websocket.send_json(error_msg)
            await websocket.close(code=1008)
            return
        
        # Check if session belongs to this doctor
        if session.doctor_id != user.id:
            await websocket.send_json({"error": "Access denied"})
            await websocket.close(code=1008)
            return
        
        logger.info(f"🎙️ WebSocket connected for session {session_id}, user {user.email}")
        
        # Send connection success message
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "STT service connected"
        })
        
        # Process audio streaming
        while True:
            try:
                data = await websocket.receive()
                
                if "text" in data:
                    message = json.loads(data["text"])
                    
                    if message.get("type") == "stop":
                        logger.info(f"Received stop signal for session {session_id}")
                        break
                
                elif "bytes" in data:
                    # Process audio chunk
                    pass
                    
            except WebSocketDisconnect:
                logger.info(f"WebSocket disconnected for session {session_id}")
                break
            except Exception as e:
                logger.error(f"Error processing audio: {str(e)}")
                await websocket.send_json({"type": "error", "error": str(e)})
                
    except Exception as e:
        logger.error(f"WebSocket error: {str(e)}")
        try:
            await websocket.send_json({"error": str(e)})
        except:
            pass
    finally:
        try:
            await websocket.close()
            db.close()
        except:
            pass



# @router.post("/consultation/{session_id}/generate-report")
# async def generate_report_endpoint(
#     session_id: str,
#     current_user: User = Depends(get_current_user_websocket),
#     db: Session = Depends(get_db)
# ):
#     """
#     Generate clinical report from consultation transcription.
#     """
#     try:
#         # Verify session exists
#         session = db.query(ConsultationSession).filter(
#             ConsultationSession.session_id == session_id,
#             ConsultationSession.doctor_id == current_user.id
#         ).first()
        
#         if not session:
#             raise HTTPException(status_code=404, detail="Session not found")
        
#         # Get transcription
#         from app.models.session import Transcription
#         transcription = db.query(Transcription).filter(
#             Transcription.session_id == session.id
#         ).first()
        
#         if not transcription:
#             raise HTTPException(status_code=404, detail="Transcription not found")
        
#         # Create report using report service
#         report = ReportService.create_report(
#             db=db,
#             session_id=str(session.id),
#             transcription_id=str(transcription.id),
#             doctor_id=str(current_user.id)
#         )
        
#         return {
#             "report_id": str(report.id),
#             "status": report.status,
#             "message": "Report generation started"
#         }
        
#     except Exception as e:
#         logger.error(f"Error generating report: {str(e)}")
#         raise HTTPException(status_code=500, detail=str(e))
