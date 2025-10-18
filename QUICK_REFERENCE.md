# 🚀 Quick Reference - Receptionist & Two-Stage Registration

## ⚡ Quick Start (30 seconds)

```bash
# 1. Database is ready (migration applied ✅)
# 2. Start backend
cd backend && uvicorn app.main:app --reload --port 8080

# 3. Start frontend
cd frontend && npm run dev

# 4. Test at: http://localhost:3000
```

---

## 🔗 Quick Links

| Page | URL | Role |
|------|-----|------|
| Staff Management | `/dashboard/settings/staff` | Doctor |
| Invite Acceptance | `/invite/{token}` | Public |
| New Patient (Demographics) | `/dashboard/patients/new-demographics` | Receptionist |
| Pending Review | `/dashboard/patients/pending-review` | Doctor |
| Complete Clinical | `/dashboard/patients/{id}/complete-clinical` | Doctor |

---

## 🎯 Quick Test (5 minutes)

```bash
# 1. Login as doctor → Invite receptionist
# 2. Accept invitation → Create account
# 3. Login as receptionist → Create patient
# 4. Login as doctor → Complete clinical info
# 5. Done! ✅
```

---

## 🔌 API Quick Reference

```bash
# Staff
POST   /api/v1/staff/invite
POST   /api/v1/staff/accept-invite/{token}
GET    /api/v1/staff/list

# Patients V2
POST   /api/v1/patients/v2/demographics
PUT    /api/v1/patients/v2/{id}/clinical-info
GET    /api/v1/patients/v2/pending-clinical-review
```

---

## 🗄️ Database Quick Check

```sql
-- Check migration
SELECT version_num FROM alembic_version;
-- Should be: 9691ddd22bb4

-- Check pending patients
SELECT patient_id, first_name, last_name, profile_status 
FROM patients 
WHERE profile_status = 'DEMOGRAPHICS_ONLY';

-- Check receptionists
SELECT email, role, invited_by_id 
FROM users 
WHERE role = 'receptionist';
```

---

## 🐛 Quick Fixes

### Can't login?
```javascript
// Browser console:
localStorage.clear();
location.reload();
```

### Database out of sync?
```bash
cd backend
alembic upgrade head
```

### Need invitation URL?
```bash
tail -f backend.log | grep "invitation"
```

---

## 📊 Quick Status Check

```bash
# Backend health
curl http://localhost:8080/api/v1/health

# Database connection
cd backend && alembic current

# Frontend build
cd frontend && npm run build
```

---

## 🔒 Security Quick Check

| Feature | Status |
|---------|--------|
| Token expiration | ✅ 7 days |
| Single-use tokens | ✅ Yes |
| RBAC | ✅ Enforced |
| Clinic isolation | ✅ Active |
| Password min length | ✅ 8 chars |

---

## 📝 Quick Notes

- **Receptionist:** Can only create demographics
- **Doctor:** Can complete clinical info
- **Tokens:** Expire in 7 days, single-use
- **Status:** DEMOGRAPHICS_ONLY → CLINICAL_INFO_COMPLETE
- **Clinic:** Receptionists linked via invited_by_id

---

## 🎉 Quick Win

Test the complete workflow in **under 10 minutes**:
1. Invite (1 min)
2. Accept (1 min)
3. Create patient (3 min)
4. Complete clinical (3 min)
5. Verify (2 min)

**Total: 10 minutes to full workflow! 🚀**

---

## 📞 Quick Help

**Issue?** Check:
1. Backend logs: `tail -f backend.log`
2. Frontend console: F12 → Console
3. Database: `alembic current`
4. API: `curl localhost:8080/api/v1/health`

**Still stuck?** See:
- `TEST_RECEPTIONIST_WORKFLOW.md` - Detailed test guide
- `RECEPTIONIST_COMPLETE_GUIDE.md` - Full documentation

---

**Everything is ready! Start testing! 🎯**
