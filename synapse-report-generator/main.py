import logging
import os
from typing import Any

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from pydantic import ValidationError
from starlette.middleware.cors import CORSMiddleware

from models.schemas import TranscriptRequest, AnalysisResponse
from services.prompt_builder import build_medical_report_prompt
from services.gemini_service import initialize_gemini_model, call_gemini_api
from utils.error_handlers import APIException, ParseException, ValidationException

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, LOG_LEVEL, logging.INFO))
logger = logging.getLogger("synapse-report-generator")

app = FastAPI(title="SynapseAI Medical Report Generator", version="1.0.0")

# Static and templates
app.mount("/static", StaticFiles(directory="synapse-report-generator/static"), name="static")
_templates = Jinja2Templates(directory="synapse-report-generator/templates")

# CORS for development (WARNING: tighten in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # WARNING: restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.error("HTTP error %s: %s on %s", exc.status_code, exc.detail, request.url.path)
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": exc.detail or "Request failed.",
            "error_code": "HTTP_ERROR"
        }
    )


@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.error("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "error": "Invalid input.",
            "error_code": "VALIDATION_ERROR"
        }
    )


@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    logger.error("APIException on %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=502,
        content={
            "success": False,
            "error": str(exc),
            "error_code": "API_ERROR"
        }
    )


@app.exception_handler(ParseException)
async def parse_exception_handler(request: Request, exc: ParseException):
    logger.error("ParseException on %s: %s", request.url.path, str(exc))
    return JSONResponse(
        status_code=502,
        content={
            "success": False,
            "error": str(exc),
            "error_code": "PARSE_ERROR"
        }
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unexpected error: %s", str(exc), exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": "An unexpected error occurred. Please try again.",
            "error_code": "INTERNAL_ERROR"
        }
    )


@app.get("/", response_class=HTMLResponse)
async def home(request: Request):
    return _templates.TemplateResponse("index.html", {"request": request})


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "healthy"}


@app.post("/generate_and_analyze", response_model=AnalysisResponse)
async def generate_and_analyze(payload: TranscriptRequest) -> Any:
    """Generate a medical report & analysis from a Hindi transcript.

    This endpoint validates input, builds the prompt, calls Gemini with retries,
    and returns a structured JSON response. Target end-to-end timeout ~60s.
    """
    # Validate & build prompt
    prompt = build_medical_report_prompt(payload.transcript, payload.medications)

    # Initialize model once per request (simple & robust); can be cached if needed
    model = initialize_gemini_model()

    # Call Gemini with backoff
    ai_result = call_gemini_api(model, prompt)

    # Map to response
    return AnalysisResponse(
        success=True,
        generated_report=ai_result.get("generated_report"),
        highlight_tags=ai_result.get("highlight_tags", []),
        complaint_capture_score=ai_result.get("complaint_capture_score"),
    )
