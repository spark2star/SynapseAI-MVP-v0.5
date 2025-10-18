# Dashboard Configuration Guide

## Overview

This document describes the configuration requirements and options for the Clinical Command Center dashboard feature.

## Backend Configuration

### Environment Variables

No additional environment variables are required for the dashboard feature. It uses the existing database and authentication configuration.

### Database Requirements

The dashboard relies on existing database tables and indexes:

#### Required Tables
- `patients` (IntakePatient model)
- `reports` (Report model)
- `consultation_sessions` (ConsultationSession model)

#### Required Indexes

Ensure the following indexes exist for optimal performance:

```sql
-- Patient indexes
CREATE INDEX idx_patients_created_by ON patients(created_by);
CREATE INDEX idx_patients_profile_status ON patients(profile_status);
CREATE INDEX idx_patients_created_at ON patients(created_at);

-- Report indexes
CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_patient_status ON reports(patient_status);
CREATE INDEX idx_reports_session_id ON reports(session_id);
CREATE INDEX idx_reports_created_at ON reports(created_at);

-- Session indexes
CREATE INDEX idx_sessions_patient_id ON consultation_sessions(patient_id);
CREATE INDEX idx_sessions_started_at ON consultation_sessions(started_at);
```

### API Router Registration

The dashboard router is automatically registered in `backend/app/api/api_v1/api.py`:

```python
from app.api.api_v1.endpoints import dashboard

api_router.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["dashboard"]
)
```

### Authentication

The dashboard endpoint requires authentication via JWT Bearer token. The endpoint uses the existing `get_current_user_id` dependency:

```python
@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    # ...
```

### Logging

Dashboard logging uses the standard Python logging configuration. Ensure logging is configured in `backend/app/core/logging_config.py`:

```python
import logging

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
```

Log levels:
- `INFO`: Successful requests and operations
- `WARNING`: Partial failures or degraded functionality
- `ERROR`: Complete failures or exceptions

---

## Frontend Configuration

### Environment Variables

The frontend uses the existing API URL configuration:

```bash
# .env.local or .env.production
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

### API Service Configuration

The dashboard API method is added to the existing API service (`frontend/src/services/api.ts`):

```typescript
async getDashboardStats(): Promise<DashboardStatsResponse> {
  const response = await this.api.get<DashboardStatsResponse>('/dashboard/stats');
  return response.data;
}
```

### Type Definitions

Dashboard types should be defined in `frontend/src/types/index.ts`:

```typescript
export interface DashboardStatsResponse {
  status: 'success' | 'error'
  data: {
    pending_intake_patients: PendingIntakePatient[]
    needs_attention_patients_count: number
    pending_reports_count: number
    active_patients_count: number
    sessions_this_week: WeeklySession[]
  }
}

export interface PendingIntakePatient {
  id: string
  full_name: string
  registered_at: string
}

export interface WeeklySession {
  day: string
  count: number
}
```

### Component Imports

Dashboard components are imported from `@/components/dashboard/`:

```typescript
import ClinicalIntakeQueue from '@/components/dashboard/ClinicalIntakeQueue'
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard'
import PatientSearchBar from '@/components/dashboard/PatientSearchBar'
import StatCard from '@/components/dashboard/StatCard'
import WeeklySessionsChart from '@/components/dashboard/WeeklySessionsChart'
```

### Routing Configuration

The dashboard page is located at `/dashboard` and uses Next.js App Router:

```
frontend/src/app/dashboard/page.tsx
```

Navigation paths used by dashboard components:
- `/dashboard/patients/{id}/clinical-info` - Clinical profile completion
- `/dashboard/patients?filter=needs_attention` - Filtered patients list
- `/dashboard/patients?search={query}` - Patient search results
- `/dashboard/reports?filter=pending_review` - Pending reports list

---

## Performance Configuration

### Query Optimization

The dashboard endpoint executes 5 database queries. For optimal performance:

1. **Ensure indexes exist** (see Database Requirements above)
2. **Monitor query execution time** - Target < 100ms per query
3. **Use connection pooling** - Configure in database settings

### Caching (Optional)

For high-traffic deployments, consider implementing Redis caching:

```python
from functools import lru_cache
from datetime import timedelta

@lru_cache(maxsize=128)
@cache(expire=60)  # Cache for 60 seconds
async def get_dashboard_stats(...):
    # ...
```

Cache configuration:
- **TTL**: 60 seconds (recommended)
- **Invalidation**: On patient/report updates
- **Storage**: Redis or in-memory

### Rate Limiting

The dashboard endpoint uses existing rate limiting middleware:

```python
# Default limits
- 100 requests per minute per user
- 1000 requests per hour per user
```

To adjust limits, modify `backend/app/core/rate_limit.py`.

---

## Security Configuration

### Authentication

The dashboard requires valid JWT authentication. No additional configuration needed.

### Data Isolation

The dashboard automatically filters data by `created_by` field to ensure doctors only see their own patients. This is enforced at the query level:

```python
patients = db.query(Patient).filter(
    Patient.created_by == doctor_id
).all()
```

### CORS Configuration

Ensure CORS is configured to allow frontend access:

```python
# backend/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Monitoring Configuration

### Health Checks

The dashboard endpoint can be monitored via standard health check endpoints:

```bash
GET /health
GET /api/v1/health
```

### Metrics

Key metrics to monitor:

1. **Response Time**
   - Target: < 500ms
   - Alert: > 1000ms

2. **Error Rate**
   - Target: < 1%
   - Alert: > 5%

3. **Request Volume**
   - Monitor requests per minute
   - Alert on unusual spikes

### Logging

Dashboard logs are written to standard output and can be collected by your logging infrastructure:

```bash
# View logs in development
docker-compose logs -f backend

# View logs in production
kubectl logs -f deployment/backend
```

Log format:
```
INFO: Dashboard stats requested by doctor abc123
INFO: Dashboard stats successfully retrieved for doctor abc123
ERROR: Failed to fetch needs attention count: <error details>
```

---

## Deployment Configuration

### Development

No special configuration required. The dashboard works with the standard development setup:

```bash
./scripts/setup-dev.sh
```

### Staging

Staging configuration should match production but with:
- Lower rate limits (optional)
- Debug logging enabled
- Test data volumes

### Production

Production deployment checklist:

1. ✅ Database indexes created
2. ✅ Environment variables configured
3. ✅ CORS settings updated for production domain
4. ✅ Rate limiting configured appropriately
5. ✅ Monitoring and alerting enabled
6. ✅ Logging configured for production
7. ✅ Caching enabled (optional)

### Docker Configuration

The dashboard is included in the standard Docker build. No additional configuration needed:

```dockerfile
# Backend Dockerfile already includes dashboard endpoint
# Frontend Dockerfile already includes dashboard components
```

### Kubernetes Configuration

For Kubernetes deployments, ensure:

1. **Resource Limits**
   ```yaml
   resources:
     requests:
       memory: "256Mi"
       cpu: "100m"
     limits:
       memory: "512Mi"
       cpu: "500m"
   ```

2. **Health Checks**
   ```yaml
   livenessProbe:
     httpGet:
       path: /health
       port: 8000
     initialDelaySeconds: 30
     periodSeconds: 10
   ```

3. **Environment Variables**
   ```yaml
   env:
     - name: DATABASE_URL
       valueFrom:
         secretKeyRef:
           name: db-credentials
           key: url
   ```

---

## Troubleshooting Configuration Issues

### Dashboard Not Loading

**Check:**
1. API URL is correctly configured in frontend `.env`
2. Backend is running and accessible
3. CORS is configured to allow frontend domain
4. Authentication token is valid

**Debug:**
```bash
# Check backend logs
docker-compose logs backend | grep dashboard

# Check frontend console
# Open browser DevTools > Console

# Test API directly
curl -H "Authorization: Bearer <token>" \
  http://localhost:8080/api/v1/dashboard/stats
```

### Slow Performance

**Check:**
1. Database indexes exist (see Database Requirements)
2. Query execution time in logs
3. Database connection pool size
4. Network latency between services

**Optimize:**
```sql
-- Check query performance
EXPLAIN ANALYZE SELECT * FROM patients WHERE created_by = 'doctor_id';

-- Check index usage
SELECT * FROM pg_stat_user_indexes WHERE tablename = 'patients';
```

### Authentication Errors

**Check:**
1. JWT token is valid and not expired
2. User has correct role (doctor)
3. Authentication middleware is configured
4. Token is included in request headers

**Debug:**
```bash
# Decode JWT token
echo "<token>" | cut -d. -f2 | base64 -d | jq

# Check authentication logs
docker-compose logs backend | grep auth
```

---

## Configuration Best Practices

1. **Use Environment Variables** - Never hardcode configuration values
2. **Enable Monitoring** - Set up alerts for errors and performance
3. **Test Configuration** - Verify in staging before production
4. **Document Changes** - Keep this file updated with configuration changes
5. **Version Control** - Track configuration in git (except secrets)
6. **Backup Configuration** - Keep backups of production configuration
7. **Security First** - Never expose sensitive configuration publicly

---

## Configuration Checklist

### Initial Setup
- [ ] Database indexes created
- [ ] Environment variables configured
- [ ] API router registered
- [ ] Frontend API service updated
- [ ] Type definitions added
- [ ] CORS configured

### Pre-Deployment
- [ ] Configuration tested in staging
- [ ] Performance benchmarks met
- [ ] Security review completed
- [ ] Monitoring configured
- [ ] Documentation updated
- [ ] Rollback plan prepared

### Post-Deployment
- [ ] Health checks passing
- [ ] Metrics being collected
- [ ] Logs being aggregated
- [ ] Alerts configured
- [ ] Team trained on new feature
- [ ] User documentation published

---

## Support

For configuration assistance:
- Review [API Documentation](../backend/docs/DASHBOARD_API.md)
- Check [Troubleshooting Guide](./TROUBLESHOOTING.md)
- Contact your system administrator
- Create an issue in the repository
