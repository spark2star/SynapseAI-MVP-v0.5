# Gemini API Fix Instructions

## Problem
The report generation is using a fallback template because the Gemini model is not accessible via Vertex AI.

**Error:** `404 Publisher Model not found`

## Root Cause
The Vertex AI Generative AI API is not enabled in your GCP project `synapse-product-1`.

## Solution Options

### Option 1: Enable Vertex AI API (Recommended for Production)

1. **Enable the API:**
   ```bash
   gcloud services enable aiplatform.googleapis.com --project=synapse-product-1
   ```

2. **Or enable via Console:**
   - Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
   - Select project: `synapse-product-1`
   - Click "Enable"

3. **Restart the backend:**
   ```bash
   # The backend will auto-reload and Gemini will work
   ```

### Option 2: Use Direct Gemini API (Alternative)

If you don't want to use Vertex AI, you can use the direct Gemini API with an API key:

1. **Get a Gemini API Key:**
   - Go to: https://makersuite.google.com/app/apikey
   - Create an API key

2. **Add to .env:**
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. **Update the code** (I can help with this if needed)

### Option 3: Use OpenAI GPT-4 (Alternative)

If Gemini doesn't work, we can switch to OpenAI:

1. **Get OpenAI API Key:**
   - Go to: https://platform.openai.com/api-keys

2. **Add to .env:**
   ```bash
   OPENAI_API_KEY=your_api_key_here
   ```

3. **Update the code** (I can help with this)

## Current Status

- ✅ GCP credentials are valid
- ✅ Service account: `synapseai-product-1@synapse-product-1.iam.gserviceaccount.com`
- ❌ Vertex AI API not enabled
- ⚠️ Using fallback template for reports

## Quick Test After Fix

```bash
python test_gemini_fix.py
```

Expected output:
```
🎉 SUCCESS! Gemini is generating real reports!
```

## What Happens Now

Until you enable the Vertex AI API or choose an alternative:
- Reports will use a basic template
- No AI-generated insights
- Lower confidence scores (0.65 instead of 0.85+)
- Basic keyword extraction only

## Recommendation

**Enable Vertex AI API** - it's the most integrated solution and works best with your existing GCP setup.

Command:
```bash
gcloud services enable aiplatform.googleapis.com --project=synapse-product-1
```

Then restart the backend and test again.
