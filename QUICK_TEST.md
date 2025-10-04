# 🧪 Quick Test Guide - SynapseAI

**All services are running and ready to test!**

---

## ✅ Services Status

- **Frontend:** http://localhost:3000 ✅ Running
- **Backend:** http://localhost:8080 ✅ Running
- **API Docs:** http://localhost:8080/docs ✅ Available
- **PostgreSQL:** localhost:5432 ✅ Running
- **Redis:** localhost:6379 ✅ Running

---

## 👤 Demo Credentials

```
Doctor: doc@demo.com / password123
Admin:  adm@demo.com / password123
```

---

## 🎯 Quick Tests

### Test 1: Login via Browser

1. Open http://localhost:3000
2. Click "Login" or navigate to http://localhost:3000/auth/login
3. Enter:
   - Email: `doc@demo.com`
   - Password: `password123`
4. Click "Sign In"
5. **Expected:** Redirect to dashboard

### Test 2: Login via API

```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "doc@demo.com",
    "password": "password123"
  }' | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "bearer",
    "expires_in": 3600,
    "user_id": "04587e71-f81a-4738-8287-56d8b5ee1f22",
    "role": "doctor"
  }
}
```

### Test 3: Patient List Endpoint

```bash
# Get token first
TOKEN=$(curl -s -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"doc@demo.com","password":"password123"}' \
  | jq -r '.data.access_token')

# Test patient list
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/patients/list/?limit=10" | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "patients": [],
    "pagination": {
      "total": 0,
      "limit": 10,
      "offset": 0,
      "has_more": false
    }
  },
  "request_id": "a1b2c3d4"
}
```

### Test 4: Report Stats Endpoint

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/reports/stats" | jq
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "total_reports": 0,
    "by_status": {
      "completed": 0,
      "pending": 0,
      "generating": 0,
      "failed": 0
    },
    "recent_reports": 0,
    "average_confidence": 0.0
  },
  "request_id": "e5f6g7h8"
}
```

### Test 5: Report List with Filters

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:8080/api/v1/reports/list?status=completed&limit=5" | jq
```

---

## 🔧 Troubleshooting

### Issue: "Invalid credentials" error

**Solution:**
```bash
# Recreate demo users with correct encryption keys
cd backend
export ENCRYPTION_KEY="dev-encryption-key-32-bytes-long!"
export FIELD_ENCRYPTION_KEY="dev-field-encryption-key-32-bytes!"
export DATABASE_URL="postgresql://emr_user:emr_password@localhost:5432/emr_db"
python create_demo_users_simple.py
```

### Issue: Backend not responding

**Solution:**
```bash
# Check if backend is running
ps aux | grep uvicorn

# If not running, start it
./start-services.sh
```

### Issue: Frontend not loading

**Solution:**
```bash
# Check if frontend is running
ps aux | grep next-server

# If not running, start it
cd frontend
npm run dev
```

### Issue: Database connection error

**Solution:**
```bash
# Check if PostgreSQL container is running
docker ps | grep synapseai_postgres

# If not running, start it
docker-compose up -d db
```

---

## 📊 API Endpoints Reference

### Authentication
- `POST /api/v1/auth/login` - Login with email/password
- `POST /api/v1/auth/logout` - Logout (requires token)
- `POST /api/v1/auth/refresh` - Refresh access token

### Patients
- `GET /api/v1/patients/list/` - List patients (pagination, search)
- `GET /api/v1/patients/{id}` - Get patient details
- `GET /api/v1/patients/search/` - Search patients

### Reports
- `GET /api/v1/reports/list` - List reports (filters, pagination)
- `GET /api/v1/reports/stats` - Get report statistics
- `POST /api/v1/reports/generate-session` - Generate new report

### Consultations
- `POST /api/v1/consultation/start` - Start consultation
- `POST /api/v1/consultation/{id}/stop` - Stop consultation
- `GET /api/v1/consultation/history/{patient_id}` - Get consultation history

### Intake
- `POST /api/v1/intake/patients` - Create intake patient
- `GET /api/v1/intake/patients/{id}` - Get intake patient
- `GET /api/v1/intake/symptoms` - Search symptoms

---

## 🎨 Frontend Pages

- **Home:** http://localhost:3000
- **Login:** http://localhost:3000/auth/login
- **Dashboard:** http://localhost:3000/dashboard
- **Patients:** http://localhost:3000/dashboard/patients
- **Patient Detail:** http://localhost:3000/dashboard/patients/{id}
- **Intake:** http://localhost:3000/intake

---

## 📝 Logs

**Backend Logs:**
```bash
tail -f backend_live.log
# or
cd backend && tail -f backend_live.log
```

**Frontend Logs:**
```bash
# Check terminal where npm run dev is running
```

**Database Logs:**
```bash
docker logs -f synapseai_postgres
```

---

## 🛑 Stop Services

```bash
# Stop backend
pkill -f "uvicorn simple_main"

# Stop frontend
pkill -f "next-server"

# Stop Docker containers
docker-compose down
```

---

## ✅ Success Checklist

- [ ] Backend responds at http://localhost:8080/health
- [ ] Frontend loads at http://localhost:3000
- [ ] Login works with `doc@demo.com / password123`
- [ ] JWT token is generated and returned
- [ ] Patient list endpoint returns data (even if empty)
- [ ] Report stats endpoint returns data
- [ ] API docs accessible at http://localhost:8080/docs
- [ ] No errors in backend logs
- [ ] No errors in frontend console

---

**All tests passing?** 🎉 **You're ready to develop!**

**Need help?** Check:
- `AUTHENTICATION_FIXED.md` - Authentication setup details
- `PRODUCTION_BACKEND_IMPLEMENTATION.md` - Backend implementation guide
- `AUTH_DEBUG_COMPLETE_SUMMARY.md` - Debugging reference

