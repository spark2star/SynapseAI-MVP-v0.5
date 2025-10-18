# Requirements Document

## Introduction

This document outlines the requirements for redesigning the SynapseAI clinician dashboard from a passive data display into an actionable Clinical Command Center. The redesign prioritizes doctor workflows, focusing on immediate tasks, streamlined actions, and practice insights to enhance clinical efficiency and patient care quality.

## Glossary

- **Dashboard System**: The SynapseAI web application component that displays clinician overview information and provides access to core clinical workflows
- **Clinical Intake Queue**: A prioritized list of patients who have completed demographic registration but require clinical information completion
- **Needs Attention Patients**: Patients whose most recent report indicates a "worse" patient status requiring follow-up
- **Pending Reports**: Generated consultation reports with status "completed" that await doctor review and digital signature
- **Active Patients**: Patients with profile status "CLINICAL_INFO_COMPLETE" under the doctor's care
- **Unscheduled Session**: A consultation session initiated without a pre-scheduled appointment
- **Patient Selection Modal**: An existing UI component that allows doctors to search and select patients for consultation sessions
- **Dashboard Stats Endpoint**: A new backend API endpoint that returns consolidated dashboard analytics data
- **Practice Insights**: Analytics and metrics showing session trends and patient care statistics

## Requirements

### Requirement 1: Clinical Intake Queue Display

**User Story:** As a doctor, I want to see patients who need clinical profile completion, so that I can prioritize onboarding tasks and complete patient records efficiently.

#### Acceptance Criteria

1. WHEN the Dashboard System loads, THE Dashboard System SHALL retrieve pending intake patients from the Dashboard Stats Endpoint
2. THE Dashboard System SHALL display up to 5 most recent patients with profile status "DEMOGRAPHICS_ONLY" in the Clinical Intake Queue
3. WHERE a patient appears in the Clinical Intake Queue, THE Dashboard System SHALL display the patient's full name and registration timestamp
4. WHEN a doctor clicks the "Complete Profile" button for a patient, THE Dashboard System SHALL navigate to the Stage 2 clinical information form for that specific patient
5. WHERE no pending intake patients exist, THE Dashboard System SHALL display an empty state message in the Clinical Intake Queue

### Requirement 2: Needs Attention Patient Tracking

**User Story:** As a doctor, I want to quickly identify patients whose condition is worsening, so that I can prioritize follow-up care and intervene promptly.

#### Acceptance Criteria

1. THE Dashboard System SHALL query the most recent report for each unique patient associated with the doctor
2. THE Dashboard System SHALL count patients where the latest report has patient status "worse"
3. THE Dashboard System SHALL display the Needs Attention Patients count in a prominent card component
4. WHEN a doctor clicks the Needs Attention card, THE Dashboard System SHALL navigate to the patients page with filter parameter "needs_attention"
5. THE Dashboard System SHALL update the Needs Attention count when new reports are generated with status "worse"

### Requirement 3: Pending Reports Management

**User Story:** As a doctor, I want to see how many reports await my review, so that I can complete documentation tasks and maintain compliance.

#### Acceptance Criteria

1. THE Dashboard System SHALL query reports with status "completed" where the doctor is the author
2. THE Dashboard System SHALL display the total count of pending reports in a badge on the "Review Pending Reports" button
3. WHEN a doctor clicks the "Review Pending Reports" button, THE Dashboard System SHALL navigate to the reports page with filter parameter "pending_review"
4. THE Dashboard System SHALL update the pending reports count when reports are signed or new reports are generated
5. WHERE the pending reports count is zero, THE Dashboard System SHALL display the badge with value "0"

### Requirement 4: Active Patient Statistics

**User Story:** As a doctor, I want to see my total active patient count, so that I can understand my current caseload and practice capacity.

#### Acceptance Criteria

1. THE Dashboard System SHALL count patients with profile status "CLINICAL_INFO_COMPLETE" associated with the doctor
2. THE Dashboard System SHALL display the active patients count in a stat card component
3. THE Dashboard System SHALL update the active patients count when patient profiles are completed or patients are added
4. THE Dashboard System SHALL display the active patients count with appropriate formatting for large numbers
5. THE Dashboard System SHALL retrieve the active patients count from the Dashboard Stats Endpoint

### Requirement 5: Weekly Session Analytics

**User Story:** As a doctor, I want to visualize my consultation sessions over the past week, so that I can track my productivity and identify scheduling patterns.

#### Acceptance Criteria

1. THE Dashboard System SHALL query consultation sessions where started_at is within the last 7 days
2. THE Dashboard System SHALL group session results by day of the week
3. THE Dashboard System SHALL display session counts for each day in a bar chart visualization
4. THE Dashboard System SHALL label each day with abbreviated day names (Mon, Tue, Wed, Thu, Fri, Sat, Sun)
5. THE Dashboard System SHALL use a lightweight charting solution without adding complex external dependencies

### Requirement 6: Patient Search Functionality

**User Story:** As a doctor, I want to quickly search for any patient by name, so that I can access patient records without navigating through lists.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a patient search bar component in the Core Actions section
2. WHEN a doctor types a search query and submits, THE Dashboard System SHALL navigate to the patients page with the search query parameter
3. THE Dashboard System SHALL preserve the search query in the URL for bookmarking and sharing
4. THE Dashboard System SHALL provide visual feedback during search input
5. THE Dashboard System SHALL reuse the existing patient list search functionality

### Requirement 7: Unscheduled Session Initiation

**User Story:** As a doctor, I want to start a consultation session for walk-in patients, so that I can provide immediate care without pre-scheduling.

#### Acceptance Criteria

1. THE Dashboard System SHALL display a "Start Unscheduled Session" button in the Core Actions section
2. WHEN a doctor clicks the "Start Unscheduled Session" button, THE Dashboard System SHALL open the Patient Selection Modal
3. THE Patient Selection Modal SHALL allow the doctor to search and select a patient
4. WHEN a patient is selected from the Patient Selection Modal, THE Dashboard System SHALL initiate a new consultation session
5. THE Dashboard System SHALL reuse the existing Patient Selection Modal component

### Requirement 8: Dashboard Data Consolidation

**User Story:** As a system, I want to provide all dashboard data through a single API call, so that I can minimize network requests and improve page load performance.

#### Acceptance Criteria

1. THE Dashboard Stats Endpoint SHALL return a consolidated JSON object containing all dashboard metrics
2. THE Dashboard Stats Endpoint SHALL include pending intake patients, needs attention count, pending reports count, active patients count, and weekly sessions data
3. THE Dashboard Stats Endpoint SHALL execute database queries efficiently using appropriate indexes
4. THE Dashboard Stats Endpoint SHALL require authentication and return data only for the logged-in doctor
5. THE Dashboard Stats Endpoint SHALL respond within 500 milliseconds for typical data volumes

### Requirement 9: Dashboard Layout Organization

**User Story:** As a doctor, I want the dashboard organized into clear sections, so that I can quickly locate the information and actions I need.

#### Acceptance Criteria

1. THE Dashboard System SHALL organize content into three main sections: "Immediate Priorities", "Core Actions", and "Practice Insights"
2. THE Dashboard System SHALL display the "Immediate Priorities" section at the top of the page
3. THE Dashboard System SHALL display the "Core Actions" section in the middle of the page
4. THE Dashboard System SHALL display the "Practice Insights" section at the bottom of the page
5. THE Dashboard System SHALL use semantic HTML and styled divs for section organization

### Requirement 10: Design System Consistency

**User Story:** As a developer, I want all new UI components to follow the existing design system, so that the dashboard maintains visual consistency with the rest of the application.

#### Acceptance Criteria

1. THE Dashboard System SHALL use existing UI components from the components/ui directory
2. THE Dashboard System SHALL apply Card, Button, Badge, and Input components where appropriate
3. THE Dashboard System SHALL follow the existing color scheme and spacing conventions
4. THE Dashboard System SHALL maintain responsive design patterns for mobile and desktop views
5. THE Dashboard System SHALL use existing Tailwind CSS utility classes consistent with the current implementation
