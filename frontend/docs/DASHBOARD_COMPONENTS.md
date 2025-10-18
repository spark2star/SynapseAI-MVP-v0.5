# Dashboard Components Documentation

## Overview

The dashboard components provide a modular, reusable set of UI elements for the Clinical Command Center. All components follow the existing design system and are built with TypeScript for type safety.

## Component Architecture

```
dashboard/
├── ClinicalIntakeQueue.tsx    # Pending patient intake list
├── NeedsAttentionCard.tsx     # Alert card for patients needing follow-up
├── PatientSearchBar.tsx       # Quick patient search input
├── StatCard.tsx               # Generic metric display card
└── WeeklySessionsChart.tsx    # Session activity visualization
```

## Components

### ClinicalIntakeQueue

Displays a prioritized list of patients who have completed demographic registration but require clinical information completion.

#### Props

```typescript
interface ClinicalIntakeQueueProps {
  patients: PendingIntakePatient[]
  onCompleteProfile?: (patientId: string) => void
}

interface PendingIntakePatient {
  id: string
  full_name: string
  registered_at: string
}
```

#### Usage

```tsx
import ClinicalIntakeQueue from '@/components/dashboard/ClinicalIntakeQueue'

<ClinicalIntakeQueue
  patients={dashboardData.pending_intake_patients}
  onCompleteProfile={(id) => router.push(`/patients/${id}/clinical-info`)}
/>
```

#### Features

- Displays up to 5 most recent patients
- Shows patient name and registration time (formatted as relative time)
- "Complete Profile" button for each patient
- Empty state when no pending patients
- Responsive design for mobile and desktop

#### Styling

- Uses Card component from UI library
- Sky blue color scheme for consistency
- Hover effects on patient items
- Badge showing patient count

---

### NeedsAttentionCard

Displays a prominent alert card showing the count of patients whose most recent report indicates a "worse" patient status.

#### Props

```typescript
interface NeedsAttentionCardProps {
  count: number
  onClick?: () => void
}
```

#### Usage

```tsx
import NeedsAttentionCard from '@/components/dashboard/NeedsAttentionCard'

<NeedsAttentionCard
  count={dashboardData.needs_attention_patients_count}
  onClick={() => router.push('/patients?filter=needs_attention')}
/>
```

#### Features

- Large, prominent count display
- Warning icon and amber color scheme
- Clickable card navigates to filtered patients page
- "View Patients" button appears when count > 0
- Gradient background for visual emphasis

#### Styling

- Amber/orange gradient background
- Warning icon from Heroicons
- Hover effects for interactivity
- Responsive sizing

---

### PatientSearchBar

Provides a search input for quickly finding patients by name, phone, or ID.

#### Props

```typescript
interface PatientSearchBarProps {
  onSearch?: (query: string) => void
}
```

#### Usage

```tsx
import PatientSearchBar from '@/components/dashboard/PatientSearchBar'

<PatientSearchBar
  onSearch={(query) => router.push(`/patients?search=${encodeURIComponent(query)}`)}
/>
```

#### Features

- Search icon on the left
- Clear button (X) on the right when text is entered
- Enter key to submit search
- Trims whitespace from query
- Preserves search query in URL

#### Keyboard Shortcuts

- `Enter` - Submit search
- `Escape` - Clear input (via clear button)

#### Styling

- Uses Input component from UI library
- Search and clear icons from Heroicons
- Consistent with form inputs across the app

---

### StatCard

A reusable card component for displaying key statistics and metrics.

#### Props

```typescript
interface StatCardProps {
  title: string
  value: number | string
  icon?: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'info'
}
```

#### Usage

```tsx
import StatCard from '@/components/dashboard/StatCard'
import { UserGroupIcon } from '@heroicons/react/24/outline'

<StatCard
  title="Active Patients"
  value={dashboardData.active_patients_count}
  icon={<UserGroupIcon />}
  variant="info"
/>
```

#### Variants

| Variant | Color Scheme | Use Case |
|---------|--------------|----------|
| `default` | Sky blue | General metrics |
| `success` | Emerald green | Positive metrics |
| `warning` | Amber/orange | Alerts or warnings |
| `info` | Purple | Informational metrics |

#### Features

- Large, bold value display
- Optional icon with colored background
- Gradient background for value
- Responsive design
- Consistent border styling

#### Styling

- Each variant has unique color scheme
- Icon displayed in colored circle
- Value shown in gradient box
- Title in uppercase with tracking

---

### WeeklySessionsChart

Visualizes consultation session activity over the past 7 days using a simple CSS-based bar chart.

#### Props

```typescript
interface WeeklySessionsChartProps {
  sessions: WeeklySession[]
}

interface WeeklySession {
  day: string  // "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  count: number
}
```

#### Usage

```tsx
import WeeklySessionsChart from '@/components/dashboard/WeeklySessionsChart'

<WeeklySessionsChart
  sessions={dashboardData.sessions_this_week}
/>
```

#### Features

- Simple CSS-based bar chart (no external dependencies)
- Shows all 7 days of the week
- Hover tooltips showing exact count
- Calculates and displays average sessions per day
- Total session count badge
- Responsive design

#### Chart Details

- Bars scale proportionally to max count
- Minimum height for bars with count > 0
- Gradient colors (sky blue)
- Hover effects with tooltips
- Day labels below each bar
- Count labels above bars

#### Styling

- Uses Card component container
- Sky blue gradient for bars
- Hover tooltips with dark background
- Summary section with average calculation

---

## Dashboard Page Integration

The main dashboard page (`frontend/src/app/dashboard/page.tsx`) integrates all components into three sections:

### 1. Immediate Priorities

```tsx
<section>
  <h2>Immediate Priorities</h2>
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <ClinicalIntakeQueue {...} />
    <NeedsAttentionCard {...} />
  </div>
</section>
```

### 2. Core Actions

```tsx
<section>
  <h2>Core Actions</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    <PatientSearchBar {...} />
    <Button onClick={handleStartUnscheduledSession}>
      Start Unscheduled Session
    </Button>
    <Button onClick={handleReviewPendingReports}>
      Review Pending Reports
      <Badge>{pending_reports_count}</Badge>
    </Button>
  </div>
</section>
```

### 3. Practice Insights

```tsx
<section>
  <h2>Practice Insights</h2>
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <StatCard {...} />
    <div className="lg:col-span-2">
      <WeeklySessionsChart {...} />
    </div>
  </div>
</section>
```

## State Management

The dashboard page manages the following state:

```typescript
const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
const [isLoading, setIsLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
const [showPatientSelection, setShowPatientSelection] = useState(false)
```

## Data Fetching

Dashboard data is fetched on component mount:

```typescript
useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await apiService.getDashboardStats()
      setDashboardData(response.data)
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }
  
  fetchDashboardData()
}, [])
```

## Loading States

The dashboard implements skeleton loaders for better perceived performance:

```tsx
function LoadingState() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Skeleton loaders for each section */}
    </div>
  )
}
```

## Error Handling

Error states are displayed with a retry button:

```tsx
function ErrorState({ error, onRetry }) {
  return (
    <div className="flex flex-col items-center">
      <ErrorIcon />
      <h3>Failed to Load Dashboard</h3>
      <p>{error}</p>
      <Button onClick={onRetry}>Retry</Button>
    </div>
  )
}
```

## Responsive Design

All components are fully responsive:

- **Mobile (< 768px)**: Single column layout, stacked components
- **Tablet (768px - 1024px)**: 2-column grid for some sections
- **Desktop (> 1024px)**: Full 3-column grid layout

## Accessibility

All components follow accessibility best practices:

- Semantic HTML structure
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators on interactive elements
- Color contrast meets WCAG AA standards
- Screen reader friendly

## Testing

Component tests are located in `frontend/src/components/dashboard/__tests__/`:

```typescript
// Example test
describe('ClinicalIntakeQueue', () => {
  it('renders patient list correctly', () => {
    render(<ClinicalIntakeQueue patients={mockPatients} />)
    expect(screen.getByText('Priya Sharma')).toBeInTheDocument()
  })
  
  it('handles empty state', () => {
    render(<ClinicalIntakeQueue patients={[]} />)
    expect(screen.getByText('No pending intake patients')).toBeInTheDocument()
  })
})
```

## Performance Optimization

- Components use `React.memo` where appropriate
- Minimal re-renders through proper state management
- Lazy loading for heavy components
- Debounced search input (300ms)

## Design System Consistency

All components follow the existing design system:

- Use Card, Button, Badge, Input from `@/components/ui`
- Follow Tailwind CSS utility patterns
- Consistent color scheme (sky blue primary)
- Glassmorphism effects with backdrop blur
- Dark mode support

## Future Enhancements

Planned improvements:
1. Real-time updates via WebSocket
2. Customizable dashboard widgets
3. Drag-and-drop widget arrangement
4. Export dashboard data to PDF/CSV
5. Advanced filtering options
6. Mobile app version

## Related Documentation

- [API Documentation](../../backend/docs/DASHBOARD_API.md)
- [Design Document](../../.kiro/specs/dashboard-redesign/design.md)
- [Requirements Document](../../.kiro/specs/dashboard-redesign/requirements.md)
- [User Guide](./DASHBOARD_USER_GUIDE.md)
