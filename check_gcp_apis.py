#!/usr/bin/env python3
"""Check GCP API access and available models"""

import sys
from google.oauth2 import service_account
import google.auth.transport.requests

# Load credentials
credentials = service_account.Credentials.from_service_account_file(
    'gcp-credentials.json',
    scopes=['https://www.googleapis.com/auth/cloud-platform']
)

print(f"✅ Credentials loaded for project: {credentials.project_id}")
print(f"📧 Service account: {credentials.service_account_email}")

# Try to refresh credentials to check if they're valid
try:
    request = google.auth.transport.requests.Request()
    credentials.refresh(request)
    print("✅ Credentials are valid and can be refreshed")
except Exception as e:
    print(f"❌ Credential refresh failed: {e}")
    sys.exit(1)

print("\n📋 To use Vertex AI Generative AI, you need to:")
print("1. Enable Vertex AI API in your GCP project")
print("2. Go to: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com")
print("3. Click 'Enable' for your project: synapse-product-1")
print("\n4. Or run: gcloud services enable aiplatform.googleapis.com --project=synapse-product-1")
