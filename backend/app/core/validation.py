"""
Input validation and sanitization utilities.

Provides comprehensive validation for:
- String inputs (sanitization, length, format)
- Numeric inputs (range validation)
- Email and phone validation
- Medical registration numbers
- SQL injection prevention
- XSS prevention
"""
import re
from typing import Optional, List
from fastapi import HTTPException
import bleach
from pydantic import BaseModel, validator, Field


class ValidationError(HTTPException):
    """Custom validation error with user-friendly messages"""
    def __init__(self, field: str, message: str):
        super().__init__(
            status_code=422,
            detail={
                "status": "error",
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": f"Validation failed for {field}",
                    "field": field,
                    "details": message
                }
            }
        )


def sanitize_string(value: str, max_length: int = 500) -> str:
    """
    Sanitize string input to prevent XSS attacks.
    
    Args:
        value: Input string
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
        
    Raises:
        ValidationError: If validation fails
    """
    if not value:
        return value
    
    # Remove dangerous HTML/script tags
    sanitized = bleach.clean(
        value,
        tags=[],  # No tags allowed
        strip=True
    )
    
    # Trim whitespace
    sanitized = sanitized.strip()
    
    # Check length
    if len(sanitized) > max_length:
        raise ValidationError(
            "input",
            f"Input too long (max {max_length} characters)"
        )
    
    # Check for SQL injection patterns
    sql_patterns = [
        r"(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)",
        r"(--|;|\/\*|\*\/)",
        r"(\bOR\b.*=.*\bOR\b)",
        r"(\bAND\b.*=.*\bAND\b)"
    ]
    
    for pattern in sql_patterns:
        if re.search(pattern, sanitized, re.IGNORECASE):
            raise ValidationError(
                "input",
                "Invalid input detected. Please remove special characters."
            )
    
    return sanitized


def validate_email(email: str) -> str:
    """
    Validate email format.
    
    Args:
        email: Email address
        
    Returns:
        Validated email in lowercase
        
    Raises:
        ValidationError: If email is invalid
    """
    email = email.lower().strip()
    
    # RFC 5322 compliant email regex (simplified)
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        raise ValidationError(
            "email",
            "Invalid email format. Please use format: user@example.com"
        )
    
    if len(email) > 254:  # RFC 5321
        raise ValidationError(
            "email",
            "Email address too long (max 254 characters)"
        )
    
    return email


def validate_phone(phone: str) -> str:
    """
    Validate phone number format.
    
    Args:
        phone: Phone number
        
    Returns:
        Validated phone number
        
    Raises:
        ValidationError: If phone is invalid
    """
    # Remove common separators
    phone = re.sub(r'[\s\-()]+', '', phone)
    
    # Allow + for international numbers
    if not re.match(r'^\+?[0-9]{10,15}$', phone):
        raise ValidationError(
            "phone",
            "Invalid phone number. Use 10-15 digits, optionally starting with +"
        )
    
    return phone


def validate_medical_registration(
    registration_number: str,
    council: Optional[str] = None
) -> str:
    """
    Validate medical registration number format.
    
    Args:
        registration_number: Registration number
        council: Medical council name
        
    Returns:
        Validated registration number
        
    Raises:
        ValidationError: If registration number is invalid
    """
    registration_number = registration_number.strip().upper()
    
    # General format: Letters and numbers, 5-20 characters
    if not re.match(r'^[A-Z0-9\-/]{5,20}$', registration_number):
        raise ValidationError(
            "medical_registration_number",
            "Invalid registration number format. Should be 5-20 alphanumeric characters."
        )
    
    return registration_number


def validate_age(age: int) -> int:
    """
    Validate age is within reasonable range.
    
    Args:
        age: Age in years
        
    Returns:
        Validated age
        
    Raises:
        ValidationError: If age is invalid
    """
    if age < 0 or age > 150:
        raise ValidationError(
            "age",
            "Age must be between 0 and 150 years"
        )
    
    if age < 18:
        raise ValidationError(
            "age",
            "Patient must be at least 18 years old for psychiatric consultation"
        )
    
    return age


def validate_password_strength(password: str) -> str:
    """
    Validate password meets security requirements.
    
    Requirements:
    - At least 8 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one number
    - At least one special character
    
    Args:
        password: Password to validate
        
    Returns:
        Password if valid
        
    Raises:
        ValidationError: If password doesn't meet requirements
    """
    if len(password) < 8:
        raise ValidationError(
            "password",
            "Password must be at least 8 characters long"
        )
    
    if not re.search(r'[A-Z]', password):
        raise ValidationError(
            "password",
            "Password must contain at least one uppercase letter"
        )
    
    if not re.search(r'[a-z]', password):
        raise ValidationError(
            "password",
            "Password must contain at least one lowercase letter"
        )
    
    if not re.search(r'[0-9]', password):
        raise ValidationError(
            "password",
            "Password must contain at least one number"
        )
    
    if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
        raise ValidationError(
            "password",
            "Password must contain at least one special character (!@#$%^&*...)"
        )
    
    return password


def validate_enum(value: str, allowed_values: List[str], field_name: str) -> str:
    """
    Validate value is in allowed enum values.
    
    Args:
        value: Value to validate
        allowed_values: List of allowed values
        field_name: Name of field for error message
        
    Returns:
        Validated value
        
    Raises:
        ValidationError: If value not in allowed values
    """
    if value not in allowed_values:
        raise ValidationError(
            field_name,
            f"Invalid {field_name}. Allowed values: {', '.join(allowed_values)}"
        )
    
    return value
