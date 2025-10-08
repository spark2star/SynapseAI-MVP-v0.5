# 🚀 WebSocket STT Fix - Quick Action Guide

## ✅ STATUS: ALL FIXES VERIFIED

All three critical fixes have been applied and verified:
- ✅ JWT token expiry increased to 4 hours (240 minutes)
- ✅ Audit logger JSON serialization fixed
- ✅ Transcribe WebSocket router properly mounted

---

## 📋 IMMEDIATE ACTIONS REQUIRED

### Step 1: Restart Backend Server

If using Docker:
```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5
docker-compose restart backend
```

If running locally:
```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
pkill -f uvicorn
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8080
```

**Why?** Backend needs to reload configuration with new 4-hour token expiry.

---

### Step 2: Clear Browser Cache and Re-Login

1. **Open browser console** (F12)
2. **Clear all storage:**
   ```javascript
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```
3. **Navigate to login page** and login again
4. **Verify new token expiry:**
   ```javascript
   const token = localStorage.getItem('accessToken');
   const payload = JSON.parse(atob(token.split('.')[1]));
   console.log('Token valid for (hours):', (payload.exp - payload.iat) / 3600);
   // Should show: 4
   ```

**Expected Result:** `Token valid for (hours): 4`

**Why?** Old tokens have 30-minute expiry. You need a fresh token with 4-hour expiry.

---

### Step 3: Test Consultation with Transcription

1. **Go to Dashboard** → Click "Start Consultation"
2. **Select a patient** or create test patient
3. **Click "Start Session"**
4. **Open browser console** (F12) and watch for:

**✅ Success Messages:**
```
WebSocket connecting to: ws://localhost:8080/api/v1/ws/transcribe?token=...
WebSocket connection opened
Received: {"status": "connected", "message": "Transcription service ready"}
```

**❌ Failure Messages (should NOT see these):**
```
WebSocket closed with code: 1006
Error: Failed to connect to transcription service
```

5. **Click microphone** to start recording
6. **Speak in Hindi/English/Marathi**
7. **Verify transcription** appears in real-time

---

## 🔍 VERIFICATION CHECKLIST

- [ ] Backend server restarted
- [ ] User logged out completely
- [ ] User logged back in
- [ ] Browser console shows token valid for 4 hours
- [ ] WebSocket connects successfully
- [ ] Console shows "Transcription service ready"
- [ ] Real-time transcription works
- [ ] Backend logs show no 403/401 errors

---

## 📊 Monitor Backend Logs

In a separate terminal, monitor logs while testing:

```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
tail -f logs/app.log | grep -E "WebSocket|transcribe|403|401"
```

**✅ Good Logs:**
```
INFO - WebSocket connection request for session abc123
INFO - WebSocket authenticated for user def456
INFO - Vertex AI Speech client initialized successfully
INFO - Starting Vertex AI streaming recognition...
```

**❌ Bad Logs (should NOT see):**
```
ERROR - WebSocket authentication failed: Token expired
ERROR - Token verification failed: Signature has expired
HTTP 403 - /api/v1/ws/transcribe
```

---

## 🐛 TROUBLESHOOTING

### Problem: Still getting 403 errors

**Solution:**
```javascript
// Step 1: Completely clear browser storage
localStorage.clear();
sessionStorage.clear();
indexedDB.databases().then(dbs => dbs.forEach(db => indexedDB.deleteDatabase(db.name)));

// Step 2: Hard refresh
location.reload(true);

// Step 3: Login again
```

---

### Problem: Token still shows 0.5 hours (30 minutes)

**Cause:** Backend not restarted OR using old environment

**Solution:**
```bash
# Stop backend completely
docker-compose down
# OR
pkill -f uvicorn

# Verify config file
grep "JWT_ACCESS_TOKEN_EXPIRE_MINUTES" backend/app/core/config.py
# Should show: JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 240

# Start backend
docker-compose up -d backend
# OR
cd backend && python -m uvicorn app.main:app --reload
```

---

### Problem: WebSocket connects but no transcription

**Check Vertex AI credentials:**
```bash
ls -la backend/gcp-credentials.json
echo $GOOGLE_APPLICATION_CREDENTIALS
```

**Test Vertex AI:**
```bash
cd backend
python << EOF
from google.cloud import speech_v2 as speech
client = speech.SpeechClient()
print('✅ Vertex AI client initialized successfully')
EOF
```

---

## 📞 NEED HELP?

If issues persist:

1. **Run verification script:**
   ```bash
   ./test_websocket_stt_fix.sh
   ```

2. **Check detailed guide:**
   ```bash
   cat WEBSOCKET_STT_FIX_COMPLETE.md
   ```

3. **Collect debug info:**
   ```bash
   # Backend logs
   tail -100 backend/logs/app.log > debug_backend.log
   
   # Browser console logs
   # Copy from F12 console to debug_frontend.log
   ```

---

## 🎉 SUCCESS!

Once you see:
- ✅ Token valid for 4 hours
- ✅ WebSocket status: "connected"
- ✅ Real-time transcription working
- ✅ No 403/401 errors in logs

**YOU'RE DONE!** The WebSocket STT issue is fixed.

---

**Last Updated:** October 7, 2025  
**Status:** ✅ Ready for Testing
