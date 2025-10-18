# Dashboard Redesign - Manual Testing Checklist

**Test Date:** _____________  
**Tester:** _____________  
**Environment:** Development (localhost:3001)  
**Backend:** localhost:8080

---

## Prerequisites
- [ ] Backend server running on port 8080
- [ ] Frontend server running on port 3001
- [ ] Valid doctor account credentials available
- [ ] Test data populated in database

---

## Test 1: Dashboard Loads Without Errors

### Steps:
1. Navigate to http://localhost:3001/dashboard
2. Login with doctor credentials
3. Observe dashboard loading

### Expected Results:
- [ ] Dashboard displays loading skeleton initially
- [ ] No console errors in browser DevTools
- [ ] Dashboard loads within 2 seconds
- [ ] All sections render properly
- [ ] No visual glitches or layout issues

### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

## Test 2: Metrics Display Correct Values

### Steps:
1. Open browser DevTools Network tab
2. Refresh dashboard page
3. Check API response for `/api/v1/dashboard/stats`
4. Compare displayed values with API response

### Expected Results:
- [ ] Active Patients count matches API response
- [ ] Pending intake patients list matches API data
- [ ] Needs attention count matches API data
- [ ] Pending reports count matches API data
- [ ] Weekly sessions chart displays correct data

### API Response Data:
```json
{
  "active_patients_count": ___,
  "pending_intake_patients": [___],
  "needs_attention_patients_count": ___,
  "pending_reports_count": ___,
  "sessions_this_week": [___]
}
```

### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

## Test 3: Clinical Intake Queue

### Steps:
1. Locate "Immediate Priorities" section
2. Find "Clinical Intake Queue" card
3. Verify patient list display
4. Click "Complete Profile" on a patient

### Expected Results:
- [ ] Queue shows up to 5 pending patients
- [ ] Each patient shows: name, registration date
- [ ] "Complete Profile" button is visible
- [ ] Clicking button navigates to `/dashboard/patients/{id}/clinical-info`
- [ ] Empty state shows when no pending patients

### Actual Results:
```
Status: ___________
Navigation URL: _____________________________________________
Notes: _____________________________________________
```

---

## Test 4: Needs Attention Card

### Steps:
1. Locate "Needs Attention" card in Immediate Priorities
2. Note the count displayed
3. Click anywhere on the card

### Expected Results:
- [ ] Card displays count of patients needing attention
- [ ] Card is clickable (shows hover effect)
- [ ] Clicking navigates to `/dashboard/patients?filter=needs_attention`
- [ ] URL parameter is correctly set

### Actual Results:
```
Status: ___________
Navigation URL: _____________________________________________
Count Displayed: ___
Notes: _____________________________________________
```

---

## Test 5: Patient Search

### Steps:
1. Locate "Find Patient" search bar in Core Actions
2. Type a patient name (e.g., "John")
3. Press Enter or click search

### Expected Results:
- [ ] Search input accepts text
- [ ] Pressing Enter triggers search
- [ ] Navigates to `/dashboard/patients?search={query}`
- [ ] Query parameter is URL encoded

### Test Cases:
- [ ] Simple name: "John" → `/dashboard/patients?search=John`
- [ ] Name with space: "John Doe" → `/dashboard/patients?search=John%20Doe`
- [ ] Special characters handled properly

### Actual Results:
```
Status: ___________
Navigation URL: _____________________________________________
Notes: _____________________________________________
```

---

## Test 6: Start Unscheduled Session

### Steps:
1. Locate "Start Unscheduled Session" card in Core Actions
2. Click the card
3. Observe modal behavior

### Expected Results:
- [ ] Card shows hover effect on mouse over
- [ ] Clicking opens PatientSelectionModal
- [ ] Modal displays list of patients
- [ ] Modal has close button
- [ ] Selecting patient navigates to `/dashboard/patients/{id}?followup=true`

### Actual Results:
```
Status: ___________
Modal Opens: ___________
Navigation URL: _____________________________________________
Notes: _____________________________________________
```

---

## Test 7: Review Pending Reports

### Steps:
1. Locate "Review Pending Reports" card in Core Actions
2. Note the badge count (if any)
3. Click the card

### Expected Results:
- [ ] Card shows hover effect
- [ ] Badge displays count when > 0
- [ ] Badge hidden when count = 0
- [ ] Clicking navigates to `/dashboard/reports?filter=pending_review`
- [ ] URL parameter is correctly set

### Actual Results:
```
Status: ___________
Badge Count: ___
Navigation URL: _____________________________________________
Notes: _____________________________________________
```

---

## Test 8: Weekly Sessions Chart

### Steps:
1. Locate "Practice Insights" section
2. Find "Weekly Sessions Chart"
3. Verify chart display

### Expected Results:
- [ ] Chart displays 7 days (Mon-Sun)
- [ ] Each day shows session count
- [ ] Bars are proportional to counts
- [ ] Chart is visually clear and readable
- [ ] Hover shows exact values (if implemented)

### Chart Data:
```
Mon: ___ | Tue: ___ | Wed: ___ | Thu: ___ | Fri: ___ | Sat: ___ | Sun: ___
```

### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

## Test 9: Empty States

### Steps:
1. Test with account that has no data
2. Verify empty state displays

### Expected Results:
- [ ] Pending intake queue shows "No pending patients" message
- [ ] Needs attention shows 0 count
- [ ] Weekly chart shows all zeros (valid state)
- [ ] No errors or crashes with empty data

### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

## Test 10: Error Handling - API Failure

### Steps:
1. Open browser DevTools
2. Go to Network tab
3. Block or throttle network
4. Refresh dashboard
5. Observe error handling

### Expected Results:
- [ ] Error state component displays
- [ ] Error message is user-friendly
- [ ] "Retry" button is available
- [ ] Clicking retry attempts to reload data
- [ ] No console errors that crash the app

### Actual Results:
```
Status: ___________
Error Message: _____________________________________________
Notes: _____________________________________________
```

---

## Test 11: Error Handling - Invalid Token

### Steps:
1. Open browser DevTools → Application → Local Storage
2. Modify or delete auth token
3. Refresh dashboard

### Expected Results:
- [ ] Redirects to login page
- [ ] Or shows authentication error
- [ ] No sensitive data exposed
- [ ] Graceful error handling

### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

## Subtask 5.1: Responsive Design Testing

### Mobile View (320px - 768px)

#### Steps:
1. Open DevTools → Toggle device toolbar
2. Set viewport to 375px width (iPhone)
3. Navigate through dashboard

#### Expected Results:
- [ ] All content visible without horizontal scroll
- [ ] Cards stack vertically
- [ ] Text is readable (not too small)
- [ ] Buttons are touch-friendly (min 44px)
- [ ] Header adapts to mobile layout
- [ ] Search bar is usable
- [ ] Charts are responsive

#### Test Devices:
- [ ] iPhone SE (375x667)
- [ ] iPhone 12 Pro (390x844)
- [ ] Samsung Galaxy S20 (360x800)

#### Actual Results:
```
Status: ___________
Issues Found: _____________________________________________
```

---

### Tablet View (768px - 1024px)

#### Steps:
1. Set viewport to 768px width (iPad)
2. Test in both portrait and landscape

#### Expected Results:
- [ ] Grid layouts adapt appropriately
- [ ] 2-column layouts where appropriate
- [ ] No awkward spacing or gaps
- [ ] Touch targets remain accessible
- [ ] Charts scale properly

#### Test Devices:
- [ ] iPad (768x1024)
- [ ] iPad Pro (1024x1366)

#### Actual Results:
```
Status: ___________
Issues Found: _____________________________________________
```

---

### Desktop View (1024px+)

#### Steps:
1. Test at 1024px, 1440px, and 1920px widths
2. Verify optimal layout

#### Expected Results:
- [ ] Full 3-column grid in Core Actions
- [ ] 2-column layout in Immediate Priorities
- [ ] Proper spacing and alignment
- [ ] No excessive whitespace
- [ ] Content doesn't stretch too wide

#### Test Resolutions:
- [ ] 1024x768
- [ ] 1440x900
- [ ] 1920x1080

#### Actual Results:
```
Status: ___________
Issues Found: _____________________________________________
```

---

### Touch Interactions (Mobile)

#### Steps:
1. Use actual mobile device or touch simulation
2. Test all interactive elements

#### Expected Results:
- [ ] Cards respond to touch
- [ ] No accidental double-taps
- [ ] Smooth scrolling
- [ ] Modal opens/closes properly
- [ ] Search input works with mobile keyboard

#### Actual Results:
```
Status: ___________
Issues Found: _____________________________________________
```

---

## Subtask 5.2: Performance Testing

### Initial Load Time

#### Steps:
1. Open DevTools → Network tab
2. Clear cache
3. Refresh dashboard
4. Note load time

#### Expected Results:
- [ ] Initial load < 2 seconds
- [ ] Time to First Contentful Paint < 1 second
- [ ] Time to Interactive < 2 seconds

#### Measurements:
```
Load Time: _______ ms
FCP: _______ ms
TTI: _______ ms
```

#### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

### API Response Time

#### Steps:
1. Open DevTools → Network tab
2. Refresh dashboard
3. Find `/api/v1/dashboard/stats` request
4. Note response time

#### Expected Results:
- [ ] API response < 500ms
- [ ] Consistent response times across multiple requests

#### Measurements:
```
Request 1: _______ ms
Request 2: _______ ms
Request 3: _______ ms
Average: _______ ms
```

#### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

### Large Dataset Testing

#### Steps:
1. Populate database with 1000+ patients
2. Load dashboard
3. Monitor performance

#### Expected Results:
- [ ] Dashboard loads without lag
- [ ] No memory leaks (check DevTools Memory)
- [ ] Smooth interactions
- [ ] API pagination working (if implemented)

#### Measurements:
```
Load Time with Large Dataset: _______ ms
Memory Usage: _______ MB
```

#### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

### Memory Leak Testing

#### Steps:
1. Open DevTools → Memory tab
2. Take heap snapshot
3. Navigate away and back to dashboard 5 times
4. Take another heap snapshot
5. Compare memory usage

#### Expected Results:
- [ ] Memory usage remains stable
- [ ] No significant increase after multiple navigations
- [ ] Detached DOM nodes are minimal

#### Measurements:
```
Initial Memory: _______ MB
After 5 navigations: _______ MB
Increase: _______ MB
```

#### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

### Bundle Size Impact

#### Steps:
1. Run `npm run build` in frontend
2. Check build output for bundle sizes
3. Compare with previous builds

#### Expected Results:
- [ ] Main bundle < 500KB (gzipped)
- [ ] No significant increase from new components
- [ ] Code splitting working properly

#### Measurements:
```
Main Bundle: _______ KB
Dashboard Page: _______ KB
Total: _______ KB
```

#### Actual Results:
```
Status: ___________
Notes: _____________________________________________
```

---

### Lighthouse Audit

#### Steps:
1. Open DevTools → Lighthouse tab
2. Run audit for Desktop
3. Run audit for Mobile
4. Review scores

#### Expected Results:
- [ ] Performance score > 90
- [ ] Accessibility score > 90
- [ ] Best Practices score > 90
- [ ] SEO score > 90

#### Desktop Scores:
```
Performance: _______
Accessibility: _______
Best Practices: _______
SEO: _______
```

#### Mobile Scores:
```
Performance: _______
Accessibility: _______
Best Practices: _______
SEO: _______
```

#### Actual Results:
```
Status: ___________
Issues Found: _____________________________________________
Recommendations: _____________________________________________
```

---

## Summary

### Overall Test Results

**Total Tests:** _______  
**Passed:** _______  
**Failed:** _______  
**Blocked:** _______

### Critical Issues Found:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Minor Issues Found:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Performance Summary:
- Dashboard Load Time: _______ ms
- API Response Time: _______ ms
- Lighthouse Performance Score: _______

### Responsive Design Summary:
- Mobile: _______ (Pass/Fail)
- Tablet: _______ (Pass/Fail)
- Desktop: _______ (Pass/Fail)

### Recommendations:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

### Sign-off:
- [ ] All critical tests passed
- [ ] All requirements verified
- [ ] Ready for production

**Tester Signature:** _____________  
**Date:** _____________
