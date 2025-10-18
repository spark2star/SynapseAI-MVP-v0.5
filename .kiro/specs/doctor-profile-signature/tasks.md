# Implementation Plan: Doctor Profile Completion and Digital Signature System

## Task List

- [x] 1. Database schema modifications and migration
  - Create Alembic migration to add `qualifications` column to `doctor_profiles` table
  - Add `signature_hash` column to `reports` table in the same migration
  - Apply migration and verify schema changes
  - _Requirements: 1.1, 2.1, 3.4_

- [x] 2. Implement file upload service
  - [x] 2.1 Create `FileUploadService` class in `backend/app/services/file_upload_service.py`
    - Implement file validation (type, size, format)
    - Implement secure filename sanitization
    - Implement Google Cloud Storage upload with unique paths
    - Return public URL for uploaded files
    - _Requirements: 2.2, 2.3_
  
  - [x] 2.2 Add file upload configuration to settings
    - Add GCP storage bucket configuration to `backend/app/core/config.py`
    - Define allowed image formats and max file size
    - _Requirements: 2.2_

- [x] 3. Implement profile completion endpoint
  - [x] 3.1 Create profile schemas in `backend/app/schemas/profile.py`
    - Define `ProfileCompletionRequest` schema with validation
    - Define `ProfileCompletionResponse` schema
    - _Requirements: 2.1, 2.4, 2.5_
  
  - [x] 3.2 Create profile completion endpoint in `backend/app/api/api_v1/endpoints/profile.py`
    - Implement `POST /api/v1/profile/complete` endpoint
    - Handle multipart form data with file uploads
    - Upload logo and signature files using `FileUploadService`
    - Update `DoctorProfile` with qualifications and signature URL
    - Update `UserProfile` with clinic details and logo URL
    - Set `profile_completed` flag to `True`
    - Create audit log entry for `PROFILE_COMPLETED` event
    - Return updated profile data
    - _Requirements: 1.3, 2.1, 2.2, 2.3, 2.4, 5.1, 5.2, 5.3, 5.4_
  
  - [x] 3.3 Add profile router to API
    - Register profile router in `backend/app/api/api_v1/__init__.py`
    - _Requirements: 1.1_

- [x] 4. Implement report signing service
  - [x] 4.1 Create report signing schemas in `backend/app/schemas/report.py`
    - Define `SignReportRequest` schema with password field
    - Define `SignReportResponse` schema with signature details
    - _Requirements: 3.1, 3.4_
  
  - [x] 4.2 Create `ReportSigningService` class in `backend/app/services/report_signing_service.py`
    - Implement `generate_signature_hash()` method using SHA-256
    - Implement `sign_report()` method with password verification
    - Verify report ownership and status
    - Update report with signature hash, signed_by, signed_at, and status='signed'
    - _Requirements: 3.3, 3.4, 3.5_
  
  - [x] 4.3 Create report signing endpoint in `backend/app/api/api_v1/endpoints/reports.py`
    - Implement `POST /api/v1/reports/{report_id}/sign` endpoint
    - Verify current user is report owner
    - Verify report status is 'completed'
    - Call `ReportSigningService.sign_report()` with password verification
    - Create audit log entry for `REPORT_SIGNED` or `REPORT_SIGN_FAILED` event
    - Return signed report details
    - Handle errors (401 for invalid password, 400 for invalid status, 403 for unauthorized)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3_

- [x] 5. Enhance audit logging
  - [x] 5.1 Add new audit event types to `backend/app/models/audit_log.py`
    - Add `REPORT_SIGNED` event type
    - Add `REPORT_SIGN_FAILED` event type
    - _Requirements: 4.1, 4.2_
  
  - [x] 5.2 Create audit logging helper for report signing
    - Implement helper function to log signing events with report details
    - Include signature hash, report ID, and user ID in audit details
    - _Requirements: 4.2, 4.3, 4.4_

- [x] 6. Implement frontend middleware flow control
  - [x] 6.1 Update authentication middleware in `frontend/src/middleware.ts`
    - Add check for `password_reset_required` flag
    - Redirect to `/change-password` if password reset required
    - Add check for `profile_completed` flag for doctor users
    - Redirect to `/doctor/complete-profile` if profile not completed
    - Allow access to dashboard only when both checks pass
    - _Requirements: 1.1, 1.2, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 7. Build Complete Profile page
  - [x] 7.1 Create profile completion form component
    - Create `frontend/src/app/doctor/complete-profile/page.tsx`
    - Implement form state management with React Hook Form
    - Create Practice Details section (logo upload, clinic name, address, phone)
    - Create Professional Details section (qualifications input, read-only name and registration number)
    - Create Digital Signature section (signature upload with preview)
    - Implement file upload handling with validation
    - Apply SynapseAI design system styling
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 7.2 Implement form submission and API integration
    - Create API client function for profile completion
    - Build multipart form data with files
    - Handle success response and redirect to dashboard
    - Handle error responses with user-friendly messages
    - Show loading state during submission
    - _Requirements: 1.3, 2.1_

- [x] 8. Build Sign Report modal
  - [x] 8.1 Create SignReportModal component
    - Create `frontend/src/components/reports/SignReportModal.tsx`
    - Implement modal UI with warning message
    - Add password input field with validation
    - Add "Cancel" and "Confirm & Sign" buttons
    - Implement loading and error states
    - Apply SynapseAI design system styling
    - _Requirements: 7.2, 7.3, 7.4_
  
  - [x] 8.2 Implement signing logic and API integration
    - Create API client function for report signing
    - Handle password submission
    - Handle success response and close modal
    - Handle error responses (show inline error for invalid password)
    - Update parent component on success
    - _Requirements: 3.1, 7.5, 7.6_
  
  - [x] 8.3 Integrate modal into report detail page
    - Update report detail page to show "Sign and Finalize Report" button
    - Enable button only when report status is 'completed'
    - Open SignReportModal on button click
    - Refresh report data after successful signing
    - Update UI to show "Signed" status
    - _Requirements: 3.5, 7.1, 7.5_

- [x] 9. Error handling and validation
  - [x] 9.1 Implement backend error handling
    - Add validation for file types and sizes in file upload service
    - Add proper error responses for all failure scenarios
    - Implement rate limiting for signing attempts
    - _Requirements: 3.2, 3.5_
  
  - [x] 9.2 Implement frontend error handling
    - Add form validation with real-time feedback
    - Display toast notifications for success/error
    - Show inline error messages in modal
    - Implement retry mechanism for network failures
    - _Requirements: 7.6_

- [x] 10. Integration and end-to-end verification
  - [x] 10.1 Test profile completion workflow
    - Verify new doctor is redirected to complete profile page
    - Verify dashboard access is blocked until profile complete
    - Verify profile data is saved correctly
    - Verify audit log entry is created
    - Verify redirect to dashboard after completion
    - _Requirements: 1.1, 1.2, 1.3, 4.1_
  
  - [x] 10.2 Test report signing workflow
    - Verify sign button is enabled for completed reports
    - Verify password re-authentication works
    - Verify signature hash is generated and stored
    - Verify audit log entry is created
    - Verify report status updates to 'signed'
    - Verify UI updates correctly
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4_
  
  - [x] 10.3 Test error scenarios
    - Test invalid password for signing
    - Test signing already-signed report
    - Test signing report not owned by user
    - Test file upload with invalid format
    - Test file upload exceeding size limit
    - _Requirements: 3.2, 3.5_
