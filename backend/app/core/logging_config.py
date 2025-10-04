"""
Structured JSON logging configuration for production-ready logging.

This module provides:
- CustomJsonFormatter: Formats logs as JSON with standard fields
- setup_logging: Configures application-wide logging
- LogContext: Context manager for adding contextual information to logs
"""

import logging
import json
import sys
import traceback
from datetime import datetime
from typing import Optional
from pythonjsonlogger import jsonlogger


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """
    Custom JSON formatter that adds standard fields to all log records.
    
    Standard fields added to every log:
    - timestamp: ISO 8601 format
    - level: Log level name (INFO, WARNING, ERROR, etc.)
    - logger: Logger name
    - message: Log message
    - source: Module, function, and line number
    
    Optional context fields (added via extra parameter):
    - request_id: Unique request identifier
    - user_id: Authenticated user ID
    - endpoint: API endpoint path
    - method: HTTP method
    - duration_ms: Request duration in milliseconds
    - status_code: HTTP response code
    """
    
    def add_fields(self, log_record, record, message_dict):
        """Add custom fields to log record"""
        super(CustomJsonFormatter, self).add_fields(log_record, record, message_dict)
        
        # Add timestamp in ISO 8601 format
        if not log_record.get('timestamp'):
            log_record['timestamp'] = datetime.utcnow().isoformat() + 'Z'
        
        # Add log level
        if log_record.get('level'):
            log_record['level'] = log_record['level'].upper()
        else:
            log_record['level'] = record.levelname
        
        # Add logger name
        log_record['logger'] = record.name
        
        # Add source location
        log_record['source'] = {
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_record['exception'] = {
                'type': record.exc_info[0].__name__,
                'message': str(record.exc_info[1]),
                'stacktrace': traceback.format_exception(*record.exc_info)
            }


def setup_logging(log_level: str = "INFO") -> logging.Logger:
    """
    Configure application logging with JSON format.
    
    Args:
        log_level: Minimum log level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        Configured root logger
    
    Example:
        logger = setup_logging(log_level="INFO")
        logger.info("Application started")
    """
    # Create handler for stdout
    handler = logging.StreamHandler(sys.stdout)
    
    # Set JSON formatter
    formatter = CustomJsonFormatter(
        '%(timestamp)s %(level)s %(logger)s %(message)s'
    )
    handler.setFormatter(formatter)
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers to avoid duplicates
    root_logger.handlers = []
    root_logger.addHandler(handler)
    
    # Reduce noise from libraries
    logging.getLogger('uvicorn.access').setLevel(logging.WARNING)
    logging.getLogger('uvicorn.error').setLevel(logging.INFO)
    logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)
    logging.getLogger('sqlalchemy.pool').setLevel(logging.WARNING)
    
    return root_logger


class LogContext:
    """
    Context manager for adding contextual information to all log records.
    
    Usage:
        with LogContext(request_id="req-123", user_id="user-456"):
            logger.info("Processing request")
            # All logs in this block will include request_id and user_id
    
    This is useful for adding request-specific context that should appear
    in all logs within a request handler.
    """
    
    def __init__(self, **context):
        self.context = context
        self.old_factory = None
    
    def __enter__(self):
        self.old_factory = logging.getLogRecordFactory()
        
        def record_factory(*args, **kwargs):
            record = self.old_factory(*args, **kwargs)
            for key, value in self.context.items():
                setattr(record, key, value)
            return record
        
        logging.setLogRecordFactory(record_factory)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        logging.setLogRecordFactory(self.old_factory)

