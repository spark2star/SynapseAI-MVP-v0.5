# Implementation Plan

## Backend Implementation

- [x] 1. Create dashboard analytics endpoint
  - Create new file `backend/app/api/api_v1/endpoints/dashboard.py`
  - Set up FastAPI router with authentication dependency
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.1 Implement pending intake patients query
  - Write helper function `_get_pending_intake_patients(db, doctor_id)`
  - Query IntakePatient model where profile_status = 'DEMOGRAPHICS_ONLY'
  - Filter by doctor's created_by field
  - Order by created_at DESC and limit to 5 results
  - Return list with id, full_name, and registered_at fields
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 1.2 Implement needs attention patients count query
  - Write helper function `_get_needs_attention_count(db, doctor_id)`
  - Join Report, ConsultationSession, and IntakePatient models
  - Use subquery or window function to get latest report per patient
  - Filter for patient_status = 'worse' in latest reports
  - Return integer count
  - _Requirements: 2.1, 2.2_

- [x] 1.3 Implement pending reports count query
  - Write helper function `_get_pending_reports_count(db, doctor_id)`
  - Query Report model where status = 'completed'
  - Join with ConsultationSession and IntakePatient to filter by doctor
  - Return integer count
  - _Requirements: 3.1_

- [x] 1.4 Implement active patients count query
  - Write helper function `_get_active_patients_count(db, doctor_id)`
  - Query IntakePatient model where profile_status = 'CLINICAL_INFO_COMPLETE'
  - Filter by doctor's created_by field
  - Return integer count
  - _Requirements: 4.1, 4.2_

- [x] 1.5 Implement weekly sessions query
  - Write helper function `_get_weekly_sessions(db, doctor_id)`
  - Query ConsultationSession model where started_at is within last 7 days
  - Join with IntakePatient to filter by doctor
  - Group results by day of week using date extraction
  - Map day numbers to abbreviated names (Mon, Tue, Wed, etc.)
  - Return list of objects with day and count fields
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 1.6 Implement main dashboard stats endpoint
  - Create GET endpoint `/stats` with authentication
  - Call all helper functions with error handling for each
  - Initialize response with default values (empty arrays, zero counts)
  - Wrap each helper call in try-except to enable graceful degradation
  - Consolidate results into single JSON response matching schema
  - Add logging for successful requests and errors
  - Return 200 with data or 500 on complete failure
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 1.7 Register dashboard router in main API
  - Open `backend/app/api/api_v1/api.py`
  - Import dashboard router
  - Add `api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])`
  - Verify router is registered correctly
  - _Requirements: 8.1_

- [x] 1.8 Write backend unit tests
  - Create `backend/tests/test_dashboard.py`
  - Write test fixtures for test doctor, patients, reports, and sessions
  - Test each helper function independently with various data scenarios
  - Test main endpoint with complete data set
  - Test authentication requirement
  - Test doctor data isolation (no cross-doctor data leakage)
  - Test empty data handling
  - Test partial query failure and graceful degradation
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Frontend Component Implementation

- [x] 2. Create dashboard component files
  - Create directory `frontend/src/components/dashboard/`
  - Create component files: ClinicalIntakeQueue.tsx, NeedsAttentionCard.tsx, PatientSearchBar.tsx, StatCard.tsx, WeeklySessionsChart.tsx
  - Set up TypeScript interfaces for props in each file
  - _Requirements: 9.1, 10.1, 10.2_

- [x] 2.1 Implement ClinicalIntakeQueue component
  - Define PendingIntakePatient and ClinicalIntakeQueueProps interfaces
  - Use Card component from ui library as container
  - Map over patients array to render list items
  - Display patient full_name and format registered_at as readable date
  - Add "Complete Profile" Button for each patient
  - Implement onClick handler to navigate to `/dashboard/patients/${patientId}/clinical-info`
  - Handle empty state with message "No pending intake patients"
  - Apply consistent styling with existing design system
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2.2 Implement NeedsAttentionCard component
  - Define NeedsAttentionCardProps interface with count and onClick
  - Use Card component with hoverable prop
  - Display count prominently with large font
  - Add warning icon from heroicons
  - Add descriptive text "Patients need follow-up"
  - Implement onClick to navigate to `/dashboard/patients?filter=needs_attention`
  - Apply warning color variant styling
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2.3 Implement PatientSearchBar component
  - Define PatientSearchBarProps interface with onSearch callback
  - Use Input component from ui library
  - Add search icon as leftIcon prop
  - Implement controlled input with useState
  - Handle form submission on Enter key
  - Call onSearch callback with trimmed query value
  - Add clear button to reset input
  - Apply consistent styling
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2.4 Implement StatCard component
  - Define StatCardProps interface with title, value, icon, and variant
  - Use Card component as container
  - Display optional icon in colored circle
  - Display title text with medium font weight
  - Display value with large bold font
  - Support variant prop for different color schemes (default, success, warning, info)
  - Apply responsive design for mobile and desktop
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2.5 Implement WeeklySessionsChart component
  - Define WeeklySession and WeeklySessionsChartProps interfaces
  - Use Card component as container with header "Weekly Sessions"
  - Calculate max count for scaling bar heights
  - Render 7 bars using CSS flexbox or simple SVG
  - Display day labels below each bar
  - Display count value above or inside each bar
  - Apply gradient or solid color to bars
  - Handle zero counts gracefully
  - Ensure responsive design
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [ ]* 2.6 Write component unit tests
  - Create test files in `frontend/src/components/dashboard/__tests__/`
  - Test ClinicalIntakeQueue renders patients and handles empty state
  - Test NeedsAttentionCard displays count and handles clicks
  - Test PatientSearchBar handles input and submission
  - Test StatCard renders title, value, and icon correctly
  - Test WeeklySessionsChart renders all days and counts
  - Use React Testing Library for all tests
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 4.1, 4.2, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2_

## Dashboard Page Integration

- [x] 3. Refactor dashboard page layout
  - Open `frontend/src/app/dashboard/page.tsx`
  - Remove existing dashboard content (keep header)
  - Create three main section divs: "Immediate Priorities", "Core Actions", "Practice Insights"
  - Apply semantic HTML structure with section tags
  - Add section headers with appropriate styling
  - Apply responsive grid layout using Tailwind CSS
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 10.5_

- [x] 3.1 Implement dashboard data fetching
  - Define DashboardData interface matching backend response schema
  - Add state variables for dashboardData, isLoading, and error
  - Create useEffect hook to fetch data on component mount
  - Call new API endpoint `/api/v1/dashboard/stats` using apiService
  - Handle loading state with skeleton loaders or spinner
  - Handle error state with error message and retry button
  - Update state with fetched data on success
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3.2 Integrate Immediate Priorities section
  - Add ClinicalIntakeQueue component with pending_intake_patients data
  - Implement onCompleteProfile handler to navigate to clinical info form
  - Add NeedsAttentionCard component with needs_attention_patients_count
  - Implement onClick handler to navigate to patients page with filter
  - Apply grid layout for side-by-side display on desktop
  - Ensure responsive stacking on mobile
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 9.2_

- [x] 3.3 Integrate Core Actions section
  - Add PatientSearchBar component
  - Implement onSearch handler to navigate to `/dashboard/patients?search=${query}`
  - Add "Start Unscheduled Session" Button
  - Implement onClick to open existing PatientSelectionModal
  - Add "Review Pending Reports" Button with Badge showing pending_reports_count
  - Implement onClick to navigate to `/dashboard/reports?filter=pending_review`
  - Apply grid layout for action cards
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 9.3_

- [x] 3.4 Integrate Practice Insights section
  - Add StatCard component for active patients count
  - Pass active_patients_count as value prop
  - Add appropriate icon (UserGroupIcon)
  - Add WeeklySessionsChart component with sessions_this_week data
  - Apply grid layout with StatCard taking 1/3 width and chart taking 2/3 width
  - Ensure responsive stacking on mobile
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 9.4_

- [x] 3.5 Add loading and error states
  - Create LoadingState component with skeleton loaders for each section
  - Create ErrorState component with error message and retry button
  - Conditionally render LoadingState when isLoading is true
  - Conditionally render ErrorState when error is not null
  - Implement retry functionality to re-fetch dashboard data
  - Ensure smooth transitions between states
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 3.6 Write integration tests
  - Create `frontend/src/app/dashboard/__tests__/page.test.tsx`
  - Mock API service to return test data
  - Test dashboard fetches data on mount
  - Test loading state displays correctly
  - Test error state displays and retry works
  - Test all sections render with data
  - Test navigation handlers work correctly
  - Test PatientSelectionModal opens on button click
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

## API Service Integration

- [x] 4. Add dashboard API method
  - Open `frontend/src/services/api.ts` or equivalent API service file
  - Add `getDashboardStats()` method
  - Implement GET request to `/api/v1/dashboard/stats`
  - Include authentication headers
  - Return typed response matching DashboardData interface
  - Handle network errors appropriately
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

## Testing and Quality Assurance

- [x] 5. Manual testing and validation
  - Test dashboard loads without errors in development environment
  - Verify all metrics display correct values from database
  - Test clinical intake queue shows correct pending patients
  - Test needs attention card navigates to filtered patients page
  - Test patient search navigates with query parameter
  - Test start unscheduled session opens modal correctly
  - Test review pending reports navigates with filter
  - Test weekly chart displays session data accurately
  - Verify empty states display when no data available
  - Test error handling by simulating API failures
  - _Requirements: 1.1, 2.1, 3.1, 4.1, 5.1, 6.1, 7.1, 8.1, 9.1_

- [x] 5.1 Responsive design testing
  - Test mobile view (320px - 768px width)
  - Test tablet view (768px - 1024px width)
  - Test desktop view (1024px+ width)
  - Verify all components adapt correctly to screen sizes
  - Test touch interactions on mobile devices
  - Verify no horizontal scrolling on small screens
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 10.4, 10.5_

- [x] 5.2 Performance testing
  - Measure dashboard initial load time (target < 2 seconds)
  - Measure API response time (target < 500ms)
  - Test with large datasets (1000+ patients)
  - Verify no memory leaks during navigation
  - Check bundle size impact of new components
  - Run Lighthouse audit (target score > 90)
  - _Requirements: 8.5_

- [ ]* 5.3 Accessibility testing
  - Test keyboard navigation through all interactive elements
  - Verify screen reader announces sections and content correctly
  - Check color contrast ratios meet WCAG AA standards
  - Verify focus indicators are visible on all interactive elements
  - Test with browser zoom at 200%
  - Validate semantic HTML structure
  - _Requirements: 9.5, 10.1, 10.2, 10.3, 10.4, 10.5_

## Documentation and Deployment

- [x] 6. Update documentation
  - Document new dashboard endpoint in API documentation
  - Add JSDoc comments to all new components
  - Update README with dashboard feature description
  - Create user guide for new dashboard features
  - Document any configuration changes required
  - _Requirements: 8.1, 9.1_

- [ ]* 6.1 Prepare deployment
  - Review all code changes for security issues
  - Ensure all tests pass in CI/CD pipeline
  - Create database migration scripts if needed
  - Update environment variables documentation
  - Prepare rollback plan
  - Schedule deployment window
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ]* 6.2 Deploy to staging environment
  - Deploy backend changes to staging
  - Run smoke tests on staging
  - Deploy frontend changes to staging
  - Conduct user acceptance testing
  - Gather feedback from stakeholders
  - Fix any issues discovered
  - _Requirements: 8.1, 9.1_

- [ ]* 6.3 Deploy to production
  - Deploy backend changes to production
  - Monitor error rates and performance metrics
  - Deploy frontend changes to production
  - Monitor dashboard usage and errors
  - Verify all features work in production
  - Communicate launch to users
  - _Requirements: 8.1, 9.1_
