# ✅ WebSocket STT 403 Forbidden Fix - COMPLETE

**Date:** October 7, 2025  
**Issue:** WebSocket STT failing with 403 Forbidden due to JWT token expiry (30 min → 4 hour consultations)  
**Status:** ✅ ALL FIXES APPLIED

---

## 🎯 PROBLEM SUMMARY

**Root Cause:** JWT access tokens expired after 30 minutes, but medical consultations can last 1-2+ hours. The WebSocket endpoint `/api/v1/ws/transcribe` validates tokens on connection, causing mid-consultation failures.

**Symptoms:**
- ❌ WebSocket closes with code `1006` (abnormal closure)
- ❌ Backend logs show `403 Forbidden` or `401 Unauthorized`
- ❌ Error: "Authentication failed: Token expired"
- ❌ Consultation transcription stops working after 30 minutes

---

## ✅ FIXES APPLIED

### 1. **Increased JWT Token Expiry (30 min → 4 hours)**
**File:** `backend/app/core/config.py` (Line 35)

```python
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 240  # 4 hours for long consultations
```

**Before:** 30 minutes  
**After:** 240 minutes (4 hours)  
**Impact:** Tokens now valid for entire consultation duration

---

### 2. **Fixed Audit Logger JSON Serialization**
**File:** `backend/app/core/audit.py` (Line 118)

```python
self.logger.info(json.dumps(audit_entry, default=str))
```

**Before:** `json.dumps(audit_entry)` - crashed on datetime objects  
**After:** `json.dumps(audit_entry, default=str)` - handles datetime safely  
**Impact:** Prevents audit logging crashes during WebSocket authentication

---

### 3. **Verified Transcribe Router is Mounted**
**File:** `backend/app/api/api_v1/api.py` (Lines 16, 36)

```python
from app.api.websocket import transcribe  # Line 16
api_router.include_router(transcribe.router, tags=["websocket"])  # Line 36
```

**Status:** ✅ Properly imported and mounted  
**Endpoint:** `ws://localhost:8080/api/v1/ws/transcribe`

---

## 🔍 TECHNICAL DETAILS

### WebSocket Authentication Flow

1. **Client connects:** `ws://localhost:8080/api/v1/ws/transcribe?token=JWT&session_id=ID`
2. **Server accepts:** `websocket.accept()` (Line 74 in `transcribe.py`)
3. **Token validation:** `get_current_user_from_websocket(websocket, token, db)` (Line 89)
   - Calls `jwt_manager.verify_token(token, token_type="access")` (Line 351 in `dependencies.py`)
   - Checks token expiry using `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` setting
   - If expired: Raises exception → WebSocket closes with code `1008`
4. **Success:** Returns authenticated `User` object

### Why This Caused 403 Errors

- WebSocket auth happens AFTER `accept()` is called
- Token expiry raises `HTTPException(401)` 
- Exception closes WebSocket with code `1008` (policy violation)
- Client sees this as `1006` (abnormal closure)
- Backend logs show `403 Forbidden` from audit middleware

---

## 🧪 TESTING PROCEDURE

### Prerequisites
1. ✅ Backend server restarted with new config
2. ✅ User logged out and logged back in (to get fresh 4-hour token)

### Test Steps

#### **Step 1: Verify Token Expiry in Browser Console**
```javascript
// Open browser console (F12)
const token = localStorage.getItem('accessToken');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token issued at:', new Date(payload.iat * 1000));
console.log('Token expires at:', new Date(payload.exp * 1000));
console.log('Current time:', new Date());
console.log('Valid for (hours):', (payload.exp - payload.iat) / 3600);
```

**Expected Output:**
```
Token issued at: Tue Oct 07 2025 14:30:00 GMT+0530
Token expires at: Tue Oct 07 2025 18:30:00 GMT+0530  ← 4 hours later
Current time: Tue Oct 07 2025 14:30:15 GMT+0530
Valid for (hours): 4  ← Should be 4, not 0.5
```

---

#### **Step 2: Start Consultation & Check WebSocket Connection**

1. **Navigate to:** Dashboard → Start Consultation
2. **Select patient** and click "Start Session"
3. **Open browser console** (F12)
4. **Check for WebSocket connection:**

**✅ Expected Success Logs:**
```javascript
WebSocket connecting to: ws://localhost:8080/api/v1/ws/transcribe?token=...&session_id=...
WebSocket connection opened
Received: {"status": "connected", "message": "Transcription service ready", "session_id": "..."}
```

**❌ Failure Logs (if still broken):**
```javascript
WebSocket connection opened
WebSocket closed with code: 1006 (Abnormal Closure)
Error: Failed to connect to transcription service
```

---

#### **Step 3: Check Backend Logs**

```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
tail -f logs/app.log | grep -E "WebSocket|transcribe|403|401"
```

**✅ Expected Success Logs:**
```
INFO - WebSocket connection request for session abc123
INFO - WebSocket authenticated for user def456
INFO - Vertex AI Speech client initialized successfully
INFO - Recognition configured: model=latest_long, language=hi-IN
INFO - Starting Vertex AI streaming recognition...
```

**❌ Failure Logs (if still broken):**
```
ERROR - WebSocket authentication failed: Token expired
ERROR - Token verification failed: Signature has expired
HTTP 401 - /api/v1/ws/transcribe
```

---

#### **Step 4: Verify Real-Time Transcription**

1. **Click microphone** to start recording
2. **Speak in Hindi/English/Marathi**
3. **Watch transcription appear** in real-time

**✅ Expected Behavior:**
- Transcription text appears immediately
- Text updates as you speak
- Final results saved to database
- No disconnections for 4+ hours

**❌ Failure Signs:**
- No transcription appears
- WebSocket disconnects after 30 minutes
- Error toast: "Transcription service unavailable"

---

## 🐛 TROUBLESHOOTING

### Issue 1: Still Getting 403 Errors

**Cause:** Old token still cached in browser

**Solution:**
```javascript
// Clear localStorage and login again
localStorage.clear();
sessionStorage.clear();
// Go to /login and login again
```

---

### Issue 2: Token Still Shows 30 Minutes Expiry

**Cause:** Backend server not restarted after config change

**Solution:**
```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
docker-compose restart backend
# OR if running locally:
pkill -f uvicorn && python -m uvicorn app.main:app --reload
```

---

### Issue 3: WebSocket Connects but No Transcription

**Cause:** Vertex AI credentials issue

**Solution:**
```bash
# Verify credentials file exists
ls -la /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend/gcp-credentials.json

# Check environment variable
echo $GOOGLE_APPLICATION_CREDENTIALS

# Test Vertex AI access
cd backend
python -c "from google.cloud import speech_v2 as speech; client = speech.SpeechClient(); print('✅ Vertex AI client initialized')"
```

**Expected:**
```
✅ Vertex AI client initialized
```

---

### Issue 4: Audit Logger Crashes

**Cause:** Datetime serialization error (should be fixed now)

**Check Fix:**
```bash
cd backend
grep "default=str" app/core/audit.py
```

**Expected Output:**
```python
self.logger.info(json.dumps(audit_entry, default=str))
```

---

## 📊 VERIFICATION CHECKLIST

Run through this checklist to confirm everything works:

- [ ] **Config verified:** JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 240
- [ ] **Audit fixed:** json.dumps has default=str parameter
- [ ] **Router mounted:** transcribe.router included in api.py
- [ ] **Backend restarted:** Fresh process with new config
- [ ] **User re-logged in:** New token issued with 4-hour expiry
- [ ] **Token expiry checked:** Browser console shows 4-hour validity
- [ ] **WebSocket connects:** Console shows "connected" message
- [ ] **Backend logs clean:** No 403/401 errors
- [ ] **Vertex AI initialized:** "Speech client initialized" log present
- [ ] **Transcription works:** Real-time text appears
- [ ] **Long session test:** Connection stays alive 1+ hour

---

## 🔐 SECURITY CONSIDERATIONS

### Why 4 Hours is Safe

1. **Medical Context:** Consultations typically last 15-60 minutes, but edge cases (surgery notes, detailed reviews) can go 2-3 hours
2. **Idle Timeout:** WebSocket has 5-minute idle timeout (line 191 in `transcribe.py`)
3. **Session Validation:** Each WebSocket message validates session is still active
4. **User Activity:** Inactive users won't keep connections open unnecessarily

### Production Recommendations

For production deployment, consider:

```python
# Development: 4 hours
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 240

# Production: 8 hours (full work day)
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

# With refresh token mechanism (recommended):
JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 60  # 1 hour
JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7     # Already configured
# Implement token refresh endpoint for automatic renewal
```

---

## 📝 FILES MODIFIED

| File | Line | Change | Status |
|------|------|--------|--------|
| `backend/app/core/config.py` | 35 | JWT_ACCESS_TOKEN_EXPIRE_MINUTES = 240 | ✅ Done |
| `backend/app/core/audit.py` | 118 | Added `default=str` to json.dumps | ✅ Done |
| `backend/app/api/api_v1/api.py` | 16, 36 | Imported and mounted transcribe.router | ✅ Verified |

---

## 🎉 SUCCESS CRITERIA

The fix is successful when:

1. ✅ **New tokens** have 4-hour expiry (check in browser console)
2. ✅ **WebSocket connects** without 403 errors
3. ✅ **Transcription works** in real-time (Hindi/English/Marathi)
4. ✅ **Backend logs** show successful authentication and Vertex AI init
5. ✅ **Long sessions** maintain connection for 1+ hours without disconnection
6. ✅ **No audit errors** in logs (datetime serialization works)

---

## 📞 SUPPORT

If issues persist after following this guide:

1. **Check backend logs:** `tail -f backend/logs/app.log`
2. **Check browser console:** Look for WebSocket errors
3. **Verify environment:** Ensure `.env` matches `env_template.txt`
4. **Test Vertex AI:** Run standalone test script to verify GCP credentials

---

## 🔄 NEXT STEPS

**Immediate Actions:**
1. Restart backend server
2. Logout and login to get fresh token
3. Test consultation with transcription
4. Monitor for any issues

**Production Readiness:**
1. Consider implementing token refresh mechanism
2. Add monitoring for WebSocket connection duration
3. Set up alerts for authentication failures
4. Document token expiry policy for users

---

**Status:** ✅ **FIX COMPLETE - READY FOR TESTING**

Last Updated: October 7, 2025
