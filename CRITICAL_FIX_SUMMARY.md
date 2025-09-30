# 🔴 CRITICAL ROOT CAUSE FOUND!

## **Problem: Backend Running Demo/Mock Instead of Real Implementation**

### **What Happened:**
The `start-all.sh` script was launching `simple_main:app` (a mock/demo backend) instead of the **real** `app.main:app` backend with proper authentication and JWT generation.

###  **Symptoms:**
1. Login returns `"access_token": "demo-jwt-token-12345"` (hardcoded demo token)
2. WebSocket authentication fails with HTTP 403
3. No real JWT tokens being generated

---

## **Fix Applied:**

### **1. Updated start-all.sh (Commit: 452a641)**
```bash
# BEFORE (WRONG):
uvicorn simple_main:app --host 0.0.0.0 --port 8000

# AFTER (CORRECT):
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

---

## **Additional Fixes Required:**

### **2. Fixed auth_service.py (Commit: 79ad477)**
```python
# Added Depends(get_db) to dependency function
def get_auth_service(db: Session = Depends(get_db)) -> AuthenticationService:
```

### **3. Fixed patients.py (Commit: 756ee3c)**
```python
# Replaced all Annotated forms with simple form
# BEFORE:
db: Annotated[Session, Depends(get_db)],

# AFTER:
db: Session = Depends(get_db),
```

### **4. Fixed patient.py schema (Commit: 4fd481f)**
```python
# Pydantic V2 compatibility
# BEFORE:
Field("name", regex="^(name|phone|email)$")

# AFTER:
Field("name", pattern="^(name|phone|email)$")
```

### **5. Fixed patient_service.py (Just committed)**
- Added `Depends` and `get_db` imports
- Updated `get_patient_service` dependency

---

## **Remaining Issues:**

### **Files still using Annotated[Session, ...] pattern:**
1. `backend/app/api/api_v1/endpoints/profile.py`
2. `backend/app/api/api_v1/endpoints/intake.py`
3. `backend/app/api/api_v1/endpoints/users.py`

These need to be fixed with the same pattern:
```python
db: Annotated[Session, Depends(get_db)] 
  ↓
db: Session = Depends(get_db)
```

---

## **Why This Matters:**

The WebSocket authentication **requires real JWT tokens**. The demo tokens from `simple_main:app` are not valid for the WebSocket auth flow.

**Real backend** (`app.main:app`) generates proper JWT tokens like:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiw...
```

**Demo backend** (`simple_main:app`) only returns:
```
"demo-jwt-token-12345"
```

---

## **Status:**

✅ start-all.sh fixed  
✅ auth_service.py fixed  
✅ patients.py fixed  
✅ patient.py schema fixed  
✅ patient_service.py fixed  
⚠️ **3 files remain** (profile.py, intake.py, users.py)  
🔴 **Backend still failing to start** due to remaining Annotated issues

---

**Next Step:** Fix the 3 remaining endpoint files and test JWT generation.
