# Design Document

## Overview

This document details the technical design for transforming the SynapseAI clinician dashboard into a Clinical Command Center. The redesign focuses on actionable workflows, efficient data retrieval, and maintaining consistency with the existing design system. The solution involves creating a new consolidated backend endpoint and restructuring the frontend into three priority-based sections.

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard Page (Frontend)                 │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Immediate Priorities Section                         │  │
│  │  - Clinical Intake Queue                              │  │
│  │  - Needs Attention Card                               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Core Actions Section                                 │  │
│  │  - Patient Search Bar                                 │  │
│  │  - Start Unscheduled Session Button                   │  │
│  │  - Review Pending Reports Button                      │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Practice Insights Section                            │  │
│  │  - Active Patients Stat Card                          │  │
│  │  - Weekly Sessions Chart                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ Single API Call
                            ▼
┌─────────────────────────────────────────────────────────────┐
│              Dashboard Stats Endpoint (Backend)              │
│                    GET /api/v1/dashboard/stats               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Query Orchestration Layer                            │  │
│  │  - Pending Intake Patients Query                      │  │
│  │  - Needs Attention Count Query                        │  │
│  │  - Pending Reports Count Query                        │  │
│  │  - Active Patients Count Query                        │  │
│  │  - Weekly Sessions Query                              │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database Layer                          │
│  - patients table (IntakePatient model)                      │
│  - reports table (Report model)                              │
│  - consultation_sessions table (ConsultationSession model)   │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Dashboard Load**: Frontend makes single API call to `/api/v1/dashboard/stats`
2. **Backend Processing**: Endpoint executes 5 parallel database queries
3. **Data Aggregation**: Results consolidated into single JSON response
4. **Frontend Rendering**: Components receive data via props and render sections
5. **User Interactions**: Actions trigger navigation or modal displays

## Components and Interfaces

### Backend Components

#### 1. Dashboard Router (`backend/app/api/api_v1/endpoints/dashboard.py`)

**Purpose**: Centralized endpoint for dashboard analytics

**Key Functions**:
- `get_dashboard_stats()`: Main endpoint handler
- `_get_pending_intake_patients()`: Helper for intake queue
- `_get_needs_attention_count()`: Helper for patient status
- `_get_pending_reports_count()`: Helper for report status
- `_get_active_patients_count()`: Helper for patient count
- `_get_weekly_sessions()`: Helper for session analytics

**Dependencies**:
- FastAPI router and dependencies
- SQLAlchemy ORM for database queries
- Authentication middleware (`get_current_user_id`)
- Database session (`get_db`)

#### 2. API Router Registration (`backend/app/api/api_v1/api.py`)

**Modification**: Add dashboard router to main API router

```python
from app.api.api_v1.endpoints import dashboard

api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
```

### Frontend Components

#### 1. Dashboard Page (`frontend/src/app/dashboard/page.tsx`)

**Purpose**: Main dashboard container and data orchestration

**State Management**:
```typescript
interface DashboardData {
  pending_intake_patients: PendingIntakePatient[]
  needs_attention_patients_count: number
  pending_reports_count: number
  active_patients_count: number
  sessions_this_week: WeeklySession[]
}
```

**Key Responsibilities**:
- Fetch dashboard data on mount
- Manage loading and error states
- Distribute data to child components
- Handle navigation actions

#### 2. Clinical Intake Queue (`frontend/src/components/dashboard/ClinicalIntakeQueue.tsx`)

**Purpose**: Display patients needing clinical profile completion

**Props Interface**:
```typescript
interface ClinicalIntakeQueueProps {
  patients: PendingIntakePatient[]
  onCompleteProfile: (patientId: string) => void
}

interface PendingIntakePatient {
  id: string
  full_name: string
  registered_at: string
}
```

**UI Structure**:
- Card container with header
- List of patient items (max 5)
- Each item: name, registration date, action button
- Empty state when no patients

#### 3. Needs Attention Card (`frontend/src/components/dashboard/NeedsAttentionCard.tsx`)

**Purpose**: Highlight patients requiring follow-up

**Props Interface**:
```typescript
interface NeedsAttentionCardProps {
  count: number
  onClick: () => void
}
```

**UI Structure**:
- Clickable Card component
- Large count display
- Warning icon
- Descriptive text
- Hover effects

#### 4. Patient Search Bar (`frontend/src/components/dashboard/PatientSearchBar.tsx`)

**Purpose**: Quick patient lookup

**Props Interface**:
```typescript
interface PatientSearchBarProps {
  onSearch: (query: string) => void
}
```

**UI Structure**:
- Input component with search icon
- Submit handler
- Keyboard shortcuts (Enter key)
- Clear button

#### 5. Stat Card (`frontend/src/components/dashboard/StatCard.tsx`)

**Purpose**: Generic metric display component

**Props Interface**:
```typescript
interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
}
```

**UI Structure**:
- Card container
- Icon (optional)
- Title text
- Large value display
- Color variants

#### 6. Weekly Sessions Chart (`frontend/src/components/dashboard/WeeklySessionsChart.tsx`)

**Purpose**: Visualize session activity

**Props Interface**:
```typescript
interface WeeklySessionsChartProps {
  sessions: WeeklySession[]
}

interface WeeklySession {
  day: string  // "Mon", "Tue", etc.
  count: number
}
```

**UI Structure**:
- Card container with header
- Simple bar chart (CSS-based or minimal SVG)
- Day labels
- Count labels
- Responsive design

## Data Models

### Backend Response Schema

```typescript
// GET /api/v1/dashboard/stats Response
{
  "status": "success",
  "data": {
    "pending_intake_patients": [
      {
        "id": "uuid-string",
        "full_name": "Priya Sharma",
        "registered_at": "2024-10-18T10:30:00Z"
      }
    ],
    "needs_attention_patients_count": 2,
    "pending_reports_count": 3,
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

### Database Queries

#### Query 1: Pending Intake Patients
```sql
SELECT id, name as full_name, created_at as registered_at
FROM patients
WHERE profile_status = 'DEMOGRAPHICS_ONLY'
  AND created_by = :doctor_id
ORDER BY created_at DESC
LIMIT 5
```

**Model**: `IntakePatient`
**Indexes Used**: `created_by`, `profile_status`

#### Query 2: Needs Attention Count
```sql
WITH latest_reports AS (
  SELECT DISTINCT ON (cs.patient_id)
    cs.patient_id,
    r.patient_status
  FROM reports r
  JOIN consultation_sessions cs ON r.session_id = cs.id
  JOIN patients p ON cs.patient_id = p.id
  WHERE p.created_by = :doctor_id
    AND r.patient_status IS NOT NULL
  ORDER BY cs.patient_id, r.created_at DESC
)
SELECT COUNT(*)
FROM latest_reports
WHERE patient_status = 'worse'
```

**Models**: `Report`, `ConsultationSession`, `IntakePatient`
**Indexes Used**: `session_id`, `patient_id`, `created_by`

#### Query 3: Pending Reports Count
```sql
SELECT COUNT(*)
FROM reports r
JOIN consultation_sessions cs ON r.session_id = cs.id
JOIN patients p ON cs.patient_id = p.id
WHERE r.status = 'completed'
  AND p.created_by = :doctor_id
```

**Models**: `Report`, `ConsultationSession`, `IntakePatient`
**Indexes Used**: `status`, `session_id`, `created_by`

#### Query 4: Active Patients Count
```sql
SELECT COUNT(*)
FROM patients
WHERE profile_status = 'CLINICAL_INFO_COMPLETE'
  AND created_by = :doctor_id
```

**Model**: `IntakePatient`
**Indexes Used**: `profile_status`, `created_by`

#### Query 5: Weekly Sessions
```sql
SELECT
  EXTRACT(DOW FROM started_at) as day_of_week,
  COUNT(*) as count
FROM consultation_sessions cs
JOIN patients p ON cs.patient_id = p.id
WHERE p.created_by = :doctor_id
  AND started_at >= NOW() - INTERVAL '7 days'
GROUP BY day_of_week
ORDER BY day_of_week
```

**Models**: `ConsultationSession`, `IntakePatient`
**Indexes Used**: `started_at`, `patient_id`, `created_by`

## Error Handling

### Backend Error Handling

**Strategy**: Graceful degradation with partial data

```python
@router.get("/stats")
async def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user_id: str = Depends(get_current_user_id)
):
    try:
        # Initialize response with defaults
        response_data = {
            "pending_intake_patients": [],
            "needs_attention_patients_count": 0,
            "pending_reports_count": 0,
            "active_patients_count": 0,
            "sessions_this_week": []
        }
        
        # Execute queries with individual error handling
        try:
            response_data["pending_intake_patients"] = _get_pending_intake_patients(db, current_user_id)
        except Exception as e:
            logger.error(f"Failed to fetch pending intake patients: {e}")
        
        # ... similar for other queries
        
        return {"status": "success", "data": response_data}
        
    except Exception as e:
        logger.error(f"Dashboard stats error: {e}")
        raise HTTPException(status_code=500, detail="Failed to load dashboard data")
```

**Error Scenarios**:
1. **Database Connection Failure**: Return 500 with error message
2. **Individual Query Failure**: Log error, return default value for that metric
3. **Authentication Failure**: Return 401 (handled by middleware)
4. **No Data**: Return empty arrays/zero counts (valid state)

### Frontend Error Handling

**Strategy**: User-friendly messages with retry options

```typescript
const [error, setError] = useState<string | null>(null)
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getDashboardStats()
      setDashboardData(response.data)
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
      console.error('Dashboard error:', err)
    } finally {
      setIsLoading(false)
    }
  }
  
  fetchDashboardData()
}, [])
```

**Error States**:
1. **Loading State**: Show skeleton loaders
2. **Error State**: Display error message with retry button
3. **Empty State**: Show "No data available" messages
4. **Partial Data**: Render available sections, hide failed sections

## Testing Strategy

### Backend Testing

#### Unit Tests (`backend/tests/test_dashboard.py`)

**Test Cases**:
1. `test_get_dashboard_stats_success`: Verify complete response structure
2. `test_pending_intake_patients_query`: Validate patient filtering
3. `test_needs_attention_count_logic`: Verify "worse" status counting
4. `test_pending_reports_count`: Validate report status filtering
5. `test_active_patients_count`: Verify profile status filtering
6. `test_weekly_sessions_grouping`: Validate day grouping logic
7. `test_authentication_required`: Verify auth middleware
8. `test_doctor_data_isolation`: Ensure doctors only see their data
9. `test_empty_data_handling`: Verify graceful handling of no data
10. `test_partial_query_failure`: Verify graceful degradation

**Test Data Setup**:
```python
@pytest.fixture
def test_doctor(db):
    return create_test_user(db, role="doctor")

@pytest.fixture
def test_patients(db, test_doctor):
    return [
        create_test_patient(db, doctor_id=test_doctor.id, profile_status="DEMOGRAPHICS_ONLY"),
        create_test_patient(db, doctor_id=test_doctor.id, profile_status="CLINICAL_INFO_COMPLETE"),
    ]

@pytest.fixture
def test_reports(db, test_patients):
    return [
        create_test_report(db, patient_id=test_patients[0].id, patient_status="worse"),
        create_test_report(db, patient_id=test_patients[1].id, patient_status="improving"),
    ]
```

#### Integration Tests

**Test Cases**:
1. `test_dashboard_endpoint_integration`: Full API call with database
2. `test_concurrent_requests`: Verify thread safety
3. `test_large_dataset_performance`: Verify query performance with 1000+ patients
4. `test_cross_doctor_data_isolation`: Verify no data leakage

### Frontend Testing

#### Component Tests (`frontend/src/components/dashboard/__tests__/`)

**Test Cases**:
1. `ClinicalIntakeQueue.test.tsx`:
   - Renders patient list correctly
   - Handles empty state
   - Triggers navigation on button click
   - Displays formatted dates

2. `NeedsAttentionCard.test.tsx`:
   - Displays count correctly
   - Handles click events
   - Shows appropriate styling for count > 0

3. `PatientSearchBar.test.tsx`:
   - Handles input changes
   - Submits on Enter key
   - Calls onSearch with correct query

4. `StatCard.test.tsx`:
   - Renders title and value
   - Applies variant styles
   - Displays icon when provided

5. `WeeklySessionsChart.test.tsx`:
   - Renders all 7 days
   - Displays correct counts
   - Handles zero counts

#### Integration Tests

**Test Cases**:
1. `DashboardPage.test.tsx`:
   - Fetches data on mount
   - Displays loading state
   - Handles API errors
   - Renders all sections with data
   - Navigates correctly on actions

### Manual Testing Checklist

**Functional Testing**:
- [ ] Dashboard loads without errors
- [ ] All metrics display correct values
- [ ] Clinical intake queue shows pending patients
- [ ] Needs attention card navigates to filtered patients page
- [ ] Patient search navigates with query parameter
- [ ] Start unscheduled session opens modal
- [ ] Review pending reports navigates with filter
- [ ] Weekly chart displays session data
- [ ] Empty states display appropriately

**Performance Testing**:
- [ ] Dashboard loads in < 2 seconds
- [ ] API response time < 500ms
- [ ] No layout shift during load
- [ ] Smooth animations and transitions

**Responsive Testing**:
- [ ] Mobile view (320px - 768px)
- [ ] Tablet view (768px - 1024px)
- [ ] Desktop view (1024px+)
- [ ] All components adapt correctly

**Accessibility Testing**:
- [ ] Keyboard navigation works
- [ ] Screen reader announces sections
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible

## Implementation Phases

### Phase 1: Backend Implementation (Estimated: 4 hours)

**Tasks**:
1. Create `dashboard.py` endpoint file
2. Implement helper query functions
3. Implement main stats endpoint
4. Add router registration
5. Write unit tests
6. Test with Postman/curl

**Deliverables**:
- Working `/api/v1/dashboard/stats` endpoint
- Unit test coverage > 80%
- API documentation

### Phase 2: Frontend Components (Estimated: 6 hours)

**Tasks**:
1. Create component files
2. Implement ClinicalIntakeQueue
3. Implement NeedsAttentionCard
4. Implement PatientSearchBar
5. Implement StatCard
6. Implement WeeklySessionsChart
7. Write component tests

**Deliverables**:
- 6 new reusable components
- Component test coverage > 80%
- Storybook stories (optional)

### Phase 3: Dashboard Integration (Estimated: 4 hours)

**Tasks**:
1. Refactor dashboard page
2. Integrate API service call
3. Wire up components
4. Implement error handling
5. Add loading states
6. Test navigation flows

**Deliverables**:
- Fully functional dashboard
- Integration tests
- User acceptance testing

### Phase 4: Polish and Optimization (Estimated: 2 hours)

**Tasks**:
1. Performance optimization
2. Accessibility improvements
3. Responsive design refinement
4. Documentation updates
5. Code review and cleanup

**Deliverables**:
- Performance metrics report
- Accessibility audit results
- Updated documentation

## Design Decisions and Rationales

### Decision 1: Single Consolidated Endpoint

**Rationale**: 
- Reduces network overhead (1 request vs 5)
- Simplifies frontend state management
- Enables backend query optimization
- Atomic data consistency

**Trade-offs**:
- Larger response payload
- All-or-nothing error handling (mitigated by graceful degradation)

### Decision 2: CSS-Based Chart vs Library

**Rationale**:
- Minimal dependencies
- Faster load time
- Sufficient for simple bar chart
- Full control over styling

**Trade-offs**:
- Limited chart types
- Manual implementation effort
- Less feature-rich

**Alternative Considered**: Recharts library (rejected due to bundle size)

### Decision 3: Component Composition

**Rationale**:
- Reusable components
- Easier testing
- Clear separation of concerns
- Maintainable codebase

**Trade-offs**:
- More files to manage
- Slightly more complex prop drilling

### Decision 4: Profile Status Field

**Rationale**:
- Existing field in IntakePatient model
- Indexed for performance
- Clear semantic meaning
- No schema changes required

**Alternative Considered**: Separate intake tracking table (rejected as over-engineering)

### Decision 5: Weekly Sessions Grouping

**Rationale**:
- 7-day window provides actionable insights
- Day-of-week grouping shows patterns
- Manageable data size for visualization

**Alternative Considered**: Monthly view (rejected as too broad for daily workflow)

## Security Considerations

### Authentication and Authorization

**Requirements**:
- All endpoints require valid JWT token
- Doctor can only access their own data
- No cross-doctor data leakage

**Implementation**:
```python
current_user_id: str = Depends(get_current_user_id)
```

**Verification**:
- All queries filter by `doctor_id` or `created_by`
- Integration tests verify data isolation

### Data Privacy

**Considerations**:
- Patient names displayed (necessary for workflow)
- No sensitive medical data in dashboard
- Encrypted fields remain encrypted
- Audit logging for access

### API Security

**Protections**:
- Rate limiting (existing middleware)
- Input validation (FastAPI schemas)
- SQL injection prevention (ORM)
- CORS configuration (existing)

## Performance Optimization

### Database Optimization

**Strategies**:
1. **Index Usage**: Leverage existing indexes on `created_by`, `profile_status`, `status`, `started_at`
2. **Query Limits**: Limit intake queue to 5 patients
3. **Efficient Joins**: Use INNER JOIN where possible
4. **Subquery Optimization**: Use CTEs for complex queries

**Expected Performance**:
- Query execution: < 100ms per query
- Total endpoint response: < 500ms
- Scales to 10,000+ patients per doctor

### Frontend Optimization

**Strategies**:
1. **Code Splitting**: Dashboard components lazy-loaded
2. **Memoization**: Use React.memo for static components
3. **Debouncing**: Search input debounced (300ms)
4. **Skeleton Loaders**: Improve perceived performance

**Expected Performance**:
- Initial load: < 2 seconds
- Time to interactive: < 3 seconds
- Lighthouse score: > 90

### Caching Strategy

**Backend Caching** (Future Enhancement):
```python
@cache(expire=60)  # Cache for 1 minute
async def get_dashboard_stats(...):
    ...
```

**Frontend Caching**:
- React Query for automatic cache management
- Stale-while-revalidate pattern
- Cache invalidation on mutations

## Monitoring and Observability

### Logging

**Backend Logging**:
```python
logger.info(f"Dashboard stats requested by doctor {current_user_id}")
logger.error(f"Query failed: {query_name}", exc_info=True)
```

**Log Levels**:
- INFO: Successful requests
- WARNING: Partial failures
- ERROR: Complete failures

### Metrics

**Key Metrics**:
1. Dashboard load time (p50, p95, p99)
2. API response time
3. Error rate
4. Cache hit rate (if implemented)

**Monitoring Tools**:
- Backend: Application logs, APM
- Frontend: Browser performance API, error tracking

### Alerts

**Alert Conditions**:
1. Error rate > 5% for 5 minutes
2. Response time > 1 second for 5 minutes
3. Dashboard load failures > 10 in 1 minute

## Migration and Rollout

### Deployment Strategy

**Approach**: Blue-Green Deployment

**Steps**:
1. Deploy backend changes to staging
2. Run integration tests
3. Deploy frontend changes to staging
4. User acceptance testing
5. Deploy to production (backend first)
6. Monitor for errors
7. Deploy frontend to production
8. Monitor dashboard usage

### Rollback Plan

**Triggers**:
- Error rate > 10%
- Critical bug discovered
- Performance degradation

**Rollback Steps**:
1. Revert frontend deployment
2. Verify old dashboard works
3. Investigate and fix issues
4. Redeploy when ready

### Feature Flags

**Implementation**:
```typescript
const useNewDashboard = featureFlags.isEnabled('new-dashboard')

return useNewDashboard ? <NewDashboard /> : <OldDashboard />
```

**Benefits**:
- Gradual rollout
- A/B testing capability
- Quick disable if issues arise

## Future Enhancements

### Phase 2 Features (Post-MVP)

1. **Real-time Updates**: WebSocket for live dashboard updates
2. **Customizable Widgets**: Drag-and-drop dashboard customization
3. **Advanced Analytics**: Trend analysis, predictive insights
4. **Export Functionality**: PDF/CSV export of dashboard data
5. **Notifications**: In-app notifications for urgent items
6. **Mobile App**: Native mobile dashboard experience

### Technical Debt

**Known Limitations**:
1. No caching implemented (acceptable for MVP)
2. Simple chart implementation (sufficient for current needs)
3. No real-time updates (polling could be added)
4. Limited error recovery (graceful degradation sufficient)

**Future Improvements**:
1. Implement Redis caching
2. Add WebSocket support
3. Upgrade to advanced charting library
4. Implement retry logic with exponential backoff
