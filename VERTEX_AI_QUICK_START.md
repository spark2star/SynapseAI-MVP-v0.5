# Vertex AI STT - Quick Start Guide

## 🚀 **5-Minute Setup & Test**

This guide will get you up and running with Vertex AI Speech-to-Text transcription in 5 minutes.

---

## ✅ **Prerequisites**

- ✅ Google Cloud credentials file at: `./gcp-credentials.json`
- ✅ GCP Project ID: `synapse-product-1`
- ✅ Vertex AI Speech-to-Text API enabled
- ✅ Service account with proper permissions

---

## 📦 **Step 1: Install Dependencies** (1 min)

```bash
# Backend dependencies (already installed)
cd backend
source venv/bin/activate
pip install google-cloud-speech==2.24.0  # Already in requirements.txt

# Frontend dependencies (already installed)
cd ../frontend
npm install  # WebSocket support built into React
```

---

## ⚙️ **Step 2: Start Services** (2 min)

```bash
# From project root
./start-all.sh

# Wait for all services to start (~30 seconds)
# You should see:
# ✅ PostgreSQL: Running on port 5432
# ✅ Redis: Running on port 6379
# ✅ Backend: Running on port 8000
# ✅ Frontend: Running on port 3001
```

---

## 🧪 **Step 3: Test Transcription** (2 min)

### **Option A: Via Frontend UI (Recommended)**

1. **Open Browser:**
   ```
   http://localhost:3001
   ```

2. **Login:**
   ```
   Email: doctor@demo.com
   Password: password123
   ```

3. **Create or Open Session:**
   - Navigate to Dashboard
   - Click "New Consultation" or open existing session
   - You'll see the consultation page with transcription component

4. **Test Transcription:**
   - Click "🎤 Start Recording"
   - Allow microphone access when prompted
   - Speak in Hindi/Marathi/English:
     - "नमस्ते डॉक्टर" (Hindi)
     - "मला ताप आहे" (Marathi)
     - "I have a fever" (English)
   - Watch real-time transcription appear
   - Click "Stop Recording"
   - Verify transcript is saved

### **Option B: Via WebSocket Client (Advanced)**

Create `test_transcription.html`:

```html
<!DOCTYPE html>
<html>
<head>
    <title>Transcription Test</title>
</head>
<body>
    <h2>Vertex AI Transcription Test</h2>
    
    <button id="start">Start Recording</button>
    <button id="stop" disabled>Stop Recording</button>
    
    <div id="status">Status: Disconnected</div>
    <div id="transcript"></div>
    
    <script>
        const token = 'YOUR_JWT_TOKEN_HERE';  // Get from login
        const sessionId = 'YOUR_SESSION_ID';
        
        let ws;
        let mediaRecorder;
        
        document.getElementById('start').onclick = async () => {
            // Connect WebSocket
            ws = new WebSocket(`ws://localhost:8000/ws/transcribe?token=${token}&session_id=${sessionId}`);
            
            ws.onopen = () => {
                document.getElementById('status').textContent = 'Status: Connected';
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                if (data.transcript) {
                    document.getElementById('transcript').innerHTML += `<p>${data.transcript}</p>`;
                }
            };
            
            // Start recording
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    event.data.arrayBuffer().then(buffer => ws.send(buffer));
                }
            };
            
            mediaRecorder.start(250);
            document.getElementById('start').disabled = true;
            document.getElementById('stop').disabled = false;
        };
        
        document.getElementById('stop').onclick = () => {
            if (mediaRecorder) {
                mediaRecorder.stop();
            }
            if (ws) {
                ws.close();
            }
            document.getElementById('start').disabled = false;
            document.getElementById('stop').disabled = true;
            document.getElementById('status').textContent = 'Status: Disconnected';
        };
    </script>
</body>
</html>
```

---

## 🔍 **Step 4: Verify** (Quick Check)

### **Check Backend Logs:**
```bash
tail -f backend.log | grep -E "Vertex AI|Transcription|WebSocket"

# Expected output:
# [INFO] WebSocket connection established for session XYZ
# [INFO] Vertex AI Speech client initialized successfully
# [INFO] Recognition configured: model=latest_long, language=hi-IN
# [INFO] Transcription completed for session XYZ
```

### **Check Database:**
```bash
# Access PostgreSQL
docker exec -it emr_postgres psql -U emr_user -d emr_db

# Query transcriptions
SELECT id, session_id, stt_language, confidence_score, word_count, processing_status
FROM transcriptions
ORDER BY created_at DESC
LIMIT 5;

# Exit
\q
```

### **Expected Results:**
- ✅ WebSocket connects successfully
- ✅ Audio streams to backend
- ✅ Transcription appears in real-time
- ✅ Speaker tags show correctly (👨‍⚕️ Doctor / 🧑‍🤝‍🧑 Patient)
- ✅ Language switches automatically
- ✅ Transcript saved to database

---

## 🐛 **Quick Troubleshooting**

### **Issue: Connection Fails**

```bash
# 1. Check backend is running
curl http://localhost:8000/health
# Expected: {"status":"healthy","service":"EMR Backend"}

# 2. Check WebSocket endpoint
curl http://localhost:8000/ws/transcribe
# Expected: HTTP 426 Upgrade Required (normal for HTTP request to WS endpoint)

# 3. Verify GCP credentials
ls -la gcp-credentials.json
# Expected: File exists and is readable

# 4. Test GCP auth
python3 << EOF
import os
os.environ["GOOGLE_APPLICATION_CREDENTIALS"] = "gcp-credentials.json"
from google.cloud import speech_v2 as speech
client = speech.SpeechClient()
print("✅ Vertex AI client initialized successfully")
EOF
```

### **Issue: Microphone Not Working**

```bash
# Check browser console for errors
# Common fixes:
# 1. Grant microphone permission in browser
# 2. Use HTTPS (or localhost) - required for MediaRecorder
# 3. Check if microphone is already in use by another app
# 4. Try different browser (Chrome/Edge recommended)
```

### **Issue: No Transcription Appears**

```bash
# Check backend logs for Vertex AI errors
tail -n 100 backend.log | grep -i error

# Common causes:
# 1. GCP credentials invalid/expired
# 2. Vertex AI API not enabled
# 3. API quota exceeded
# 4. Wrong audio format (should be WEBM_OPUS)
```

---

## 📊 **Success Indicators**

You'll know it's working when you see:

1. **Frontend:**
   - 🟢 Connection status shows "Connected"
   - 🎤 Recording indicator animates
   - 💭 Interim results appear in italics
   - ✅ Final results appear with speaker tags
   - 📊 Confidence score shows (e.g., "95.2% confidence")
   - 🇮🇳 Language indicator shows current language

2. **Backend Logs:**
   ```
   [INFO] WebSocket authenticated for user 123
   [INFO] Using transcription ID abc-123
   [INFO] Vertex AI Speech client initialized
   [INFO] Sent initial config to Vertex AI
   [INFO] Audio stream ended. Total chunks processed: 427
   [INFO] Transcription completed for session XYZ
   ```

3. **Database:**
   ```sql
   -- Transcription record exists
   SELECT * FROM transcriptions WHERE session_id = 'XYZ';
   
   -- Output shows:
   -- transcript_text: (encrypted)
   -- confidence_score: 0.95
   -- word_count: 42
   -- processing_status: COMPLETED
   -- stt_service: vertex-ai
   -- stt_language: hi-IN
   ```

---

## 🎯 **Next Steps After Testing**

1. **Try Different Languages:**
   - Speak pure Hindi: "डॉक्टर मुझे सिर दर्द है"
   - Speak pure Marathi: "मला डोकेदुखी आहे"
   - Speak Hinglish: "मुझे headache है doctor"
   - Verify automatic language switching

2. **Test Speaker Diarization:**
   - Have two people speak alternately
   - Verify speaker tags (1 vs 2) are correctly assigned
   - Check if same speaker gets consistent tag

3. **Test Edge Cases:**
   - Pause mid-sentence (verify interim results)
   - Disconnect network (verify auto-reconnection)
   - Close browser tab (verify graceful cleanup)
   - Exceed API quota (verify error handling)

4. **Review Transcription Quality:**
   - Check medical terminology accuracy
   - Verify punctuation is correct
   - Review confidence scores for low-quality audio
   - Test with background noise

---

## 💡 **Pro Tips**

1. **Best Audio Quality:**
   - Use collar/lapel microphone
   - Reduce background noise
   - Speak clearly and not too fast
   - Keep mic ~15cm from mouth

2. **Development:**
   - Use browser DevTools to inspect WebSocket messages
   - Monitor backend logs in real-time: `tail -f backend.log`
   - Check database after each test: `psql` queries

3. **Debugging:**
   - Enable DEBUG logging in backend:
     ```bash
     export LOG_LEVEL=DEBUG
     ./start-all.sh
     ```
   - Use browser console to see client-side errors
   - Test with simple phrases first

---

## 📞 **Need Help?**

Check the comprehensive guide: `VERTEX_AI_STT_INTEGRATION.md`

**Common Resources:**
- Backend logs: `./backend.log`
- Frontend logs: Browser DevTools Console
- Database queries: `docker exec -it emr_postgres psql -U emr_user -d emr_db`
- API docs: http://localhost:8000/api/v1/docs

---

**Happy Transcribing! 🎤✨**
