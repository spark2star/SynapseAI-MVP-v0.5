import os
import base64
import json
from pathlib import Path

def setup_gcp_credentials():
    """Setup GCP credentials from environment variable"""
    creds_b64 = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_JSON')
    
    if creds_b64:
        # Decode base64
        creds_json = base64.b64decode(creds_b64).decode('utf-8')
        
        # Save to file
        creds_path = Path('/tmp/gcp-credentials.json')
        creds_path.write_text(creds_json)
        
        # Set environment variable
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = str(creds_path)
        print(f"✅ GCP credentials loaded from environment variable")
        return True
    
    # Check if file exists locally
    elif Path('gcp-credentials.json').exists():
        os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = 'gcp-credentials.json'
        print("✅ Using local gcp-credentials.json")
        return True
    
    print("⚠️ No GCP credentials found")
    return False
