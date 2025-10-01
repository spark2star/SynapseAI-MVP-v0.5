# 🔍 **WEBSOCKET DISCONNECT - SYSTEMATIC DEBUG ANALYSIS**

## 📊 **OBSERVED SYMPTOMS**

From backend logs (user spoke for 1 minute):
```
🧹 Cleaning up WebSocket connection for session CS-2024-NEW
🛑 Generator exiting: processing_complete=True, chunks_sent=24
📡 Stream #1 ended. Received responses: True, Total responses so far: 8
🏁 Speech API stream ended - session stopped (processing_complete is set)
🔌 WebSocket closed for session CS-2024-NEW
```

**Pattern:**
- WebSocket disconnects every ~3 seconds
- Only ~24 audio chunks sent per connection (= 3 seconds of audio @ 16kHz)
- Speech API IS receiving responses (transcripts working!)
- New WebSocket connection immediately reconnects

---

## 🔴 **ROOT CAUSE ANALYSIS**

### Issue 1: WebSocket Receive Loop Exits Prematurely

**Backend Code Flow:**
```python
# Line 1837-1850: Receive loop
while not processing_complete.is_set():
    audio_chunk = await websocket.receive_bytes()  # ← This must be raising exception
    audio_queue.put(audio_chunk)

# Line 1858-1863: Finally block
finally:
    audio_queue.put(None)  # Stops audio generator
    processing_complete.set()  # Stops speech thread
```

**The Loop Exits When:**
1. `processing_complete` is set to True (but it's False at start)
2. An exception is raised:
   - `asyncio.TimeoutError` → caught, loop continues
   - `WebSocketDisconnect` → caught, loop exits → cleanup runs
   - Other exceptions → caught, loop exits → cleanup runs

**Conclusion:** `websocket.receive_bytes()` is raising `WebSocketDisconnect` because **THE FRONTEND IS CLOSING THE WEBSOCKET!**

---

### Issue 2: Frontend Closing WebSocket

**Potential Causes:**
1. ❌ React StrictMode (checked - not present)
2. ❌ useEffect cleanup running (fixed - separated cleanup from state changes)
3. ❓ **Unknown - Need Frontend Logging!**

**What We Added:**
```typescript
// Line 95-102: Component lifecycle logging
useEffect(() => {
    console.log('[VertexAI] Component mounted')
    return () => {
        console.log('[VertexAI] ❌ Component unmounting')
        console.trace('[VertexAI] Unmount stack trace:')  // ← Shows WHO triggered unmount
    }
}, [])

// Line 365-367: stopRecording logging
const stopRecording = () => {
    console.log('[VertexAI] 🛑 stopRecording called')
    console.trace('[VertexAI] stopRecording stack trace:')  // ← Shows WHO called it
}
```

---

## 🎯 **WHAT TO LOOK FOR IN TESTING**

### Frontend Console (Chrome DevTools):

**GOOD SIGNS:**
```
[VertexAI] Component mounted
[VertexAI] WebSocket connected
[VertexAI] MediaRecorder started
[VertexAI] LINEAR16 PCM audio processor started
[VertexAI] Service ready
```

**BAD SIGNS (The Issue):**
```
[VertexAI] ❌ Component unmounting  ← Should NOT appear while recording!
  → Unmount stack trace shows what triggered it

[VertexAI] 🛑 stopRecording called  ← Should only appear when YOU click Stop
  → Stack trace shows who called it
```

### Backend Logs:

**WHAT WE WANT:**
```
🎤 Starting audio stream generator
✅ Config request sent
🎵 Sent 20 audio chunks
🎵 Sent 40 audio chunks
🎵 Sent 60 audio chunks  ← Increasing!
📥 Received 10 responses
✅ FINAL transcript: [your text]
🔄 Speech API stream ended, restarting
```

**WHAT WE'RE CURRENTLY SEEING:**
```
🎤 Starting audio stream generator
✅ Config request sent
🎵 Sent 20 audio chunks
🧹 Cleaning up  ← Too early!
🛑 Generator exiting
```

---

## 🧪 **TESTING INSTRUCTIONS**

### 1. **Hard Refresh Browser**
```bash
Cmd+Shift+R  (or Ctrl+Shift+R)
```

### 2. **Open Browser Console** (F12 → Console tab)

### 3. **Login**
```
Email: doctor@demo.com
Password: password123
```

### 4. **Start New Consultation**
- Click "Start New Consultation"
- Fill in chief complaint (optional)
- Click "Start Consultation"

### 5. **Start Recording**
- Click the microphone button
- **WATCH THE CONSOLE** for the first 10 seconds

### 6. **What to Report:**

**A. If you see "Component unmounting" logs:**
```
[VertexAI] ❌ Component unmounting
```
→ **Take a screenshot of the stack trace!**
→ This will show exactly what's causing the unmount

**B. If you see "stopRecording called" logs:**
```
[VertexAI] 🛑 stopRecording called
```
→ **Take a screenshot of the stack trace!**
→ This will show what code is calling stopRecording

**C. If you DON'T see those logs:**
→ Something else is closing the WebSocket
→ Check for browser errors or warnings

---

## 🔧 **CURRENT FIXES APPLIED**

### ✅ Fixed Issues:
1. useEffect cleanup now only runs on unmount (not on every state change)
2. Enhanced backend logging (shows exactly when/why things stop)
3. Enhanced frontend logging (shows stack traces for unmount/stopRecording)
4. Removed "Gemini 2.5 Flash" text (now says "Generating Your Medical Report")

### ⏳ Pending Investigation:
1. **WHY is the frontend closing the WebSocket every 3 seconds?**
   - Need stack traces from new logging
2. **Post-recording options not showing**
   - Likely related to: no transcripts accumulating due to disconnects
   - OR: State not updating correctly

---

## 📝 **NEXT STEPS**

1. **Test with new logging** → Get stack traces
2. **Identify what's calling stopRecording/unmounting component**
3. **Fix the actual root cause**
4. **Verify continuous transcription works**
5. **Verify post-recording options appear**

---

## 💡 **HYPOTHESIS**

My current hypothesis is that there's a **parent component state update** (like `recordingDuration` updating every second) that's causing the child component to remount, even though we've fixed the useEffect cleanup.

Possible culprits:
- Parent component re-rendering and passing new prop instances
- Key prop changing (if VertexAIAudioRecorder has a key)
- Conditional rendering wrapping the component

**The stack traces will tell us exactly what's happening!**

---

**Status:** Ready for testing with enhanced logging 🚀

