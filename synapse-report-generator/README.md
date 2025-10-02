# SynapseAI - Medical Report Generator

Production-ready web app for doctors in India to convert Hindi transcripts into structured English medical reports using Google Gemini. Prioritizes reliability, simplicity, and clear feedback.

## Tech Stack
- Backend: FastAPI, Uvicorn
- AI: google-generativeai
- Frontend: HTML, CSS, JS (Bootstrap)
- Config: python-dotenv

## Setup
1. cd synapse-report-generator
2. python -m venv .venv && source .venv/bin/activate  # Windows: .venv\\Scripts\\activate
3. pip install -r requirements.txt
4. Create .env with GOOGLE_API_KEY=...
5. uvicorn main:app --reload

## Endpoints
- GET / -> index.html
- GET /health -> {"status":"healthy"}
- POST /generate_and_analyze -> generate report and score

## Notes
- Do not expose API keys in frontend.
- Global exception handlers prevent leaking internals.
- Timeout: 60s per request; retries for transient errors.
