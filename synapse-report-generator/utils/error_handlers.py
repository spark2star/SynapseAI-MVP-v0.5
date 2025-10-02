class APIException(Exception):
    """Raised when Gemini API call fails."""
    pass


class ParseException(Exception):
    """Raised when API response cannot be parsed."""
    pass


class ValidationException(Exception):
    """Raised when input validation fails."""
    pass
