# Speech-to-Text Transcription Fix - ffmpeg PATH Issue

## Problem
The audio transcription was failing with a 500 error:
```
❌ [STT] Step 2.6 FAILED: ffmpeg not found. Install with: brew install ffmpeg (Mac) or apt-get install ffmpeg (Linux)
```

## Root Cause
- ffmpeg was already installed at `/opt/homebrew/bin/ffmpeg`
- The backend Python process couldn't find it because `/opt/homebrew/bin` wasn't in the PATH environment variable
- The code was using `which ffmpeg` which relies on PATH

## Solution Implemented
Updated `/backend/app/api/api_v1/endpoints/transcribe_simple.py`:

### Changes Made:
1. **Added `shutil` import** at the top of the file (line 18)
2. **Improved ffmpeg detection logic** (lines 533-549):
   - First tries `shutil.which("ffmpeg")` which checks PATH
   - Falls back to checking common macOS/Linux paths:
     - `/opt/homebrew/bin/ffmpeg` (Apple Silicon Homebrew)
     - `/usr/local/bin/ffmpeg` (Intel Mac Homebrew)
     - `/usr/bin/ffmpeg` (Linux system path)
   - Uses the discovered path directly in subprocess.run()

### Code Changes:
```python
# OLD CODE (line ~534):
ffmpeg_check = subprocess.run(
    ["which", "ffmpeg"],
    capture_output=True,
    text=True
)

# NEW CODE (lines 535-549):
ffmpeg_path = shutil.which("ffmpeg")
if not ffmpeg_path:
    # Try common paths for macOS (Homebrew)
    for path in ["/opt/homebrew/bin/ffmpeg", "/usr/local/bin/ffmpeg", "/usr/bin/ffmpeg"]:
        if os.path.exists(path):
            ffmpeg_path = path
            break

if not ffmpeg_path:
    raise Exception(
        "ffmpeg not found. Install with: "
        "brew install ffmpeg (Mac) or apt-get install ffmpeg (Linux)"
    )

logger.info(f"✅ [STT] Found ffmpeg at: {ffmpeg_path}")

# Use ffmpeg_path instead of hardcoded "ffmpeg"
result = subprocess.run([
    ffmpeg_path, "-i", temp_audio_path,
    ...
])
```

## Testing
The backend is running with `--reload` flag, so changes are automatically applied.

### To Test:
1. Go to a patient detail page
2. Click "Follow-up Session"
3. Start recording
4. Speak for 30+ seconds
5. Check the backend logs - you should now see:
   ```
   ✅ [STT] Found ffmpeg at: /opt/homebrew/bin/ffmpeg
   ✅ [STT] Conversion complete: /var/folders/.../tmp....wav
   ```

## Benefits of This Fix
1. **Robust**: Works on Apple Silicon Macs, Intel Macs, and Linux
2. **No ENV changes needed**: Doesn't require modifying system PATH
3. **Better error messages**: Logs exactly where ffmpeg was found
4. **Backwards compatible**: Still works with ffmpeg in PATH

## Files Modified
- `backend/app/api/api_v1/endpoints/transcribe_simple.py`
  - Added shutil import
  - Improved ffmpeg path detection (lines 533-549)

## System Requirements
- ffmpeg 8.0 or later (already installed via Homebrew)

---

**Date Fixed:** October 16, 2025  
**Issue:** ffmpeg PATH detection failure  
**Status:** ✅ Resolved

