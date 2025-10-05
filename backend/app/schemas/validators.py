"""
Pydantic validators for request schemas.

Applies validation to all request schemas automatically.
These mixins can be added to any Pydantic model to enable
automatic validation of common fields.
"""
from pydantic import validator
from app.core.validation import (
    sanitize_string,
    validate_email,
    validate_phone,
    validate_age,
    validate_password_strength,
    validate_medical_registration,
    validate_enum
)


class ValidatedStringMixin:
    """Mixin to add string validation to schemas"""
    
    @validator('*', pre=True)
    def validate_strings(cls, v, field):
        """Automatically sanitize all string fields except passwords"""
        if isinstance(v, str) and field.name not in ['password', 'password_hash', 'hashed_password']:
            # Only sanitize if it's a reasonable length (not massive text fields)
            if len(v) < 10000:
                return sanitize_string(v, max_length=min(10000, len(v) + 500))
        return v


class ValidatedEmailMixin:
    """Mixin to add email validation"""
    
    @validator('email')
    def validate_email_field(cls, v):
        if v:
            return validate_email(v)
        return v


class ValidatedPhoneMixin:
    """Mixin to add phone validation"""
    
    @validator('phone')
    def validate_phone_field(cls, v):
        if v:
            return validate_phone(v)
        return v


class ValidatedAgeMixin:
    """Mixin to add age validation"""
    
    @validator('age')
    def validate_age_field(cls, v):
        if v is not None:
            return validate_age(v)
        return v


class ValidatedPasswordMixin:
    """Mixin to add password strength validation"""
    
    @validator('password')
    def validate_password_field(cls, v):
        if v:
            return validate_password_strength(v)
        return v
