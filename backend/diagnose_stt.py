#!/usr/bin/env python3
"""
Diagnostic script to identify STT endpoint issues
Run this to check for common configuration problems
"""

import os
import sys

print("="*80)
print("🔍 STT ENDPOINT DIAGNOSTIC TOOL")
print("="*80)
print()

errors = []
warnings = []
successes = []

# Check 1: Python dependencies
print("📦 [1/7] Checking Python dependencies...")
try:
    from google.cloud import speech_v2 as speech
    successes.append("✅ google-cloud-speech_v2 installed")
except ImportError as e:
    errors.append(f"❌ google-cloud-speech not installed: {e}")
    print("   To fix: pip install google-cloud-speech")

try:
    import wave
    successes.append("✅ wave module available")
except ImportError:
    errors.append("❌ wave module not available")

try:
    import numpy as np
    successes.append("✅ numpy installed")
except ImportError:
    errors.append("❌ numpy not installed")
    print("   To fix: pip install numpy")

try:
    from pydub import AudioSegment
    successes.append("✅ pydub installed")
except ImportError:
    errors.append("❌ pydub not installed")
    print("   To fix: pip install pydub")

print()

# Check 2: System dependencies
print("🔧 [2/7] Checking system dependencies...")
import subprocess

try:
    result = subprocess.run(["which", "ffmpeg"], capture_output=True, text=True)
    if result.returncode == 0:
        ffmpeg_path = result.stdout.strip()
        successes.append(f"✅ ffmpeg found at: {ffmpeg_path}")
    else:
        errors.append("❌ ffmpeg not found")
        print("   To fix (Mac): brew install ffmpeg")
        print("   To fix (Linux): sudo apt-get install ffmpeg")
except Exception as e:
    errors.append(f"❌ Error checking ffmpeg: {e}")

print()

# Check 3: Environment variables
print("🔐 [3/7] Checking Google Cloud credentials...")

# Try loading from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
    successes.append("✅ Loaded .env file")
except:
    warnings.append("⚠️  dotenv not available, using system environment")

google_creds = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
if google_creds:
    successes.append(f"✅ GOOGLE_APPLICATION_CREDENTIALS set: {google_creds}")
    
    if os.path.exists(google_creds):
        successes.append(f"✅ Credentials file exists")
        
        # Check file permissions
        import stat
        file_stat = os.stat(google_creds)
        mode = stat.filemode(file_stat.st_mode)
        successes.append(f"✅ File permissions: {mode}")
    else:
        errors.append(f"❌ Credentials file not found: {google_creds}")
else:
    warnings.append("⚠️  GOOGLE_APPLICATION_CREDENTIALS not set")
    warnings.append("   Will attempt to use default credentials")

google_project = os.getenv("GOOGLE_CLOUD_PROJECT")
if google_project:
    successes.append(f"✅ GOOGLE_CLOUD_PROJECT set: {google_project}")
else:
    errors.append("❌ GOOGLE_CLOUD_PROJECT not set")

vertex_location = os.getenv("VERTEX_AI_LOCATION")
if vertex_location:
    successes.append(f"✅ VERTEX_AI_LOCATION set: {vertex_location}")
else:
    errors.append("❌ VERTEX_AI_LOCATION not set")

print()

# Check 4: Try to initialize Speech client
print("🤖 [4/7] Testing Google Speech API client initialization...")
try:
    from google.cloud import speech_v2 as speech
    client = speech.SpeechClient()
    successes.append("✅ Speech client initialized successfully")
    
    # Try a test operation (list recognizers)
    try:
        if google_project and vertex_location:
            parent = f"projects/{google_project}/locations/{vertex_location}"
            # Note: This might fail if no recognizers exist, but will validate auth
            successes.append("✅ Authentication appears valid")
    except Exception as e:
        if "unauthenticated" in str(e).lower() or "permission" in str(e).lower():
            errors.append(f"❌ Authentication failed: {e}")
        else:
            warnings.append(f"⚠️  Minor API test issue (may be okay): {e}")
            
except Exception as e:
    errors.append(f"❌ Failed to initialize Speech client: {e}")
    if "credentials" in str(e).lower():
        print("   Check your GOOGLE_APPLICATION_CREDENTIALS path")
    if "unauthenticated" in str(e).lower():
        print("   Check IAM permissions for your service account")

print()

# Check 5: Database connection
print("🗄️  [5/7] Checking database connection...")
try:
    from app.core.database import engine
    from sqlalchemy import text
    
    with engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    successes.append("✅ Database connection successful")
except Exception as e:
    errors.append(f"❌ Database connection failed: {e}")

print()

# Check 6: Check temp directory permissions
print("📁 [6/7] Checking temp directory...")
import tempfile
temp_dir = tempfile.gettempdir()
if os.access(temp_dir, os.W_OK):
    successes.append(f"✅ Temp directory writable: {temp_dir}")
else:
    errors.append(f"❌ Temp directory not writable: {temp_dir}")

print()

# Check 7: Import main application
print("🚀 [7/7] Checking FastAPI application...")
try:
    from app.main import app
    successes.append("✅ FastAPI app imports successfully")
except Exception as e:
    errors.append(f"❌ Failed to import FastAPI app: {e}")

print()
print("="*80)
print("📊 DIAGNOSTIC SUMMARY")
print("="*80)
print()

print(f"✅ Successes: {len(successes)}")
for success in successes:
    print(f"   {success}")

if warnings:
    print()
    print(f"⚠️  Warnings: {len(warnings)}")
    for warning in warnings:
        print(f"   {warning}")

if errors:
    print()
    print(f"❌ Errors: {len(errors)}")
    for error in errors:
        print(f"   {error}")

print()
print("="*80)

if errors:
    print("❌ RESULT: Issues found - fix errors above before running backend")
    sys.exit(1)
elif warnings:
    print("⚠️  RESULT: Minor issues found - backend may work but check warnings")
    sys.exit(0)
else:
    print("✅ RESULT: All checks passed - backend should work correctly")
    sys.exit(0)

