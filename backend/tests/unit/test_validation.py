"""
Tests for input validation and sanitization.

Tests comprehensive validation rules for:
- String sanitization (XSS prevention)
- SQL injection prevention
- Email validation
- Phone number validation
- Age validation
- Password strength validation
"""
import pytest
from app.core.validation import (
    sanitize_string,
    validate_email,
    validate_phone,
    validate_age,
    validate_password_strength,
    validate_medical_registration,
    validate_enum,
    ValidationError
)


class TestStringSanitization:
    """Test string sanitization against XSS and SQL injection"""
    
    def test_sanitize_removes_script_tags(self):
        """Test that script tags are removed"""
        dirty = "<script>alert('xss')</script>Hello World"
        clean = sanitize_string(dirty)
        assert "<script>" not in clean
        assert "Hello World" in clean
    
    def test_sanitize_removes_html_tags(self):
        """Test that HTML tags are removed"""
        dirty = "<div><p>Test</p></div>"
        clean = sanitize_string(dirty)
        assert "<div>" not in clean
        assert "<p>" not in clean
        assert "Test" in clean
    
    def test_sanitize_removes_sql_injection_select(self):
        """Test SQL injection SELECT patterns are detected"""
        with pytest.raises(ValidationError) as exc:
            sanitize_string("Robert'; SELECT * FROM users;--")
        assert "Invalid input" in str(exc.value.detail)
    
    def test_sanitize_removes_sql_injection_drop(self):
        """Test SQL injection DROP patterns are detected"""
        with pytest.raises(ValidationError) as exc:
            sanitize_string("Robert'; DROP TABLE students;--")
        assert "Invalid input" in str(exc.value.detail)
    
    def test_sanitize_removes_sql_injection_union(self):
        """Test SQL injection UNION patterns are detected"""
        with pytest.raises(ValidationError) as exc:
            sanitize_string("' UNION SELECT password FROM users--")
        assert "Invalid input" in str(exc.value.detail)
    
    def test_sanitize_max_length_enforced(self):
        """Test maximum length enforcement"""
        long_string = "a" * 1000
        with pytest.raises(ValidationError) as exc:
            sanitize_string(long_string, max_length=500)
        assert "too long" in str(exc.value.detail).lower()
    
    def test_sanitize_trims_whitespace(self):
        """Test that whitespace is trimmed"""
        dirty = "  Hello World  "
        clean = sanitize_string(dirty)
        assert clean == "Hello World"
    
    def test_sanitize_allows_normal_text(self):
        """Test that normal text passes through"""
        normal = "This is normal text with numbers 123 and symbols!@#"
        clean = sanitize_string(normal)
        assert "normal text" in clean


class TestEmailValidation:
    """Test email validation"""
    
    def test_valid_email_simple(self):
        """Test simple valid email"""
        assert validate_email("user@example.com") == "user@example.com"
    
    def test_valid_email_with_subdomain(self):
        """Test email with subdomain"""
        assert validate_email("user@mail.example.com") == "user@mail.example.com"
    
    def test_valid_email_with_plus(self):
        """Test email with plus sign"""
        assert validate_email("user+tag@example.com") == "user+tag@example.com"
    
    def test_valid_email_with_dot(self):
        """Test email with dot in username"""
        assert validate_email("first.last@example.com") == "first.last@example.com"
    
    def test_email_converted_to_lowercase(self):
        """Test that email is converted to lowercase"""
        assert validate_email("USER@EXAMPLE.COM") == "user@example.com"
        assert validate_email("User@Example.Com") == "user@example.com"
    
    def test_invalid_email_no_at(self):
        """Test invalid email without @"""
        with pytest.raises(ValidationError) as exc:
            validate_email("notanemail")
        assert "Invalid email" in str(exc.value.detail)
    
    def test_invalid_email_no_domain(self):
        """Test invalid email without domain"""
        with pytest.raises(ValidationError) as exc:
            validate_email("user@")
        assert "Invalid email" in str(exc.value.detail)
    
    def test_invalid_email_no_username(self):
        """Test invalid email without username"""
        with pytest.raises(ValidationError) as exc:
            validate_email("@example.com")
        assert "Invalid email" in str(exc.value.detail)
    
    def test_invalid_email_no_tld(self):
        """Test invalid email without TLD"""
        with pytest.raises(ValidationError) as exc:
            validate_email("user@example")
        assert "Invalid email" in str(exc.value.detail)
    
    def test_email_too_long(self):
        """Test email exceeding max length"""
        long_email = "a" * 250 + "@example.com"
        with pytest.raises(ValidationError) as exc:
            validate_email(long_email)
        assert "too long" in str(exc.value.detail).lower()


class TestPhoneValidation:
    """Test phone number validation"""
    
    def test_valid_phone_10_digits(self):
        """Test valid 10-digit phone"""
        assert validate_phone("1234567890") == "1234567890"
    
    def test_valid_phone_with_country_code(self):
        """Test valid phone with + country code"""
        assert validate_phone("+911234567890") == "+911234567890"
    
    def test_valid_phone_15_digits(self):
        """Test valid 15-digit international phone"""
        result = validate_phone("+123456789012345")
        assert result == "+123456789012345"
    
    def test_phone_removes_spaces(self):
        """Test that spaces are removed"""
        assert validate_phone("123 456 7890") == "1234567890"
    
    def test_phone_removes_hyphens(self):
        """Test that hyphens are removed"""
        assert validate_phone("123-456-7890") == "1234567890"
    
    def test_phone_removes_parentheses(self):
        """Test that parentheses are removed"""
        assert validate_phone("(123) 456-7890") == "1234567890"
    
    def test_invalid_phone_too_short(self):
        """Test phone number too short"""
        with pytest.raises(ValidationError) as exc:
            validate_phone("123456789")
        assert "Invalid phone" in str(exc.value.detail)
    
    def test_invalid_phone_too_long(self):
        """Test phone number too long"""
        with pytest.raises(ValidationError) as exc:
            validate_phone("1234567890123456")
        assert "Invalid phone" in str(exc.value.detail)
    
    def test_invalid_phone_contains_letters(self):
        """Test phone with letters is rejected"""
        with pytest.raises(ValidationError) as exc:
            validate_phone("123abc7890")
        assert "Invalid phone" in str(exc.value.detail)


class TestAgeValidation:
    """Test age validation"""
    
    def test_valid_age_adult(self):
        """Test valid adult ages"""
        assert validate_age(18) == 18
        assert validate_age(25) == 25
        assert validate_age(50) == 50
        assert validate_age(100) == 100
    
    def test_valid_age_minimum(self):
        """Test minimum age (18)"""
        assert validate_age(18) == 18
    
    def test_valid_age_maximum(self):
        """Test maximum age (150)"""
        assert validate_age(150) == 150
    
    def test_invalid_age_too_young(self):
        """Test age below minimum (under 18)"""
        with pytest.raises(ValidationError) as exc:
            validate_age(17)
        assert "18 years old" in str(exc.value.detail)
    
    def test_invalid_age_child(self):
        """Test child age is rejected"""
        with pytest.raises(ValidationError) as exc:
            validate_age(10)
        assert "18 years old" in str(exc.value.detail)
    
    def test_invalid_age_negative(self):
        """Test negative age is rejected"""
        with pytest.raises(ValidationError) as exc:
            validate_age(-5)
        assert "0 and 150" in str(exc.value.detail)
    
    def test_invalid_age_too_old(self):
        """Test age above maximum"""
        with pytest.raises(ValidationError) as exc:
            validate_age(151)
        assert "0 and 150" in str(exc.value.detail)
    
    def test_invalid_age_unrealistic(self):
        """Test unrealistic age is rejected"""
        with pytest.raises(ValidationError) as exc:
            validate_age(200)
        assert "0 and 150" in str(exc.value.detail)


class TestPasswordValidation:
    """Test password strength validation"""
    
    def test_valid_password_strong(self):
        """Test strong passwords are accepted"""
        assert validate_password_strength("Password123!")
        assert validate_password_strength("MyP@ssw0rd")
        assert validate_password_strength("Str0ng!Pass")
    
    def test_invalid_password_too_short(self):
        """Test password too short (< 8 chars)"""
        with pytest.raises(ValidationError) as exc:
            validate_password_strength("Pass1!")
        assert "8 characters" in str(exc.value.detail)
    
    def test_invalid_password_no_uppercase(self):
        """Test password without uppercase letter"""
        with pytest.raises(ValidationError) as exc:
            validate_password_strength("password123!")
        assert "uppercase" in str(exc.value.detail).lower()
    
    def test_invalid_password_no_lowercase(self):
        """Test password without lowercase letter"""
        with pytest.raises(ValidationError) as exc:
            validate_password_strength("PASSWORD123!")
        assert "lowercase" in str(exc.value.detail).lower()
    
    def test_invalid_password_no_number(self):
        """Test password without number"""
        with pytest.raises(ValidationError) as exc:
            validate_password_strength("Password!")
        assert "number" in str(exc.value.detail).lower()
    
    def test_invalid_password_no_special_char(self):
        """Test password without special character"""
        with pytest.raises(ValidationError) as exc:
            validate_password_strength("Password123")
        assert "special character" in str(exc.value.detail).lower()
    
    def test_password_all_special_chars_accepted(self):
        """Test various special characters"""
        assert validate_password_strength("Pass123!word")
        assert validate_password_strength("Pass123@word")
        assert validate_password_strength("Pass123#word")
        assert validate_password_strength("Pass123$word")
        assert validate_password_strength("Pass123%word")


class TestMedicalRegistrationValidation:
    """Test medical registration number validation"""
    
    def test_valid_registration_alphanumeric(self):
        """Test valid alphanumeric registration"""
        assert validate_medical_registration("MH12345") == "MH12345"
        assert validate_medical_registration("KA/2020/12345") == "KA/2020/12345"
    
    def test_registration_converted_to_uppercase(self):
        """Test registration is converted to uppercase"""
        assert validate_medical_registration("mh12345") == "MH12345"
        assert validate_medical_registration("Ka/2020/12345") == "KA/2020/12345"
    
    def test_invalid_registration_too_short(self):
        """Test registration too short (< 5 chars)"""
        with pytest.raises(ValidationError) as exc:
            validate_medical_registration("MH12")
        assert "5-20" in str(exc.value.detail)
    
    def test_invalid_registration_too_long(self):
        """Test registration too long (> 20 chars)"""
        with pytest.raises(ValidationError) as exc:
            validate_medical_registration("MH" + "1" * 20)
        assert "5-20" in str(exc.value.detail)
    
    def test_invalid_registration_special_chars(self):
        """Test registration with invalid special characters"""
        with pytest.raises(ValidationError) as exc:
            validate_medical_registration("MH@12345")
        assert "Invalid registration" in str(exc.value.detail)


class TestEnumValidation:
    """Test enum value validation"""
    
    def test_valid_enum_value(self):
        """Test valid enum values"""
        assert validate_enum("Male", ["Male", "Female", "Other"], "sex") == "Male"
        assert validate_enum("Female", ["Male", "Female", "Other"], "sex") == "Female"
    
    def test_invalid_enum_value(self):
        """Test invalid enum value"""
        with pytest.raises(ValidationError) as exc:
            validate_enum("Unknown", ["Male", "Female", "Other"], "sex")
        assert "Invalid" in str(exc.value.detail)
        assert "Male, Female, Other" in str(exc.value.detail)


class TestValidationErrorFormat:
    """Test ValidationError response format"""
    
    def test_validation_error_structure(self):
        """Test that ValidationError has correct structure"""
        try:
            validate_age(10)
        except ValidationError as exc:
            assert exc.status_code == 422
            assert "status" in exc.detail
            assert "error" in exc.detail
            assert exc.detail["error"]["code"] == "VALIDATION_ERROR"
            assert "field" in exc.detail["error"]
            assert "details" in exc.detail["error"]
