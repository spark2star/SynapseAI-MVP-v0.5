# WebSocket Connection Fix

## 🔴 **Issue: HTTP 403 Forbidden**

**Error:** `WebSocket /ws/transcribe 403`  
**Cause:** Invalid or expired authentication token

---

## 🔧 **Root Cause**

The token `demo-jwt-token-12345` is a placeholder/invalid JWT token. The WebSocket endpoint requires a **valid JWT token** from an actual login session.

**Backend logs show:**
```
INFO: ('127.0.0.1', 53901) - "WebSocket /ws/transcribe?token=demo-jwt-token-12345&session_id=CS-2024-NEW" 403
```

This means:
1. ✅ WebSocket endpoint exists and is working
2. ✅ Frontend can reach the endpoint  
3. ❌ **Authentication is failing** (invalid token)

---

## ✅ **Solution: Re-Login**

### **Quick Fix Steps:**

1. **Log Out:**
   - Go to dashboard
   - Click user menu → Logout
   - Or clear localStorage manually:
     ```javascript
     localStorage.clear()
     ```

2. **Log In Again:**
   ```
   Email: doctor@demo.com
   Password: password123
   ```

3. **Verify Token:**
   - Open browser DevTools → Console
   - Type: `localStorage.getItem('access_token')`
   - Should show a long JWT string (100+ characters)
   - Should have dots (.) separating parts

4. **Test WebSocket:**
   - Start new consultation
   - Click "Start Session"
   - Check console for:
     ```
     [VertexAI] Token length: 250 chars
     [VertexAI] Connecting to WebSocket...
     [VertexAI] WebSocket connected
     ```

---

## 🔍 **Improved Error Handling**

**Added in latest commit (`fa2a353`):**

### **1. Token Validation**
```typescript
// Check if token exists
if (!token) {
    toast.error('Please log in again - authentication token not found')
    console.error('[VertexAI] Available keys:', Object.keys(localStorage))
    return
}

// Check if token is valid format
if (token.length < 20 || !token.includes('.')) {
    toast.error('Invalid authentication token - please log in again')
    console.error('[VertexAI] Token appears invalid:', token.substring(0, 20))
    return
}
```

### **2. Better Error Messages**
- User-friendly toast notifications
- Detailed console logs for debugging
- Automatic stop if token invalid

### **3. Debugging Info**
- Logs all localStorage keys
- Shows token length  
- Clear indication of what's wrong

---

## 🧪 **Testing After Re-Login**

1. **Clear browser cache** (Cmd+Shift+R on Mac)

2. **Open Console** and look for:
   ```
   ✅ [VertexAI] Token length: 250 chars
   ✅ [VertexAI] Connecting to WebSocket...
   ✅ [VertexAI] WebSocket connected
   ✅ Status shows "🟢 Connected"
   ```

3. **If you see:**
   ```
   ❌ [VertexAI] No access token found
   ❌ [VertexAI] Token appears invalid
   ❌ WebSocket connection failed
   ```
   → **Log out and log in again**

---

## 🎯 **Expected Behavior After Fix**

### **Correct Flow:**

1. **Login** → JWT token saved to `localStorage.access_token`

2. **Start Consultation** → Component reads token:
   ```javascript
   const token = localStorage.getItem('access_token')
   // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM..."
   ```

3. **WebSocket Connect:**
   ```
   ws://localhost:8000/ws/transcribe?token=eyJhbGc...&session_id=CS-123
   ```

4. **Backend Validates:**
   - Decodes JWT
   - Verifies signature
   - Checks expiration
   - Loads user from database
   - ✅ Accepts connection

5. **Status:**
   ```
   🟢 Connected
   Audio Level: [====    ] 45%
   Language: 🇮🇳 Hindi
   ```

---

## 📋 **Checklist**

- [ ] Log out completely
- [ ] Log in with: doctor@demo.com / password123
- [ ] Verify token in console: `localStorage.getItem('access_token')`
- [ ] Token should be 100+ characters
- [ ] Token should contain dots (.)
- [ ] Clear browser cache (Cmd+Shift+R)
- [ ] Start new consultation
- [ ] Check console for successful connection
- [ ] Status should show "🟢 Connected"
- [ ] Try speaking - transcription should appear

---

## 🐛 **If Still Failing**

### **Check 1: Token in localStorage**
```javascript
// In browser console:
console.log('Token:', localStorage.getItem('access_token'))
console.log('All keys:', Object.keys(localStorage))
```

**Expected:**
```
Token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
All keys: ["access_token", "refresh_token", "auth-storage"]
```

### **Check 2: Backend Logs**
```bash
tail -f backend.log | grep WebSocket
```

**Should see:**
```
INFO: WebSocket connection request for session CS-123
INFO: WebSocket authenticated for user 1, session CS-123
```

**If you see:**
```
INFO: "WebSocket /ws/transcribe" 403  ❌ Still authentication error
```

### **Check 3: API Health**
```bash
curl -H "Authorization: Bearer $(cat access_token.txt)" http://localhost:8000/api/v1/users/me
```

**Should return:**
```json
{
  "id": "1",
  "email": "doctor@demo.com",
  "role": "doctor"
}
```

---

## ✅ **Fix Summary**

**Git Commit:** `fa2a353`

**Changes:**
1. Added token validation before WebSocket connection
2. Better error messages for users  
3. Automatic stop if token invalid
4. Debug logging for localStorage keys
5. Token format validation (length, structure)

**Status:** ✅ **Improved error handling - waiting for user to re-login**

---

## 🚀 **Next Steps**

1. **User:** Log out and log in again
2. **User:** Test WebSocket connection
3. **User:** Report if issue persists
4. **Dev:** If still failing, check JWT secret keys match

---

**Last Updated:** September 30, 2025, 8:15 PM IST  
**Issue:** WebSocket 403 authentication  
**Solution:** Re-login to get fresh JWT token
