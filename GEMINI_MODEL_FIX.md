# Gemini Model Fix - Report Generation Issue

## Problem
Reports were falling back to template generation instead of using Gemini AI.

## Root Cause
The `gemini_service.py` was hardcoded to use:
- Location: `us-central1`
- Model: `gemini-1.5-flash` (without version)

But your GCP project doesn't have access to these models in that region.

## Solution Applied
Updated `backend/app/services/gemini_service.py` to read from environment variables:

```python
self.project = os.getenv("GCP_PROJECT_ID", "synapse-product-1")
self.location = os.getenv("VERTEX_AI_LOCATION", "us-central1")
self.model_name = os.getenv("GEMINI_MODEL", "gemini-2.0-flash-exp")
```

## Your Configuration (from backend/.env)
- `VERTEX_AI_LOCATION=global`
- `GEMINI_MODEL=gemini-2.5-flash`
- `GCP_PROJECT_ID=synapse-product-1`

## Next Steps

### 1. Restart Backend Server
The changes won't take effect until you restart:

```bash
# Stop current backend
# Then restart it
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

### 2. Test Report Generation
1. Create a new consultation session
2. Generate a report
3. Check the logs for:
   - ✅ "Gemini API call successful"
   - ✅ Model used: `gemini-2.5-flash`
   - ❌ No "fallback template" messages

### 3. Verify in Logs
```bash
tail -f backend.log | grep -i "gemini\|model\|fallback"
```

You should see:
- Model initialization with `gemini-2.5-flash`
- Location: `global`
- Successful API calls

## Alternative: If Model Still Not Available

If `gemini-2.5-flash` is not available in the `global` location, try these alternatives in `backend/.env`:

### Option 1: Use asia-south1 (India region)
```env
VERTEX_AI_LOCATION=asia-south1
GEMINI_MODEL=gemini-1.5-flash
```

### Option 2: Use us-central1 with stable model
```env
VERTEX_AI_LOCATION=us-central1
GEMINI_MODEL=gemini-1.5-pro
```

### Option 3: Check available models
Run this to see what models are available in your project:

```bash
gcloud ai models list --region=global --project=synapse-product-1
gcloud ai models list --region=us-central1 --project=synapse-product-1
gcloud ai models list --region=asia-south1 --project=synapse-product-1
```

## Files Modified
- `backend/app/services/gemini_service.py` - Now reads from environment variables

## Status
✅ Code fixed - awaiting backend restart to test
