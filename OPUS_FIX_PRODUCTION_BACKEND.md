# 🔧 **TASK FOR CLAUDE OPUS 4.1: Fix Production Backend Import/Dependency Errors**

## 📋 **CONTEXT**

I'm building a HIPAA-compliant clinical documentation platform (SynapseAI EMR) with:
- **Backend**: FastAPI (Python 3.11) with SQLAlchemy, Pydantic V2, Alembic
- **Frontend**: Next.js 14 (TypeScript, React)
- **Features**: Real-time Speech-to-Text (Vertex AI), Gemini AI report generation, secure authentication

**Current Status:**
- ✅ **Vertex AI STT is working** in a temporary `simple_main.py` file
- ✅ All core backend code is complete and production-ready
- ❌ **Production backend (`app/main.py`) has import/dependency errors**

## 🎯 **YOUR TASK**

Fix ALL import errors and dependency issues in the production backend so that `app/main.py` can run successfully. The goal is to switch from `simple_main.py` to the full production backend (`app.main:app`).

---

## 🔴 **KNOWN ERRORS**

### Error Categories:
1. **Import Errors**: Missing or circular imports
2. **Pydantic V2 Compatibility**: `regex` → `pattern` migrations incomplete
3. **FastAPI Dependency Issues**: `Annotated` type hints causing errors
4. **SQLAlchemy**: Potential session management issues

### Sample Errors (from previous attempts):
```python
ImportError: cannot import name 'NotFoundException' from 'app.core.exceptions'
ImportError: cannot import name 'get_current_user' from 'app.api.deps'
FastAPIError: Invalid dependency annotation
PydanticUserError: Field 'regex' has been renamed to 'pattern'
```

---

## 📁 **KEY FILES TO CHECK/FIX**

### Core Application
- `backend/app/main.py` - Main FastAPI application
- `backend/app/api/api_v1/api.py` - API router aggregation
- `backend/app/core/config.py` - Settings and configuration
- `backend/app/core/security.py` - JWT and authentication
- `backend/app/core/exceptions.py` - Custom exceptions
- `backend/app/api/deps.py` - FastAPI dependencies

### API Endpoints
- `backend/app/api/api_v1/endpoints/auth.py`
- `backend/app/api/api_v1/endpoints/users.py`
- `backend/app/api/api_v1/endpoints/patients.py`
- `backend/app/api/api_v1/endpoints/consultations.py`
- `backend/app/api/api_v1/endpoints/profile.py` (newly added)
- `backend/app/api/websocket/transcribe.py` (Vertex AI STT)

### Database & Models
- `backend/app/db/session.py` - Database session management
- `backend/app/models/user.py`
- `backend/app/models/patient.py`
- `backend/app/models/consultation.py`

### Schemas (Pydantic V2)
- `backend/app/schemas/__init__.py`
- `backend/app/schemas/user.py`
- `backend/app/schemas/patient.py`
- `backend/app/schemas/consultation.py`
- `backend/app/schemas/profile.py` (newly added)

---

## ✅ **REFERENCE: WORKING SIMPLE_MAIN.PY**

The file `backend/simple_main.py` is currently working with:
- ✅ Real JWT token generation using `JWTManager`
- ✅ Vertex AI Speech-to-Text WebSocket endpoint
- ✅ Authentication endpoints
- ✅ Demo consultation endpoints

**Key imports that WORK in simple_main.py:**
```python
from app.core.security import JWTManager
from app.core.config import get_settings
from google.cloud import speech_v2 as speech
```

Use `simple_main.py` as a reference for:
1. How JWT manager is initialized and used
2. How settings are loaded
3. How the Vertex AI WebSocket endpoint is structured

---

## 🔍 **DEBUGGING APPROACH**

### 1. **Start with imports**
Run this to find import errors:
```bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
source venv/bin/activate
python -c "from app.main import app"
```

### 2. **Check for circular imports**
Look for files importing each other:
- `app/api/deps.py` ↔️ `app/core/security.py`
- `app/models/*.py` ↔️ `app/schemas/*.py`

### 3. **Pydantic V2 migration**
Search for deprecated Pydantic V1 syntax:
```bash
grep -r "regex=" backend/app/schemas/
grep -r "class Config:" backend/app/schemas/
grep -r "orm_mode" backend/app/
```

### 4. **FastAPI dependencies**
Check all `Depends()` usages have proper type annotations:
```python
# ❌ BAD (Pydantic V1 style)
def endpoint(user: User = Depends(get_current_user)):
    
# ✅ GOOD (Pydantic V2 + FastAPI)
from typing import Annotated
def endpoint(user: Annotated[User, Depends(get_current_user)]):
```

### 5. **Test incrementally**
After each fix, test with:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload
```

---

## 📝 **EXPECTED OUTPUT**

When successful, you should be able to:

1. **Start the backend**:
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

2. **Health check passes**:
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy","service":"EMR Backend"}
```

3. **API docs accessible**:
- http://localhost:8000/api/v1/docs (Swagger)
- http://localhost:8000/api/v1/redoc

4. **Key endpoints work**:
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/users/me` - Get current user
- `GET /api/v1/patients/list/` - List patients
- `WS /ws/transcribe` - Vertex AI STT WebSocket

---

## 🛠️ **FIXING GUIDELINES**

### 1. **Don't Break Working Code**
- `simple_main.py` should continue working
- Don't modify core dependencies (`requirements.txt`) unless absolutely necessary

### 2. **Pydantic V2 Patterns**
```python
# ✅ Use this pattern for all schemas
from pydantic import BaseModel, Field, ConfigDict

class MySchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)  # was: orm_mode = True
    
    field: str = Field(..., pattern=r"^[a-z]+$")  # was: regex
```

### 3. **FastAPI Dependencies**
```python
# ✅ Use Annotated for all dependencies
from typing import Annotated
from fastapi import Depends

async def get_current_user(...) -> User:
    ...

async def endpoint(
    user: Annotated[User, Depends(get_current_user)]
):
    ...
```

### 4. **Import Organization**
```python
# Standard library
import os
from datetime import datetime

# Third-party
from fastapi import FastAPI
from pydantic import BaseModel

# Local
from app.core.config import settings
from app.db.session import get_db
```

---

## 🎯 **SUCCESS CRITERIA**

The task is complete when:

1. ✅ `uvicorn app.main:app --reload` starts without errors
2. ✅ All API endpoints are accessible
3. ✅ Health check returns HTTP 200
4. ✅ Swagger docs load correctly
5. ✅ Can login and get JWT token
6. ✅ Can access protected endpoints with JWT
7. ✅ Vertex AI STT WebSocket endpoint works
8. ✅ No linter errors in core files

---

## 📦 **ENVIRONMENT INFO**

- **Python**: 3.11
- **FastAPI**: Latest
- **Pydantic**: V2 (pydantic-settings)
- **SQLAlchemy**: 2.x
- **Database**: PostgreSQL 15 (via Docker)
- **OS**: macOS (Darwin 24.6.0)

**Working directory**: `/Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend`

---

## 💡 **TIPS**

1. **Use grep extensively** to find all occurrences of deprecated patterns
2. **Fix one file at a time** and test imports
3. **Check `__pycache__`** and clear if needed: `find . -type d -name __pycache__ -exec rm -rf {} +`
4. **Look at git changes** to see what was recently modified: `git diff`
5. **Reference `simple_main.py`** for working patterns

---

## 📞 **IF YOU GET STUCK**

If you encounter an error you can't resolve:

1. **Show the full error traceback**
2. **Show the file and line number** where the error occurs
3. **Show the surrounding code** (10 lines before and after)
4. **Explain what you've tried** to fix it

---

## 🚀 **NEXT STEPS AFTER FIX**

Once the production backend is working:

1. Update `start-all.sh` to use `app.main:app` instead of `simple_main:app`
2. Test all features end-to-end
3. Archive or remove `simple_main.py`
4. Document any changes made in `BACKEND_FIX_NOTES.md`

---

## 📚 **ADDITIONAL CONTEXT**

**Why we're using simple_main.py now:**
- It was created as a temporary solution to test Vertex AI STT
- The full production backend had cascading import errors
- We needed to ship the STT feature quickly
- All the backend code is actually complete and ready

**What's been tested:**
- ✅ JWT token generation (real, not demo)
- ✅ Vertex AI Speech-to-Text streaming (LINEAR16 PCM @ 16kHz)
- ✅ WebSocket authentication
- ✅ Continuous transcription with auto-restart
- ✅ Multi-language support (Hindi, Marathi, English)

**What needs the full backend:**
- Profile management (CRUD operations)
- Full patient management
- Full consultation workflow
- Audit logging
- Role-based access control (RBAC)
- Encryption at rest for sensitive data

---

Good luck! Fix those imports and get the production backend running! 🚀
