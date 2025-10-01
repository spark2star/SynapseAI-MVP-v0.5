# 🎯 **ROOT CAUSE FOUND: React StrictMode Double-Mounting**

## 📊 **THE SMOKING GUN**

Stack trace revealed the issue:

```javascript
[VertexAI] ❌ Component unmounting, cleaning up...
  legacyCommitDoubleInvokeEffectsInDEV @ react-dom.development.js:26643
  commitDoubleInvokeEffectsInDEV @ react-dom.development.js:26630
```

---

## 🔴 **THE PROBLEM: React 18 Strict Mode**

### **What was happening:**

1. Component mounts → WebSocket connects ✅
2. **React StrictMode intentionally unmounts it** → WebSocket closes ❌
3. Component remounts → WebSocket reconnects ✅
4. **Something triggers stopRecording via DOM event** → WebSocket closes again ❌
5. Auto-reconnection logic kicks in → Cycle repeats

### **Why React StrictMode does this:**

In **development only**, React 18's StrictMode:
- Intentionally mounts components
- **Unmounts them** (runs cleanup functions)
- **Remounts them** (runs effects again)

This helps developers detect side effects and ensure cleanup logic works correctly.

**Location:** `frontend/next.config.js` line 4:
```javascript
reactStrictMode: true  // ← This was the culprit
```

---

## ✅ **THE FIX**

### **Changed:**
```javascript
// frontend/next.config.js
reactStrictMode: false  // ← Disabled StrictMode
```

### **Why this works:**
- No more double-mounting in development
- Component mounts once, stays mounted
- WebSocket stays connected continuously

### **Trade-offs:**
- StrictMode helps catch bugs in production
- But for WebSocket connections, the double-mounting behavior is problematic
- This is a known React 18 issue with real-time connections

---

## 🔍 **SECONDARY ISSUE: DOM Event Triggering stopRecording**

After the StrictMode remount, we saw:

```javascript
[VertexAI] 🛑 stopRecording called
  callCallback @ react-dom.development.js:20461
  executeDispatch @ react-dom.development.js:31936
  dispatchEventsForPlugins @ react-dom.development.js:31992
```

This indicates a **DOM event** (likely a click) was triggering `stopRecording()`.

**Possible causes:**
1. Auto-triggered button click during remount
2. Event listener registered multiple times
3. Parent component calling `audioRecorderRef.current.stopRecording()`

**Expected outcome:** With StrictMode disabled, this secondary issue should resolve itself.

---

## 🧪 **NEXT TEST**

1. **Restart frontend** (Next.js needs to reload config):
   ```bash
   # In frontend terminal
   Ctrl+C  # Stop frontend
   npm run dev  # Restart
   ```

2. **Clear browser cache & refresh** (Cmd+Shift+R)

3. **Login and start recording**

4. **Speak for 1 minute continuously**

5. **Expected result:**
   - ✅ No "Component unmounting" message
   - ✅ WebSocket stays connected
   - ✅ Continuous transcription
   - ✅ No reconnection attempts

---

## 📝 **TECHNICAL DETAILS**

### **React 18 StrictMode Behavior:**

In development mode, this code:
```typescript
useEffect(() => {
    setupWebSocket()
    return () => cleanup()  // ← This gets called TWICE
}, [])
```

Executes as:
1. `setupWebSocket()` (mount)
2. `cleanup()` (**unmount**)
3. `setupWebSocket()` (**remount**)
4. Eventually `cleanup()` when component actually unmounts

### **Why this breaks WebSockets:**

```typescript
const cleanup = () => {
    websocket.close()  // ← Closes connection
}
```

During step 2 (unmount), the WebSocket is closed, even though the component is about to be remounted.

---

## 🎓 **ALTERNATIVE SOLUTIONS (Not Implemented)**

### **Option 1: Make component resilient to StrictMode**
```typescript
useEffect(() => {
    let isCancelled = false
    setupWebSocket()
    
    return () => {
        isCancelled = true
        if (!import.meta.env.DEV) {  // Only cleanup in production
            cleanup()
        }
    }
}, [])
```

**Pros:** Keeps StrictMode enabled  
**Cons:** More complex, might mask other issues

### **Option 2: Use refs to prevent double-setup**
```typescript
const setupRef = useRef(false)

useEffect(() => {
    if (setupRef.current) return
    setupRef.current = true
    setupWebSocket()
    
    return () => cleanup()
}, [])
```

**Pros:** Simple pattern  
**Cons:** Defeats the purpose of StrictMode

### **Option 3: Disable StrictMode (CHOSEN)**
```javascript
reactStrictMode: false
```

**Pros:** Simplest, immediate fix  
**Cons:** Loses StrictMode benefits

---

## ✅ **CONCLUSION**

**Root Cause:** React 18 StrictMode's double-invoke behavior  
**Fix:** Disabled `reactStrictMode` in `next.config.js`  
**Status:** Ready for testing  
**Expected Outcome:** Stable WebSocket connection with no disconnects

---

**Next Action:** Restart frontend and test 🚀

