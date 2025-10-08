"""
WebSocket authentication utilities.
"""

from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.config import settings
from app.models.user import User
import logging

logger = logging.getLogger(__name__)


async def get_current_user_websocket(token: str, db: Session):
    """
    Verify JWT token and return current user for WebSocket connections.
    Returns None if auth fails (caller handles closing connection).
    """
    try:
        # Decode JWT token
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        
        user_id: str = payload.get("sub")
        if user_id is None:
            logger.error("Token payload missing 'sub' field")
            return None
        
        # Fetch user from database
        user = db.query(User).filter(User.id == user_id).first()
        
        if user is None:
            logger.error(f"User not found: {user_id}")
            return None
        
        logger.info(f"✅ WebSocket user authenticated: {user.email}")
        return user
        
    except JWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        return None
    except Exception as e:
        logger.error(f"Unexpected auth error: {str(e)}")
        return None
