import os
import re
import json
import time
import logging
from typing import Any, Dict

import google.generativeai as genai
from google.api_core.exceptions import ResourceExhausted, InvalidArgument

from utils.error_handlers import APIException, ParseException

logger = logging.getLogger(__name__)

_MODEL_NAME = "gemini-2.0-flash"
_MAX_TOKENS = 2048
_TEMPERATURE = 0.3
_TIMEOUT_SECONDS = 30


def initialize_gemini_model() -> Any:
    """Configure Gemini with API key and return a GenerativeModel instance.

    Raises:
        APIException: If GOOGLE_API_KEY is missing or invalid.
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise APIException("Server not configured. Please set GOOGLE_API_KEY.")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(
        model_name=_MODEL_NAME,
        generation_config={
            "temperature": _TEMPERATURE,
            "max_output_tokens": _MAX_TOKENS,
        },
        safety_settings={
            # Keep defaults; we are generating clinical summaries
        },
    )
    return model


def _strip_code_fences(text: str) -> str:
    # Remove triple backtick code fences and possible language hints
    return re.sub(r"```[a-zA-Z0-9_]*\n|```", "", text).strip()


def parse_gemini_response(response: Any) -> Dict[str, Any]:
    """Parse Gemini response into structured dict with strict validation.

    Raises:
        ParseException: If response cannot be parsed/validated.
    """
    try:
        raw_text = (getattr(response, "text", None) or "").strip()
        if not raw_text:
            raise ParseException("Empty AI response.")

        raw_text = _strip_code_fences(raw_text)
        data = json.loads(raw_text)

        required_fields = ["generated_report", "highlight_tags", "complaint_capture_score"]
        missing = [f for f in required_fields if f not in data]
        if missing:
            raise ParseException(f"Missing required fields: {missing}")

        return data
    except json.JSONDecodeError as e:
        logger.error("JSON parsing error: %s", str(e))
        logger.debug("Raw response: %s", raw_text[:500])
        raise ParseException("Failed to parse AI response. Please try again.")
    except ParseException:
        raise
    except Exception as e:
        logger.error("Response parsing error: %s", str(e))
        raise ParseException("Invalid AI response format.")


def call_gemini_api(model: Any, prompt: str, max_retries: int = 3) -> Dict[str, Any]:
    """Call Gemini API with exponential backoff and robust error handling."""
    last_exc: Exception | None = None
    for attempt in range(max_retries):
        try:
            # Google SDK doesn't expose per-call timeout directly; rely on short prompt and service limits
            response = model.generate_content(prompt)
            return parse_gemini_response(response)
        except ResourceExhausted:
            if attempt < max_retries - 1:
                time.sleep(2 ** attempt)
                continue
            last_exc = APIException("Service is temporarily busy. Please try again in a moment.")
            break
        except InvalidArgument:
            last_exc = APIException("Invalid input provided.")
            break
        except Exception:
            if attempt < max_retries - 1:
                time.sleep(1)
                continue
            last_exc = APIException("Failed to generate report. Please try again.")
            break
    assert last_exc is not None
    raise last_exc
