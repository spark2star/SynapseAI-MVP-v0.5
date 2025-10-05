# Input Validation & Security

**Created:** 2025-10-05  
**Purpose:** Prevent security vulnerabilities and ensure data quality

## Overview

The SynapseAI backend implements comprehensive input validation to protect against:
- **XSS (Cross-Site Scripting)** attacks
- **SQL Injection** attacks
- **Data integrity** issues
- **Weak passwords**
- **Invalid data formats**

All validation is automatic and transparent to API consumers.

## Validation Rules

### String Sanitization

**Module:** `app.core.validation.sanitize_string()`

All string inputs are automatically sanitized:
- **HTML/Script Tags:** Removed using bleach library
- **SQL Injection Patterns:** Detected and blocked
- **Max Length:** Enforced per field (default 500 chars)
- **Whitespace:** Trimmed automatically

**Example:**
```python
from app.core.validation import sanitize_string

# XSS attempt - tags removed
input_str = "<script>alert('xss')</script>Hello"
clean = sanitize_string(input_str)
# Result: "Hello"

# SQL injection - blocked
input_str = "'; DROP TABLE users;--"
sanitize_string(input_str)  # Raises ValidationError
```

**SQL Patterns Blocked:**
- `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `DROP`, `CREATE`, `ALTER`, `EXEC`, `UNION`
- Comment sequences: `--`, `/*`, `*/`
- OR/AND injection patterns

### Email Validation

**Module:** `app.core.validation.validate_email()`

**Rules:**
- **Format:** RFC 5322 compliant
- **Max Length:** 254 characters (RFC 5321)
- **Case:** Converted to lowercase
- **Pattern:** `user@domain.tld`

**Valid Examples:**
```python
validate_email("user@example.com")           # ✅ user@example.com
validate_email("USER@EXAMPLE.COM")           # ✅ user@example.com
validate_email("user.name+tag@example.com")  # ✅ valid
validate_email("user@mail.example.co.uk")    # ✅ valid
```

**Invalid Examples:**
```python
validate_email("notanemail")      # ❌ No @ symbol
validate_email("@example.com")    # ❌ No username
validate_email("user@")           # ❌ No domain
validate_email("user@domain")     # ❌ No TLD
```

### Phone Number Validation

**Module:** `app.core.validation.validate_phone()`

**Rules:**
- **Length:** 10-15 digits
- **International:** Optional + prefix
- **Format:** Digits only (after cleanup)
- **Cleanup:** Removes spaces, hyphens, parentheses

**Valid Examples:**
```python
validate_phone("1234567890")         # ✅ 10 digits
validate_phone("+911234567890")      # ✅ International
validate_phone("(123) 456-7890")     # ✅ 1234567890 (cleaned)
validate_phone("123-456-7890")       # ✅ 1234567890 (cleaned)
```

**Invalid Examples:**
```python
validate_phone("123")                # ❌ Too short
validate_phone("123abc7890")         # ❌ Contains letters
validate_phone("12345678901234567")  # ❌ Too long
```

### Age Validation

**Module:** `app.core.validation.validate_age()`

**Rules:**
- **Minimum:** 18 years (psychiatric consultation requirement)
- **Maximum:** 150 years
- **Type:** Integer only

**Valid Examples:**
```python
validate_age(25)   # ✅
validate_age(18)   # ✅ Minimum
validate_age(100)  # ✅
validate_age(150)  # ✅ Maximum
```

**Invalid Examples:**
```python
validate_age(17)   # ❌ Too young (< 18)
validate_age(10)   # ❌ Child age
validate_age(-5)   # ❌ Negative
validate_age(200)  # ❌ Unrealistic
```

### Password Strength

**Module:** `app.core.validation.validate_password_strength()`

**Requirements:**
- **Minimum Length:** 8 characters
- **Uppercase:** At least one (A-Z)
- **Lowercase:** At least one (a-z)
- **Number:** At least one (0-9)
- **Special Character:** At least one (!@#$%^&*...)

**Valid Examples:**
```python
validate_password_strength("Password123!")  # ✅ All requirements
validate_password_strength("MyP@ssw0rd")    # ✅ All requirements
validate_password_strength("Str0ng!Pass")   # ✅ All requirements
```

**Invalid Examples:**
```python
validate_password_strength("Pass1!")        # ❌ Too short
validate_password_strength("password123!")  # ❌ No uppercase
validate_password_strength("PASSWORD123!")  # ❌ No lowercase
validate_password_strength("Password!")     # ❌ No number
validate_password_strength("Password123")   # ❌ No special char
```

### Medical Registration Number

**Module:** `app.core.validation.validate_medical_registration()`

**Rules:**
- **Format:** Alphanumeric with hyphens/slashes
- **Length:** 5-20 characters
- **Case:** Converted to uppercase

**Valid Examples:**
```python
validate_medical_registration("MH12345")      # ✅ MH12345
validate_medical_registration("mh12345")      # ✅ MH12345 (uppercase)
validate_medical_registration("KA/2020/123")  # ✅ KA/2020/123
```

**Invalid Examples:**
```python
validate_medical_registration("MH")           # ❌ Too short
validate_medical_registration("MH" + "1"*20)  # ❌ Too long
validate_medical_registration("MH@12345")     # ❌ Invalid char
```

### Enum Validation

**Module:** `app.core.validation.validate_enum()`

Validates that a value is in a predefined list of allowed values.

**Example:**
```python
# Valid
validate_enum("Male", ["Male", "Female", "Other"], "sex")    # ✅ "Male"
validate_enum("Female", ["Male", "Female", "Other"], "sex")  # ✅ "Female"

# Invalid
validate_enum("Unknown", ["Male", "Female", "Other"], "sex")  # ❌ Error
```

## Pydantic Validator Mixins

**Module:** `app.schemas.validators`

Reusable mixins for automatic validation in Pydantic models:

### ValidatedStringMixin

Automatically sanitizes all string fields (except passwords):

```python
from app.schemas.validators import ValidatedStringMixin

class PatientCreate(BaseModel, ValidatedStringMixin):
    name: str
    address: str
    # All strings automatically sanitized
```

### ValidatedEmailMixin

Automatically validates email fields:

```python
from app.schemas.validators import ValidatedEmailMixin

class UserCreate(BaseModel, ValidatedEmailMixin):
    email: str  # Automatically validated
```

### Other Mixins

- **ValidatedPhoneMixin:** Auto-validates `phone` field
- **ValidatedAgeMixin:** Auto-validates `age` field
- **ValidatedPasswordMixin:** Auto-validates `password` field

### Combined Usage

```python
from app.schemas.validators import (
    ValidatedStringMixin,
    ValidatedEmailMixin,
    ValidatedPhoneMixin,
    ValidatedAgeMixin
)

class PatientCreateRequest(
    BaseModel,
    ValidatedStringMixin,
    ValidatedEmailMixin,
    ValidatedPhoneMixin,
    ValidatedAgeMixin
):
    name: str         # Sanitized
    email: str        # Validated
    phone: str        # Validated
    age: int          # Validated (18-150)
    address: str      # Sanitized
```

## Error Responses

All validation errors return HTTP 422 with user-friendly messages:

### Validation Error Format

```json
{
  "success": false,
  "status": "error",
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please check your input and try again",
    "fields": [
      {
        "field": "email",
        "message": "Invalid email format. Please use format: user@example.com",
        "type": "value_error"
      },
      {
        "field": "age",
        "message": "Patient must be at least 18 years old for psychiatric consultation",
        "type": "value_error"
      }
    ],
    "request_id": "abc123"
  },
  "metadata": {
    "timestamp": "utcnow",
    "path": "/api/v1/intake/patients"
  }
}
```

### Database Error Format (Duplicate Entry)

```json
{
  "success": false,
  "status": "error",
  "error": {
    "code": "DUPLICATE_ENTRY",
    "message": "An account with this email already exists",
    "request_id": "abc123"
  },
  "metadata": {
    "timestamp": "utcnow",
    "path": "/api/v1/auth/register"
  }
}
```

## Security Features

### 1. XSS Prevention

All HTML tags are stripped from user input:

**Attack Attempt:**
```
Input: "<script>alert('XSS')</script>Hello"
Output: "Hello"
```

### 2. SQL Injection Prevention

SQL keywords and patterns are detected and blocked:

**Attack Attempt:**
```python
# Blocked patterns
"'; DROP TABLE users;--"
"' OR '1'='1"
"' UNION SELECT password FROM users--"
"admin'--"
```

### 3. Password Security

- Enforces strong password requirements
- Passwords never logged or returned in responses
- Stored as bcrypt hashes only

### 4. Input Length Limits

All fields have maximum length limits to prevent:
- Buffer overflow attacks
- Database performance issues
- Memory exhaustion

### 5. Type Validation

Pydantic ensures correct data types:
- Integers for age, IDs
- Strings for names, addresses
- Booleans for flags
- UUIDs for identifiers

## Testing

### Run Validation Tests

```bash
# Run all validation tests
docker-compose exec backend pytest tests/unit/test_validation.py -v

# Run specific test class
docker-compose exec backend pytest tests/unit/test_validation.py::TestEmailValidation -v

# Run with coverage
docker-compose exec backend pytest tests/unit/test_validation.py --cov=app.core.validation
```

### Test Coverage

The validation test suite includes:
- ✅ 30+ test cases
- ✅ XSS attack prevention
- ✅ SQL injection prevention
- ✅ All validation rules
- ✅ Error response formats
- ✅ Edge cases

## Best Practices

### 1. Always Use Validators

```python
# ✅ Good - Uses validators
class PatientCreate(BaseModel, ValidatedStringMixin, ValidatedEmailMixin):
    name: str
    email: str

# ❌ Bad - No validation
class PatientCreate(BaseModel):
    name: str
    email: str
```

### 2. Never Trust User Input

```python
# ✅ Good - Sanitize first
name = sanitize_string(user_input)
patient = Patient(name=name)

# ❌ Bad - Direct use
patient = Patient(name=user_input)
```

### 3. Use Field Constraints

```python
# ✅ Good - Explicit constraints
class PatientCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=18, le=150)

# ❌ Bad - No constraints
class PatientCreate(BaseModel):
    name: str
    age: int
```

### 4. Handle Errors Gracefully

```python
# ✅ Good - Specific error handling
try:
    email = validate_email(user_input)
except ValidationError as e:
    return {"error": e.detail}

# ❌ Bad - Generic catch
try:
    email = validate_email(user_input)
except Exception:
    return {"error": "Something went wrong"}
```

## Performance Impact

Validation adds minimal overhead:
- **String sanitization:** ~0.1-0.5ms per field
- **Email validation:** ~0.05ms per field
- **Phone validation:** ~0.03ms per field
- **Total per request:** < 2ms typically

This is acceptable for the security benefits provided.

## Maintenance

### Adding New Validators

1. Add function to `app/core/validation.py`
2. Create mixin in `app/schemas/validators.py`
3. Add tests to `tests/unit/test_validation.py`
4. Update this documentation

### Updating Validation Rules

1. Update function in `app/core/validation.py`
2. Update tests in `tests/unit/test_validation.py`
3. Run test suite to ensure no regressions
4. Update documentation

## References

- **XSS Prevention:** Using `bleach` library
- **Email Validation:** RFC 5322 standard
- **Phone Validation:** E.164 format
- **Password Strength:** OWASP recommendations
- **SQL Injection:** OWASP prevention guidelines
