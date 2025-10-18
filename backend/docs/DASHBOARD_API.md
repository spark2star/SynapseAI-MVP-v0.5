# Dashboard API Documentation

## Overview

The Dashboard API provides a consolidated endpoint for retrieving all dashboard statistics in a single request. This endpoint powers the Clinical Command Center, which transforms the passive dashboard into an actionable workflow hub for clinicians.

## Base URL

```
/api/v1/dashboard
```

## Authentication

All dashboard endpoints require authentication via JWT Bearer token:

```
Authorization: Bearer <access_token>
```

## Endpoints

### Get Dashboard Statistics

Retrieves consolidated dashboard analytics for the authenticated doctor.

**Endpoint:** `GET /api/v1/dashboard/stats`

**Authentication:** Required (Doctor role)

**Response Time:** < 500ms (typical)

#### Response Schema

```json
{
  "status": "success",
  "data": {
    "pending_intake_patients": [
      {
        "id": "uuid-string",
        "full_name": "string",
        "registered_at": "ISO-8601 timestamp"
      }
    ],
    "needs_attention_patients_count": 0,
    "pending_reports_count": 0,
    "active_patients_count": 0,
    "sessions_this_week": [
      {
        "day": "Mon|Tue|Wed|Thu|Fri|Sat|Sun",
        "count": 0
      }
    ]
  }
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `pending_intake_patients` | Array | Up to 5 most recent patients with profile status "DEMOGRAPHICS_ONLY" |
| `pending_intake_patients[].id` | String (UUID) | Patient unique identifier |
| `pending_intake_patients[].full_name` | String | Patient's full name |
| `pending_intake_patients[].registered_at` | String (ISO-8601) | Registration timestamp |
| `needs_attention_patients_count` | Integer | Count of patients whose latest report has status "worse" |
| `pending_reports_count` | Integer | Count of reports with status "completed" awaiting review |
| `active_patients_count` | Integer | Count of patients with profile status "CLINICAL_INFO_COMPLETE" |
| `sessions_this_week` | Array | Session counts grouped by day of week for last 7 days |
| `sessions_this_week[].day` | String | Abbreviated day name (Mon-Sun) |
| `sessions_this_week[].count` | Integer | Number of sessions on that day |

#### Example Request

```bash
curl -X GET "https://api.example.com/api/v1/dashboard/stats" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Example Response

```json
{
  "status": "success",
  "data": {
    "pending_intake_patients": [
      {
        "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
        "full_name": "Priya Sharma",
        "registered_at": "2024-10-18T10:30:00Z"
      },
      {
        "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
        "full_name": "Rajesh Kumar",
        "registered_at": "2024-10-18T09:15:00Z"
      }
    ],
    "needs_attention_patients_count": 3,
    "pending_reports_count": 5,
    "active_patients_count": 87,
    "sessions_this_week": [
      { "day": "Mon", "count": 5 },
      { "day": "Tue", "count": 8 },
      { "day": "Wed", "count": 6 },
      { "day": "Thu", "count": 7 },
      { "day": "Fri", "count": 4 },
      { "day": "Sat", "count": 2 },
      { "day": "Sun", "count": 1 }
    ]
  }
}
```

#### Error Responses

**401 Unauthorized**
```json
{
  "detail": "Not authenticated"
}
```

**500 Internal Server Error**
```json
{
  "detail": "Failed to load dashboard data"
}
```

Note: The endpoint implements graceful degradation. If individual queries fail, default values (empty arrays, zero counts) are returned for those metrics while still providing available data.

## Data Isolation

The dashboard endpoint ensures strict data isolation:
- Doctors only see data for patients they created (`created_by` field)
- All queries filter by the authenticated doctor's user ID
- No cross-doctor data leakage is possible

## Performance Considerations

### Query Optimization

The endpoint executes 5 database queries in parallel:
1. Pending intake patients (LIMIT 5)
2. Needs attention count (with subquery for latest reports)
3. Pending reports count
4. Active patients count
5. Weekly sessions (last 7 days)

### Caching Strategy

Currently, no caching is implemented (acceptable for MVP). Future enhancements may include:
- Redis caching with 60-second TTL
- Cache invalidation on patient/report updates
- Stale-while-revalidate pattern

### Database Indexes

The following indexes are utilized for optimal performance:
- `patients.created_by`
- `patients.profile_status`
- `reports.status`
- `reports.patient_status`
- `consultation_sessions.started_at`
- `consultation_sessions.patient_id`

## Graceful Degradation

The endpoint implements graceful degradation to ensure partial functionality even when individual queries fail:

```python
# Initialize with defaults
response_data = {
    "pending_intake_patients": [],
    "needs_attention_patients_count": 0,
    "pending_reports_count": 0,
    "active_patients_count": 0,
    "sessions_this_week": []
}

# Each query wrapped in try-except
try:
    response_data["pending_intake_patients"] = _get_pending_intake_patients(db, doctor_id)
except Exception as e:
    logger.error(f"Failed to fetch pending intake patients: {e}")
    # Continue with default value
```

This ensures the dashboard remains functional even if specific metrics fail to load.

## Rate Limiting

Standard API rate limits apply:
- 100 requests per minute per user
- 1000 requests per hour per user

## Monitoring

The endpoint logs the following events:
- Successful requests: `INFO` level
- Individual query failures: `ERROR` level with stack trace
- Complete endpoint failures: `ERROR` level with stack trace

Example log entries:
```
INFO: Dashboard stats requested by doctor abc123
INFO: Dashboard stats successfully retrieved for doctor abc123
ERROR: Failed to fetch needs attention count: <error details>
```

## Testing

### Unit Tests

Located in `backend/tests/test_dashboard.py`:
- Test each helper function independently
- Test main endpoint with complete data
- Test authentication requirement
- Test doctor data isolation
- Test empty data handling
- Test partial query failure

### Integration Tests

- Full API call with database
- Concurrent request handling
- Large dataset performance (1000+ patients)
- Cross-doctor data isolation verification

## Future Enhancements

Planned improvements for future releases:
1. **Real-time Updates**: WebSocket support for live dashboard updates
2. **Caching**: Redis caching with smart invalidation
3. **Pagination**: Support for viewing more than 5 pending patients
4. **Filtering**: Additional filter options for dashboard metrics
5. **Export**: PDF/CSV export of dashboard data
6. **Customization**: User-configurable dashboard widgets

## Related Documentation

- [Design Document](../../.kiro/specs/dashboard-redesign/design.md)
- [Requirements Document](../../.kiro/specs/dashboard-redesign/requirements.md)
- [Implementation Tasks](../../.kiro/specs/dashboard-redesign/tasks.md)
- [Frontend Components Documentation](../../frontend/docs/DASHBOARD_COMPONENTS.md)
