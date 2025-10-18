# Clinical Command Center - User Guide

## Overview

The Clinical Command Center is your redesigned dashboard that transforms passive data display into an actionable workflow hub. It prioritizes your most important tasks and provides quick access to core clinical actions.

## Dashboard Layout

The dashboard is organized into three priority-based sections:

### 1. Immediate Priorities 🔴

Located at the top of the dashboard, this section highlights tasks requiring immediate attention.

#### Clinical Intake Queue

**What it shows:** Patients who have completed demographic registration but need clinical profile completion.

**How to use:**
1. Review the list of pending patients (up to 5 most recent)
2. See when each patient registered (e.g., "2h ago", "Yesterday")
3. Click "Complete Profile" to navigate to the clinical information form
4. Complete the patient's clinical profile to move them to active status

**Empty state:** When all patients have completed profiles, you'll see "No pending intake patients"

#### Needs Attention Card

**What it shows:** Count of patients whose latest report indicates their condition is worsening.

**How to use:**
1. Check the large number displayed - this is your priority count
2. Click anywhere on the card to view the filtered list of these patients
3. Review each patient's latest report
4. Schedule follow-up appointments or interventions as needed

**Visual cues:** 
- Amber/orange color indicates urgency
- Warning icon emphasizes importance
- "View Patients →" button appears when count > 0

---

### 2. Core Actions 🟢

The middle section provides quick access to your most common workflows.

#### Find Patient

**What it does:** Quickly search for any patient by name, phone, or ID.

**How to use:**
1. Type patient name, phone number, or ID in the search box
2. Press Enter or click the search icon
3. You'll be taken to the patients page with search results
4. Click the X button to clear your search

**Tips:**
- Search is case-insensitive
- Partial matches work (e.g., "Raj" finds "Rajesh")
- Search query is saved in URL for bookmarking

#### Start Unscheduled Session

**What it does:** Begin a consultation with a walk-in patient without a pre-scheduled appointment.

**How to use:**
1. Click "Start Unscheduled Session"
2. A patient selection modal will open
3. Search for and select the patient
4. The consultation session will begin immediately

**Use cases:**
- Walk-in patients
- Emergency consultations
- Follow-up sessions not on the schedule

#### Review Pending Reports

**What it does:** Access reports that have been generated but await your review and signature.

**How to use:**
1. Check the badge number showing pending report count
2. Click "Review Pending Reports"
3. You'll be taken to the reports page filtered for pending items
4. Review each report and add your digital signature

**Badge indicator:** The orange badge shows how many reports need your attention.

---

### 3. Practice Insights 🔵

The bottom section provides analytics and trends for your practice.

#### Active Patients

**What it shows:** Total count of patients with completed clinical profiles under your care.

**How to interpret:**
- This is your current caseload
- Includes all patients with status "CLINICAL_INFO_COMPLETE"
- Helps you understand practice capacity

#### Weekly Sessions Chart

**What it shows:** Visual representation of your consultation sessions over the past 7 days.

**How to read:**
1. Each bar represents one day of the week (Mon-Sun)
2. Bar height indicates number of sessions
3. Hover over bars to see exact count
4. Average sessions per day shown at bottom
5. Total sessions for the week shown in badge

**Use cases:**
- Identify busy days and patterns
- Plan scheduling and capacity
- Track productivity trends

---

## Dashboard Features

### Real-time Data

The dashboard loads fresh data every time you visit. All metrics reflect the current state of your practice.

### Responsive Design

The dashboard adapts to your screen size:
- **Desktop:** Full 3-column layout with all features visible
- **Tablet:** 2-column layout with optimized spacing
- **Mobile:** Single column, stacked layout for easy scrolling

### Loading States

When the dashboard is loading, you'll see animated skeleton loaders that match the layout of each section.

### Error Handling

If data fails to load:
1. You'll see a clear error message
2. A "Retry" button lets you try loading again
3. The dashboard implements graceful degradation - if one metric fails, others still display

### Dark Mode Support

All dashboard components support dark mode and will automatically adapt to your system preferences.

---

## Common Workflows

### Morning Routine

1. **Check Immediate Priorities**
   - Review Clinical Intake Queue for new patients
   - Check Needs Attention count for urgent follow-ups

2. **Review Pending Work**
   - Click "Review Pending Reports" to sign completed reports
   - Complete any pending clinical profiles

3. **Plan Your Day**
   - Check Weekly Sessions chart to see today's load
   - Review Active Patients count for capacity planning

### During Clinic Hours

1. **Walk-in Patient Arrives**
   - Click "Start Unscheduled Session"
   - Select patient and begin consultation

2. **Need to Find a Patient**
   - Use "Find Patient" search bar
   - Type name or phone and press Enter

3. **Patient Needs Follow-up**
   - Check if they appear in Needs Attention card
   - Review their latest report status

### End of Day

1. **Complete Documentation**
   - Review and sign all pending reports
   - Complete any pending clinical profiles

2. **Review Metrics**
   - Check today's session count in Weekly chart
   - Note any patients needing attention for tomorrow

---

## Tips and Best Practices

### Prioritization

1. **Start with Immediate Priorities** - These require urgent action
2. **Complete pending reports daily** - Maintain compliance and workflow
3. **Monitor Needs Attention count** - Don't let it grow too large

### Efficiency

1. **Use keyboard shortcuts** - Press Enter in search bar
2. **Bookmark filtered views** - URLs preserve search and filter parameters
3. **Complete profiles promptly** - Reduces Clinical Intake Queue backlog

### Data Accuracy

1. **Update patient status** - Ensures accurate Needs Attention count
2. **Complete reports timely** - Keeps pending count manageable
3. **Regular profile updates** - Maintains accurate Active Patients count

---

## Troubleshooting

### Dashboard Won't Load

**Problem:** Dashboard shows error message

**Solutions:**
1. Click the "Retry" button
2. Check your internet connection
3. Refresh the browser page
4. Clear browser cache and reload
5. Contact support if issue persists

### Metrics Seem Incorrect

**Problem:** Numbers don't match expectations

**Solutions:**
1. Refresh the dashboard to get latest data
2. Verify patient statuses in patient list
3. Check report statuses in reports page
4. Ensure all recent actions have been saved

### Search Not Working

**Problem:** Patient search returns no results

**Solutions:**
1. Check spelling of patient name
2. Try searching by phone number instead
3. Use partial name (first or last name only)
4. Navigate to full patients list to browse

### Chart Not Displaying

**Problem:** Weekly Sessions chart is empty

**Solutions:**
1. Verify you have sessions in the last 7 days
2. Check that sessions are properly saved
3. Refresh the dashboard
4. Contact support if data exists but doesn't display

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Submit patient search | `Enter` |
| Clear search input | Click X button |
| Navigate sections | `Tab` |
| Click buttons/cards | `Enter` or `Space` |

---

## Mobile Usage

The dashboard is fully optimized for mobile devices:

1. **Touch-friendly buttons** - Large tap targets
2. **Swipe-friendly layout** - Smooth scrolling
3. **Responsive charts** - Adapts to screen size
4. **Readable text** - Optimized font sizes

---

## Accessibility

The dashboard supports:

- **Screen readers** - All content is properly labeled
- **Keyboard navigation** - Full functionality without mouse
- **High contrast** - Meets WCAG AA standards
- **Zoom support** - Works at 200% zoom level

---

## Privacy and Security

- All data is encrypted in transit and at rest
- You only see patients you created (data isolation)
- Session timeout after 30 minutes of inactivity
- Audit logs track all dashboard access

---

## Getting Help

### In-App Support

- Hover over elements for tooltips
- Check empty states for guidance
- Review error messages for specific issues

### Documentation

- [API Documentation](../../backend/docs/DASHBOARD_API.md)
- [Component Documentation](./DASHBOARD_COMPONENTS.md)
- [Design Document](../../.kiro/specs/dashboard-redesign/design.md)

### Contact Support

If you encounter issues:
1. Note the specific error message
2. Document steps to reproduce
3. Check your internet connection
4. Contact your system administrator

---

## Frequently Asked Questions

**Q: How often does the dashboard update?**
A: The dashboard loads fresh data every time you visit or refresh the page.

**Q: Can I customize which metrics are shown?**
A: Currently, all metrics are standard. Customization is planned for a future release.

**Q: Why don't I see some patients in the intake queue?**
A: The queue shows only the 5 most recent patients. Visit the full patients page to see all pending profiles.

**Q: What does "worse" status mean in Needs Attention?**
A: It indicates the patient's latest report shows their condition is deteriorating and requires follow-up.

**Q: Can I export dashboard data?**
A: Export functionality is planned for a future release.

**Q: Does the dashboard work offline?**
A: No, the dashboard requires an internet connection to load current data.

**Q: How far back does the Weekly Sessions chart go?**
A: The chart shows the last 7 days of session activity.

**Q: Can I see historical trends?**
A: Extended historical analytics are planned for a future release.

---

## Version History

### Version 1.0 (Current)
- Initial release of Clinical Command Center
- Three-section priority-based layout
- Real-time metrics and analytics
- Responsive design for all devices
- Dark mode support

### Planned Features
- Real-time updates via WebSocket
- Customizable dashboard widgets
- Export to PDF/CSV
- Extended historical analytics
- Mobile app version

---

## Feedback

We value your feedback! If you have suggestions for improving the dashboard:
1. Document your idea clearly
2. Explain the use case
3. Submit through your organization's feedback channel

Your input helps us build better tools for clinical workflows.
