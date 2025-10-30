---
inclusion: always
---

# Codebase Architecture & Conventions

## Project Overview

SynapseAI is a mental health EMR system with AI-powered transcription and reporting. The stack is FastAPI (Python 3.11+) backend with Next.js 14 (TypeScript) frontend.

## Architecture Patterns

### Backend (FastAPI)
- **Layered architecture**: API → Services → Models → Database
- **Dependency injection**: Use FastAPI's `Depends()` for database sessions, auth, etc.
- **Async-first**: All endpoints and database operations use `async/await`
- **Type safety**: Pydantic schemas for request/response validation

### Frontend (Next.js 14)
- **App Router**: Use `app/` directory structure, not `pages/`
- **Server/Client components**: Default to server components, use `'use client'` only when needed
- **State management**: Zustand for global state, React hooks for local state
- **API layer**: Centralized in `src/services/` using Axios

## Security & Privacy

### Field-Level Encryption
- **All PII must be encrypted**: Patient data, user emails, sensitive fields
- Use `encrypt_field()` and `decrypt_field()` from `app.core.encryption`
- Store hashed versions for search: `sha256(value.lower()).hexdigest()`

### Authentication
- **JWT tokens**: Access token (30 min), refresh token (7 days)
- Protected endpoints use `current_user: User = Depends(get_current_user)`
- Never expose raw tokens in logs or error messages

### Audit Logging
- Log all significant actions: patient CRUD, consultations, report generation
- Use `audit_logger.log_event()` from `app.core.audit`

## Code Style

### Python (Backend)
- **PEP 8 compliant**: Use snake_case for functions/variables
- **Type hints**: Always include type annotations
- **Docstrings**: Use for public functions and classes
- **Error handling**: Raise HTTPException with proper status codes and error structure

### TypeScript (Frontend)
- **Strict mode**: Enable strict TypeScript checks
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Component structure**: Props interface → Component → Export
- **Avoid `any`**: Use proper types or `unknown` with type guards

## Database Conventions

### Models
- **UUID primary keys**: All tables use UUID, not auto-increment integers
- **Timestamps**: Include `created_at` and `updated_at` on all models
- **Soft deletes**: Use `is_active` flag instead of hard deletes
- **Relationships**: Use SQLAlchemy relationships with proper lazy loading

### Migrations (Alembic)
- **Descriptive names**: `alembic revision --autogenerate -m "add_patient_allergies_field"`
- **Test migrations**: Always test upgrade and downgrade paths
- **Never edit existing migrations**: Create new ones for changes

## API Conventions

### Response Format
```json
{
  "status": "success|error",
  "data": {},
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  },
  "metadata": {
    "timestamp": 1234567890,
    "version": "1.0.0"
  }
}
```

### Endpoints
- **RESTful naming**: Use plural nouns (`/patients`, not `/patient`)
- **Versioning**: All endpoints under `/api/v1/`
- **Pagination**: Use `skip` and `limit` query params (P0-3)
- **camelCase**: Response keys use camelCase (P0-4)

## AI Services

### Google Cloud STT
- **Multi-language**: Support hi-IN, en-IN, mr-IN with code-mixing
- **Streaming**: Use WebSocket for real-time transcription
- **Error handling**: Gracefully handle STT failures, don't crash sessions

### Gemini 2.5 Flash
- **Mental health prompts**: Use specialized prompts in `app/services/gemini_service.py`
- **Structured output**: Parse JSON responses with fallback to text
- **Rate limiting**: Respect API quotas, implement retry logic

## Testing Strategy

### When to Scan Codebase
- **Bug fixes**: Search for related code using `grepSearch` before making changes
- **New features**: Review similar existing implementations
- **Refactoring**: Understand dependencies and usage patterns

### Key Files to Check
- `backend/app/main.py`: Application entry point and middleware
- `backend/app/core/config.py`: Environment configuration
- `backend/app/api/api_v1/api.py`: API router registration
- `frontend/src/services/api.ts`: API client configuration
- `frontend/src/store/`: Global state management

## Common Patterns

### Creating New Endpoints
1. Define Pydantic schema in `backend/app/schemas/`
2. Add endpoint in `backend/app/api/api_v1/endpoints/`
3. Implement service logic in `backend/app/services/`
4. Add frontend service in `frontend/src/services/`
5. Update types in `frontend/src/types/`

### WebSocket Connections
- Backend: Use FastAPI WebSocket with JWT auth
- Frontend: Establish connection, handle reconnection logic
- Always clean up connections on unmount

## Performance Considerations

- **Database queries**: Use eager loading for relationships to avoid N+1 queries
- **Caching**: Redis for session data and frequently accessed data
- **Pagination**: Always paginate large result sets (P0-3)
- **Rate limiting**: Applied globally and per-endpoint (P1-1)

## Deployment

- **Docker**: Use docker-compose for local development
- **Production**: Google Cloud Run with Cloud SQL and Secret Manager
- **Environment variables**: Never commit secrets, use `.env` files locally
- **Health checks**: `/health` endpoint for load balancers