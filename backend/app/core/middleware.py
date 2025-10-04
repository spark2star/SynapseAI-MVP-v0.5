"""
Middleware for request tracking and error logging.

This module provides:
- RequestIDMiddleware: Generates unique request IDs and tracks timing
- ErrorLoggingMiddleware: Catches and logs all unhandled exceptions
"""

import uuid
import time
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response
from fastapi import HTTPException
import logging

logger = logging.getLogger(__name__)


class RequestIDMiddleware(BaseHTTPMiddleware):
    """
    Middleware that:
    1. Generates unique request ID for each request
    2. Adds request ID to response headers
    3. Makes request ID available in request.state
    4. Logs all requests with timing information
    
    The request ID can be used to trace a request through the entire system,
    making it easy to find all logs related to a specific request.
    """
    
    async def dispatch(self, request: Request, call_next):
        # Generate or extract request ID
        request_id = request.headers.get('X-Request-ID') or str(uuid.uuid4())
        
        # Store in request state for access in endpoints
        request.state.request_id = request_id
        
        # Start timing
        start_time = time.time()
        
        # Log incoming request
        logger.info(
            f"Request started: {request.method} {request.url.path}",
            extra={
                'request_id': request_id,
                'method': request.method,
                'path': request.url.path,
                'query_params': dict(request.query_params),
                'client_ip': request.client.host if request.client else None,
                'user_agent': request.headers.get('user-agent')
            }
        )
        
        try:
            # Process request
            response = await call_next(request)
            
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Add request ID to response headers
            response.headers['X-Request-ID'] = request_id
            
            # Log successful response
            logger.info(
                f"Request completed: {request.method} {request.url.path}",
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'path': request.url.path,
                    'status_code': response.status_code,
                    'duration_ms': round(duration_ms, 2)
                }
            )
            
            return response
            
        except Exception as e:
            # Calculate duration
            duration_ms = (time.time() - start_time) * 1000
            
            # Log error
            logger.error(
                f"Request failed: {request.method} {request.url.path}",
                exc_info=True,
                extra={
                    'request_id': request_id,
                    'method': request.method,
                    'path': request.url.path,
                    'duration_ms': round(duration_ms, 2),
                    'error_type': type(e).__name__,
                    'error_message': str(e)
                }
            )
            
            # Re-raise to let FastAPI handle it
            raise


class ErrorLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware that catches all unhandled exceptions and logs them with full context.
    
    This ensures that even unexpected errors are properly logged with:
    - Request ID for tracing
    - Full stack trace
    - Request details (path, method, etc.)
    """
    
    async def dispatch(self, request: Request, call_next):
        try:
            response = await call_next(request)
            return response
        except HTTPException as e:
            # Log HTTP exceptions (these are expected errors)
            logger.warning(
                f"HTTP Exception: {e.status_code} - {e.detail}",
                extra={
                    'request_id': getattr(request.state, 'request_id', None),
                    'status_code': e.status_code,
                    'detail': e.detail,
                    'path': request.url.path,
                    'method': request.method
                }
            )
            raise
        except Exception as e:
            # Log unexpected errors with full stack trace
            logger.error(
                f"Unhandled exception: {type(e).__name__}",
                exc_info=True,
                extra={
                    'request_id': getattr(request.state, 'request_id', None),
                    'path': request.url.path,
                    'method': request.method,
                    'error_type': type(e).__name__,
                    'error_message': str(e)
                }
            )
            raise

