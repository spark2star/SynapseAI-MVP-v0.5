# Requirements Document

## Introduction

The Receptionist Workflow feature implements a two-stage patient registration system with role-based access control (RBAC). This system enables doctors to invite receptionists to their clinic, allowing receptionists to register patient demographics while doctors complete clinical information. The feature ensures proper clinic isolation, data security through encryption, and maintains clear separation of responsibilities between roles.

## Glossary

- **System**: The SynapseAI healthcare management platform
- **Doctor**: A user with the role "doctor" who can invite receptionists and complete clinical patient information
- **Receptionist**: A user with the role "receptionist" who can register patient demographics but cannot access clinical data
- **Patient Record**: A database entry containing patient information with two completion states: DEMOGRAPHICS_ONLY and CLINICAL_INFO_COMPLETE
- **Clinic**: A logical grouping of a doctor and their invited receptionists, enforcing data isolation
- **Invitation Token**: A secure, time-limited, single-use token for receptionist account creation
- **Stage 1 Registration**: The process of creating a patient record with demographics only
- **Stage 2 Registration**: The process of completing a patient record with clinical information
- **Profile Status**: An enumeration indicating patient record completion state (DEMOGRAPHICS_ONLY or CLINICAL_INFO_COMPLETE)
- **Clinic Isolation**: Security mechanism ensuring users can only access data within their clinic
- **Encrypted Field**: A database field that is automatically encrypted at rest and decrypted on access

## Requirements

### Requirement 1: Staff Invitation System

**User Story:** As a doctor, I want to invite receptionists to my clinic via email, so that they can help manage patient registration without accessing clinical data.

#### Acceptance Criteria

1. WHEN THE Doctor submits a valid email address through the staff invitation form, THE System SHALL create a unique invitation token with a 7-day expiration
2. WHEN an invitation token is created, THE System SHALL send an email to the recipient containing the invitation URL and expiration date
3. IF an active invitation already exists for the same email and doctor, THEN THE System SHALL reject the new invitation request with an appropriate error message
4. WHEN an invitation token expires, THE System SHALL mark it as invalid and allow creation of a new invitation for the same email
5. THE System SHALL display all pending (non-expired) invitations to the doctor who created them

### Requirement 2: Invitation Acceptance and Account Creation

**User Story:** As an invited receptionist, I want to accept the invitation and create my account with a secure password, so that I can start working at the clinic.

#### Acceptance Criteria

1. WHEN THE Receptionist accesses an invitation URL with a valid token, THE System SHALL display the invitation details including doctor name and clinic name
2. IF the invitation token is invalid or expired, THEN THE System SHALL display an error message and prevent account creation
3. WHEN THE Receptionist submits a password meeting security requirements (minimum 8 characters), THE System SHALL create a new user account with role "receptionist"
4. WHEN a receptionist account is created, THE System SHALL set the invited_by_id field to link the receptionist to the inviting doctor
5. WHEN account creation succeeds, THE System SHALL delete the invitation token to prevent reuse
6. WHEN account creation succeeds, THE System SHALL automatically authenticate the receptionist and redirect them to the dashboard

### Requirement 3: Stage 1 Patient Registration (Demographics)

**User Story:** As a receptionist, I want to register new patients with their demographic and contact information, so that doctors can later complete their clinical profiles.

#### Acceptance Criteria

1. WHEN THE Receptionist or Doctor submits the demographics form with required fields (first name, last name, date of birth, primary phone), THE System SHALL create a patient record with profile_status set to DEMOGRAPHICS_ONLY
2. THE System SHALL encrypt all personally identifiable information (PII) fields including name, date of birth, contact information, and address
3. WHEN a patient record is created, THE System SHALL generate a unique patient_id in the format "PAT-XXXXXX"
4. WHEN a patient record is created, THE System SHALL set the created_by field to the current user's ID
5. THE System SHALL generate search hashes for name, phone, and email fields to enable encrypted field searching

### Requirement 4: Pending Patient Review

**User Story:** As a doctor, I want to view all patients registered by my receptionists that are pending clinical review, so that I can complete their profiles.

#### Acceptance Criteria

1. WHEN THE Doctor accesses the pending review page, THE System SHALL display all patient records with profile_status DEMOGRAPHICS_ONLY created by the doctor or their receptionists
2. THE System SHALL display patient information including patient_id, full name, age, gender, phone, creator name, and registration date
3. THE System SHALL calculate patient age from the encrypted date of birth field
4. WHEN THE Doctor clicks "Complete Profile" for a patient, THE System SHALL navigate to the clinical information form with patient demographics pre-loaded
5. THE System SHALL enforce clinic isolation by only showing patients created within the doctor's clinic

### Requirement 5: Stage 2 Patient Registration (Clinical Information)

**User Story:** As a doctor, I want to complete patient profiles with clinical information including medical history and allergies, so that I have comprehensive patient records for treatment.

#### Acceptance Criteria

1. WHEN THE Doctor accesses the clinical completion form, THE System SHALL display read-only demographics information for verification
2. WHEN THE Doctor submits clinical information (blood group, allergies, medical history, current medications), THE System SHALL update the patient record
3. WHEN clinical information is saved, THE System SHALL change the profile_status from DEMOGRAPHICS_ONLY to CLINICAL_INFO_COMPLETE
4. WHEN profile_status changes to CLINICAL_INFO_COMPLETE, THE System SHALL remove the patient from the pending review list
5. THE System SHALL encrypt all clinical information fields including allergies, medical history, and current medications

### Requirement 6: Role-Based Access Control (RBAC)

**User Story:** As a system administrator, I want to enforce role-based access control, so that receptionists cannot access clinical data and users cannot access other clinics' data.

#### Acceptance Criteria

1. WHEN THE Receptionist attempts to access clinical information endpoints, THE System SHALL return a 403 Forbidden error
2. WHEN THE Receptionist attempts to complete clinical information for a patient, THE System SHALL reject the request with a 403 Forbidden error
3. WHEN THE Doctor or Receptionist attempts to access a patient from a different clinic, THE System SHALL return a 403 Forbidden or 404 Not Found error
4. THE System SHALL verify clinic membership by checking the invited_by_id relationship chain
5. WHEN THE Receptionist accesses patient demographics, THE System SHALL only return non-clinical fields

### Requirement 7: Clinic Isolation and Data Security

**User Story:** As a doctor, I want my clinic's data to be isolated from other clinics, so that patient privacy is maintained and data access is properly controlled.

#### Acceptance Criteria

1. WHEN a patient record is created, THE System SHALL associate it with the creator's clinic through the created_by field
2. WHEN THE System queries patient records, THE System SHALL filter results to include only patients from the current user's clinic
3. WHEN THE System determines clinic membership for a receptionist, THE System SHALL use the invited_by_id field to identify the parent doctor
4. WHEN THE System determines clinic membership for a doctor, THE System SHALL include patients created by the doctor and all their receptionists
5. THE System SHALL prevent cross-clinic data access through database-level filtering

### Requirement 8: Staff Management Interface

**User Story:** As a doctor, I want to view all my clinic staff members and pending invitations, so that I can manage my team effectively.

#### Acceptance Criteria

1. WHEN THE Doctor accesses the staff management page, THE System SHALL display all active staff members invited by the doctor
2. THE System SHALL display staff member information including name, email, role, join date, and active status
3. WHEN THE Doctor accesses the staff management page, THE System SHALL display all pending (non-expired) invitations
4. THE System SHALL display invitation information including recipient email, sent date, expiration date, and status
5. THE System SHALL decrypt encrypted email fields for display to the inviting doctor

### Requirement 9: Navigation and User Experience

**User Story:** As a receptionist or doctor, I want intuitive navigation to access relevant features based on my role, so that I can efficiently perform my tasks.

#### Acceptance Criteria

1. WHEN THE Receptionist logs in, THE System SHALL display navigation options for creating new patients and viewing patient demographics
2. WHEN THE Doctor logs in, THE System SHALL display navigation options for pending review, staff management, and all patient management features
3. WHEN THE Receptionist accesses the dashboard, THE System SHALL hide clinical data and pending review features
4. THE System SHALL display role-appropriate action buttons on patient lists based on user role
5. WHEN THE User completes a workflow step, THE System SHALL redirect to an appropriate next page with success feedback

### Requirement 10: Data Encryption and Field Access

**User Story:** As a system administrator, I want all personally identifiable information to be encrypted at rest, so that patient data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN THE System stores PII fields (name, date of birth, contact information, address, clinical data), THE System SHALL encrypt the data using the EncryptedType column type
2. WHEN THE System reads encrypted fields, THE System SHALL automatically decrypt the data for authorized users
3. WHEN THE System encounters encryption errors, THE System SHALL log the error and return a generic error message to the user
4. THE System SHALL use appropriate field lengths for encrypted data to prevent truncation errors
5. WHEN THE System creates search hashes, THE System SHALL use SHA256 hashing on normalized field values

### Requirement 11: Invitation Email Delivery

**User Story:** As a doctor, I want invitation emails to be sent reliably to receptionists, so that they can join my clinic without manual intervention.

#### Acceptance Criteria

1. WHEN an invitation is created, THE System SHALL attempt to send an email using the configured email service
2. WHEN email sending fails, THE System SHALL log the failure but still create the invitation record
3. THE System SHALL include the invitation URL, doctor name, clinic name, and expiration date in the invitation email
4. WHEN SMTP is not configured, THE System SHALL log the invitation URL to the backend logs for manual sharing
5. THE System SHALL format invitation emails with clear instructions and branding

### Requirement 12: Error Handling and User Feedback

**User Story:** As a user, I want clear error messages and feedback when operations fail, so that I can understand what went wrong and how to fix it.

#### Acceptance Criteria

1. WHEN a database operation fails, THE System SHALL rollback the transaction and return a 500 Internal Server Error with a generic message
2. WHEN validation fails, THE System SHALL return a 400 Bad Request with specific field-level error messages
3. WHEN authorization fails, THE System SHALL return a 403 Forbidden error without revealing sensitive information
4. WHEN a resource is not found, THE System SHALL return a 404 Not Found error
5. THE System SHALL display user-friendly toast notifications for success and error states in the frontend

### Requirement 13: Date and Time Handling

**User Story:** As a user, I want dates and times to be displayed consistently and correctly, so that I can understand when events occurred.

#### Acceptance Criteria

1. WHEN THE System displays dates, THE System SHALL format them in a human-readable format (e.g., "Jan 15, 2024, 10:30 AM")
2. WHEN THE System encounters invalid date values, THE System SHALL display "Invalid Date" or "N/A" instead of throwing errors
3. THE System SHALL handle null or undefined date values gracefully without breaking the UI
4. WHEN THE System calculates age from date of birth, THE System SHALL account for leap years and timezone differences
5. THE System SHALL store all timestamps in UTC and convert to local time for display

### Requirement 14: Middleware and Public Routes

**User Story:** As a system administrator, I want the invitation acceptance page to be publicly accessible without authentication, so that invited receptionists can create accounts.

#### Acceptance Criteria

1. THE System SHALL allow unauthenticated access to invitation status check endpoints
2. THE System SHALL allow unauthenticated access to invitation acceptance endpoints
3. WHEN THE System middleware processes requests to /invite/* paths, THE System SHALL skip authentication checks
4. THE System SHALL enforce authentication for all other dashboard and API endpoints
5. WHEN an unauthenticated user accesses protected routes, THE System SHALL redirect to the login page

### Requirement 15: Database Schema and Migrations

**User Story:** As a developer, I want database schema changes to be managed through migrations, so that schema updates are versioned and reproducible.

#### Acceptance Criteria

1. THE System SHALL include a staff_invitations table with columns for inviter_id, recipient_email, token, and expiration
2. THE System SHALL include an invited_by_id column in the users table with a foreign key to users.id
3. THE System SHALL include a profile_status column in the patients table with default value DEMOGRAPHICS_ONLY
4. WHEN migrations are applied, THE System SHALL create appropriate indexes for performance
5. THE System SHALL handle SQLAlchemy relationship warnings by adding overlaps parameters where needed
