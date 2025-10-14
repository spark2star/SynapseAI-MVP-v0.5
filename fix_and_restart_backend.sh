#!/bin/bash

echo "================================================================================================"
echo "🚨 EMERGENCY STT FIX - Backend Restart Script"
echo "================================================================================================"
echo ""

cd "$(dirname "$0")/backend" || exit 1

echo "📍 Current directory: $(pwd)"
echo ""

# Step 1: Run diagnostics
echo "🔍 [Step 1/5] Running diagnostics..."
echo "================================================================================================"
python3 diagnose_stt.py
DIAG_RESULT=$?

if [ $DIAG_RESULT -eq 1 ]; then
    echo ""
    echo "❌ Diagnostics failed! Fix the errors above before proceeding."
    exit 1
elif [ $DIAG_RESULT -eq 0 ]; then
    echo ""
    echo "⚠️  Diagnostics completed with warnings - continuing anyway..."
fi

echo ""
echo "✅ [Step 1/5] Diagnostics complete"
echo ""

# Step 2: Check/install dependencies
echo "📦 [Step 2/5] Checking Python dependencies..."
echo "================================================================================================"

# Check if requirements.txt exists
if [ -f "../requirements.txt" ]; then
    echo "Installing/updating dependencies from requirements.txt..."
    pip install -q google-cloud-speech pydub numpy python-multipart webrtcvad
    echo "✅ Dependencies installed"
else
    echo "⚠️  No requirements.txt found, skipping dependency install"
fi

echo ""

# Step 3: Check ffmpeg
echo "🔧 [Step 3/5] Checking ffmpeg..."
echo "================================================================================================"

if command -v ffmpeg &> /dev/null; then
    echo "✅ ffmpeg is installed: $(which ffmpeg)"
else
    echo "❌ ffmpeg is NOT installed"
    echo ""
    echo "To install ffmpeg:"
    echo "  Mac:   brew install ffmpeg"
    echo "  Linux: sudo apt-get install ffmpeg"
    echo ""
    echo "Press Enter to continue anyway, or Ctrl+C to exit and install ffmpeg first"
    read -r
fi

echo ""

# Step 4: Clear Python cache
echo "🧹 [Step 4/5] Clearing Python cache..."
echo "================================================================================================"

find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -name "*.pyc" -delete 2>/dev/null || true

echo "✅ Cache cleared"
echo ""

# Step 5: Start backend
echo "🚀 [Step 5/5] Starting backend server..."
echo "================================================================================================"
echo ""
echo "Starting uvicorn on port 8080..."
echo "Watch for:"
echo "  ✅ 'Application startup complete'"
echo "  ✅ 'Google Speech client initialized'"  
echo "  ❌ Any error messages"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "================================================================================================"
echo ""

# Start backend with proper environment
export PYTHONUNBUFFERED=1

# Check if .env file exists
if [ -f ".env" ]; then
    echo "✅ Loading environment from .env file"
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "⚠️  No .env file found - using system environment variables"
fi

# Start uvicorn
uvicorn app.main:app --reload --host 0.0.0.0 --port 8080 --log-level info

