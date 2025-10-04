# 🚀 SYNAPSEAI - QUICK START GUIDE (FIXED)

**Last Updated:** October 3, 2025  
**Status:** ✅ All port mismatches resolved

---

## 📋 PREREQUISITES

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Google Cloud credentials (for AI services)

---

## ⚡ QUICK START (3 STEPS)

### Step 1: Start Backend
```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5
./start-all.sh
```

**Wait for:**
```
✅ Backend started successfully on port 8080
```

**Verify:**
```bash
curl http://localhost:8080/api/v1/health
# Should return: {"status":"healthy"}
```

---

### Step 2: Start Frontend
```bash
cd frontend
npm run dev
```

**Wait for:**
```
✓ Ready in 2.3s
- Local: http://localhost:3001
```

**Note:** Frontend runs on port **3001** (not 3000)

---

### Step 3: Open Browser
```
http://localhost:3001
```

**Login with:**
- Email: `doc@demo.com`
- Password: `password123`

---

## 🔧 CONFIGURATION SUMMARY

### Backend
- **Port:** 8080
- **API Base:** `http://localhost:8080/api/v1`
- **Health Check:** `http://localhost:8080/api/v1/health`
- **Docs:** `http://localhost:8080/docs`

### Frontend
- **Port:** 3001
- **URL:** `http://localhost:3001`
- **API URL:** Configured via `.env.local`

### Environment Variables
**File:** `frontend/.env.local`
```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NODE_ENV=development
NEXT_PUBLIC_DEBUG=true
```

---

## ✅ VERIFICATION CHECKLIST

### Backend Health
```bash
# Test 1: Health endpoint
curl http://localhost:8080/api/v1/health

# Test 2: Login endpoint (should return 422 without body)
curl -X POST http://localhost:8080/api/v1/auth/login

# Test 3: Check process
ps aux | grep uvicorn | grep 8080
```

### Frontend Health
```bash
# Test 1: Access frontend
curl -I http://localhost:3001

# Test 2: Check process
ps aux | grep "next dev"

# Test 3: Verify .env.local
cat frontend/.env.local | grep NEXT_PUBLIC_API_URL
```

### Browser Verification
1. Open `http://localhost:3001`
2. Open DevTools (F12) > Console
3. Look for: `🔧 API Service initialized with URL: http://localhost:8080/api/v1`
4. Try login
5. Check Network tab - requests should go to `http://localhost:8080/api/v1/*`

---

## 🐛 TROUBLESHOOTING

### Issue: Backend not responding on 8080
```bash
# Check if port is in use
lsof -i :8080

# Kill existing process
pkill -f "uvicorn.*8080"

# Restart
./start-all.sh
```

---

### Issue: Frontend shows connection errors
```bash
# 1. Verify .env.local exists
cat frontend/.env.local

# 2. Clear cache
cd frontend
rm -rf .next node_modules/.cache

# 3. Restart
npm run dev

# 4. Check browser console for correct URL
```

---

### Issue: "ERR_CONNECTION_REFUSED"
**This means backend is not running or wrong port**

**Fix:**
```bash
# 1. Check backend status
curl http://localhost:8080/api/v1/health

# 2. If fails, restart backend
./start-all.sh

# 3. Verify frontend .env.local has correct URL
cat frontend/.env.local | grep 8080
```

---

### Issue: Still seeing port 8000 in requests
**This means cache needs to be cleared**

**Fix:**
```bash
# 1. Stop frontend (Ctrl+C)

# 2. Clear everything
cd frontend
rm -rf .next node_modules/.cache

# 3. Verify environment
cat .env.local

# 4. Restart
npm run dev

# 5. Hard refresh browser (Ctrl+Shift+R)
```

---

## 📊 PORT REFERENCE

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Backend API | 8080 | http://localhost:8080/api/v1 | ✅ Running |
| Frontend | 3001 | http://localhost:3001 | ✅ Running |
| PostgreSQL | 5432 | localhost:5432 | ✅ Running |
| Redis | 6379 | localhost:6379 | ✅ Running |

**⚠️ Note:** Port 8000 is NOT used - if you see it, clear cache!

---

## 🔄 AUTOMATED FIX SCRIPT

If you encounter port issues, run:
```bash
./fix-port-mismatch.sh
```

This will:
- ✅ Verify `.env.local` configuration
- ✅ Clear Next.js cache
- ✅ Check backend connectivity
- ✅ Provide clear next steps

---

## 📚 DOCUMENTATION

- **Backend Audit:** `BACKEND_AUDIT_REPORT.md` (50+ sections)
- **Port Fix Details:** `PORT_MISMATCH_FIX_SUMMARY.md`
- **API Documentation:** `http://localhost:8080/docs` (when backend running)

---

## 🎯 DEMO CREDENTIALS

### Doctor Account
- Email: `doc@demo.com`
- Password: `password123`
- Role: Doctor

### Admin Account
- Email: `adm@demo.com`
- Password: `password123`
- Role: Admin

### Receptionist Account
- Email: `rec@demo.com`
- Password: `password123`
- Role: Receptionist

---

## 🚀 COMMON WORKFLOWS

### Create New Patient
1. Login at `http://localhost:3001/login`
2. Navigate to "New Patient" or `/intake/new-patient`
3. Fill Stage 1: Demographics
4. Fill Stage 2: Symptoms
5. Click "Complete Registration"
6. Patient appears in dashboard

### Start Consultation
1. Go to patient detail page
2. Click "Follow Up" or "Start Consultation"
3. Enter chief complaint
4. Select audio device
5. Click "Start Session"
6. Speak (multi-language: Hindi, Marathi, English)
7. Click "Stop Session"
8. Review transcription
9. Generate report

### View Patient List
1. Navigate to `/dashboard/patients`
2. Search by name, phone, or patient ID
3. Click patient to view details
4. View consultation history

---

## ⚙️ ENVIRONMENT SETUP (First Time)

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt

# Copy environment template
cp env.example .env

# Edit .env with your credentials
# - DATABASE_URL
# - SECRET_KEY
# - GOOGLE_API_KEY
# etc.

# Run migrations
alembic upgrade head

# Create demo users
python create_demo_users_simple.py
```

### Frontend Setup
```bash
cd frontend
npm install

# Create .env.local (already done by fix script)
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8080
NODE_ENV=development
EOF
```

---

## 🎉 SUCCESS CRITERIA

**Everything is working when:**

✅ Backend responds: `curl http://localhost:8080/api/v1/health` returns `{"status":"healthy"}`  
✅ Frontend loads: `http://localhost:3001` shows login page  
✅ Console shows: `🔧 API Service initialized with URL: http://localhost:8080/api/v1`  
✅ Login works: Can login with `doc@demo.com`  
✅ Network tab: All requests go to `http://localhost:8080/api/v1/*`  
✅ No errors: No `ERR_CONNECTION_REFUSED` in console  

---

## 📞 SUPPORT

**Issues Fixed:**
- ✅ Port mismatch (8000 vs 8080)
- ✅ Patient list 500 errors (use `/intake/patients`)
- ✅ Encryption decryption failures
- ✅ Frontend-backend communication

**Known Limitations:**
- Report list endpoint not implemented (use consultation history)
- PDF export not implemented (use browser print)
- Email notifications not implemented

---

**Last Verified:** October 3, 2025  
**System Status:** ✅ All services operational

