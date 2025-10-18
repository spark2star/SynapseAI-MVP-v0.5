# Implementation Plan

## Overview

This implementation plan addresses the gaps identified in the design document. Tasks are organized by priority (Critical → Important → Nice-to-Have) and grouped by functional area. Each task builds incrementally on existing code and includes specific requirements references.

## Task List

- [ ] 1. Fix Critical Backend Issues
  - Add missing endpoints and improve error handling for core functionality
  - _Requirements: 1.5, 3.1, 6.1, 6.2, 10.3, 12.1_

- [ ] 1.1 Add invitation revocation endpoint
  - Create `DELETE /staff/invite/{invitation_id}` endpoint (doctor only)
  - Soft delete invitation record with `revoked_at` timestamp
  - Add `revoked_by` field to track who revoked
  - Return success message with revoked invitation details
  - _Requirements: 1.5_

- [ ] 1.2 Add patient demographics update endpoint
  - Create `PUT /patients/v2/{patient_id}/demographics` endpoint
  - Allow both doctors and receptionists to update demographics
  - Validate that patient exists and user has clinic access
  - Update search hashes after field changes
  - Return updated patient demographics response
  - _Requirements: 3.1, 6.1_

- [ ] 1.3 Create clinic membership helper function
  - Add `get_clinic_member_ids(user: User, db: Session) -> List[str]` to dependencies
  - Return list of user IDs in the same clinic (doctor + their receptionists)
  - Handle both doctor and receptionist as input (traverse up to find doctor)
  - Use this helper in all endpoints that need clinic isolation
  - _Requirements: 6.4, 7.3, 7.4_

- [ ] 1.4 Improve encryption error handling
  - Wrap encryption/decryption in try-except blocks
  - Return specific error codes for encryption failures (e.g., 422 for corrupted data)
  - Log encryption errors with field name and user ID for debugging
  - Add fallback to return partial data if some fields fail to decrypt
  - _Requirements: 10.3, 12.1_

- [ ] 1.5 Refactor clinic isolation using helper function
  - Replace duplicated clinic isolation logic in `patients_v2.py` with `get_clinic_member_ids()`
  - Replace duplicated logic in `staff.py` with helper function
  - Add unit tests for clinic isolation edge cases
  - _Requirements: 6.4, 7.3, 7.4_

- [ ] 2. Add Important Backend Features
  - Implement audit trail and improve invitation management
  - _Requirements: 1.1, 1.2, 1.5, 8.5, 12.4_

- [ ] 2.1 Add audit trail fields to models
  - Add `updated_by` field to Patient model (nullable, foreign key to users)
  - Add `accepted_at` and `revoked_at` fields to StaffInvitation model
  - Create Alembic migration for new fields
  - Update patient update endpoints to set `updated_by`
  - _Requirements: 12.4_

- [ ] 2.2 Add invitation URL retrieval endpoint
  - Create `GET /staff/invite/{invitation_id}/url` endpoint (doctor only)
  - Return invitation URL for manual sharing
  - Validate invitation belongs to requesting doctor
  - Check invitation is not expired or revoked
  - _Requirements: 1.1, 8.5_

- [ ] 2.3 Add clinical field validation
  - Add Pydantic validators to `PatientClinicalInfoRequest` schema
  - Require at least one clinical field to be non-empty
  - Validate blood group is from allowed enum values
  - Add field length limits for allergies, medical history, medications
  - Return 422 with specific field errors if validation fails
  - _Requirements: 5.2, 12.1_

- [ ] 2.4 Add search and filter to pending patients endpoint
  - Add query parameters: `search` (name/patient_id), `sort_by`, `sort_order`
  - Implement search using name_hash for encrypted name fields
  - Add sorting by created_at, patient_id, or age
  - Return filtered and sorted results
  - _Requirements: 4.2, 4.4_

- [ ] 3. Improve Frontend User Experience
  - Add missing UI features and improve form handling
  - _Requirements: 2.6, 8.5, 9.4, 11.2, 12.2_

- [ ] 3.1 Add invitation URL copy button
  - Add "Copy Invitation URL" button next to each pending invitation
  - Fetch URL from new backend endpoint `GET /staff/invite/{id}/url`
  - Copy to clipboard and show success toast
  - Display URL in modal if clipboard API not available
  - _Requirements: 8.5, 11.2_

- [ ] 3.2 Add password strength indicator
  - Create `PasswordStrengthIndicator` component
  - Calculate strength based on length, uppercase, numbers, special characters
  - Display visual indicator (weak/medium/strong) with color coding
  - Show specific requirements not yet met
  - Integrate into invitation acceptance page
  - _Requirements: 2.6, 11.2_

- [ ] 3.3 Add auto-save to demographics form
  - Implement debounced auto-save (save after 2 seconds of no typing)
  - Store draft in localStorage with unique key (user_id + timestamp)
  - Load draft on page mount if exists
  - Show "Draft saved" indicator
  - Clear draft after successful submission
  - Add "Discard Draft" button
  - _Requirements: 9.4, 12.2_

- [ ] 3.4 Add search and filter to pending patients page
  - Add search input for patient name or patient_id
  - Add sort dropdown (by date, name, age)
  - Debounce search input (300ms)
  - Update API call to include search and sort parameters
  - Show "No results" message if search returns empty
  - _Requirements: 4.2, 9.4_

- [ ] 3.5 Add clinical field validation to completion form
  - Add client-side validation: at least one clinical field required
  - Show error message if user tries to submit empty form
  - Highlight required sections in red if empty
  - Add "Skip for now" button that saves with minimal data
  - _Requirements: 5.2, 12.2_

- [ ] 4. Add Security Improvements
  - Enhance authentication and input validation
  - _Requirements: 2.3, 2.6, 3.1, 11.2, 12.1_

- [ ] 4.1 Implement token refresh mechanism
  - Add `POST /auth/refresh` endpoint that accepts refresh token
  - Return new access token if refresh token is valid
  - Add axios interceptor to automatically refresh on 401 errors
  - Retry original request after token refresh
  - Logout user if refresh token is also expired
  - _Requirements: 11.2_

- [ ] 4.2 Add password complexity validation
  - Update `AcceptInviteRequest` schema with password validators
  - Require: minimum 8 characters, 1 uppercase, 1 number, 1 special character
  - Return 422 with specific error message if validation fails
  - Update frontend to show these requirements
  - _Requirements: 2.6, 11.2_

- [ ] 4.3 Add input validation for patient fields
  - Add email format validation (regex)
  - Add phone number format validation (E.164 or local format)
  - Add date of birth range validation (must be in past, reasonable age range)
  - Add postal code format validation based on country
  - Return 422 with field-specific errors
  - _Requirements: 3.1, 12.1_

- [ ] 4.4 Add role-based frontend route protection
  - Create `withRole()` HOC that checks user role from JWT
  - Wrap doctor-only pages with `withRole(['doctor'])`
  - Redirect to appropriate dashboard if role doesn't match
  - Show 403 error page instead of blank page
  - _Requirements: 6.1, 9.2, 9.3_

- [ ] 5. Add Performance Optimizations
  - Improve query performance and add pagination
  - _Requirements: 4.1, 4.2, 8.2, 12.2_

- [ ] 5.1 Optimize pending patients query
  - Rewrite query to use single JOIN instead of subquery
  - Add query: `SELECT p.* FROM patients p JOIN users u ON p.created_by = u.id WHERE ...`
  - Add database index on (profile_status, created_by) composite key
  - Measure query performance before and after
  - _Requirements: 4.1, 4.2_

- [ ] 5.2 Add pagination to patient lists
  - Add `skip` and `limit` query parameters to patient endpoints
  - Return pagination metadata (total, page, pages)
  - Update frontend to show pagination controls
  - Default to 50 patients per page
  - Add "Load More" button as alternative to page numbers
  - _Requirements: 8.2, 12.2_

- [ ] 5.3 Add request-level caching for encrypted fields
  - Create context variable to store decrypted values during request
  - Check cache before decrypting in `EncryptedType.process_result_value()`
  - Clear cache at end of request
  - Measure performance improvement in endpoints that access many encrypted fields
  - _Requirements: 10.2_

- [ ]* 5.4 Add optimistic UI updates
  - Update patient list immediately after creating patient (before API response)
  - Show loading spinner on the new item
  - Revert if API call fails
  - Apply to: patient creation, invitation sending, clinical completion
  - _Requirements: 12.2_

- [ ] 6. Add Deployment and Monitoring Features
  - Improve operational aspects of the system
  - _Requirements: 11.4, 12.1, 12.4_

- [ ]* 6.1 Create environment variables documentation
  - Create `.env.example` file with all required variables
  - Add comments explaining each variable
  - Document default values and valid ranges
  - Add to README.md setup instructions
  - _Requirements: 11.4_

- [ ]* 6.2 Add email queue with retry mechanism
  - Install Celery or similar task queue
  - Create `send_invitation_email` async task
  - Retry up to 3 times with exponential backoff
  - Store failed emails in database for manual review
  - Add admin endpoint to view failed emails
  - _Requirements: 11.4_

- [ ]* 6.3 Add structured logging for audit trail
  - Log all patient data access with user_id, patient_id, action, timestamp
  - Log all invitation events (created, accepted, revoked)
  - Log all authentication events (login, logout, token refresh)
  - Use structured format (JSON) for easy parsing
  - Store logs in separate audit log file
  - _Requirements: 12.4_

- [ ]* 6.4 Add health check endpoints
  - Create `GET /health` endpoint that checks database connection
  - Create `GET /health/detailed` endpoint that checks database, email, encryption
  - Return 200 if healthy, 503 if any component is down
  - Add to deployment monitoring
  - _Requirements: 11.4_

- [ ] 7. Add Testing Infrastructure
  - Create automated tests for critical workflows
  - _Requirements: All requirements_

- [ ]* 7.1 Create backend unit tests
  - Test `get_clinic_member_ids()` helper with various user types
  - Test invitation expiration logic
  - Test patient profile status transitions
  - Test encryption/decryption with edge cases
  - Test search hash generation
  - _Requirements: 1.1, 3.1, 5.1, 10.1, 10.2_

- [ ]* 7.2 Create backend API integration tests
  - Test complete invitation flow (create → check status → accept)
  - Test complete patient registration flow (demographics → pending → clinical)
  - Test RBAC enforcement (receptionist blocked from clinical endpoints)
  - Test clinic isolation (cross-clinic access denied)
  - Test error cases (expired token, invalid data, etc.)
  - _Requirements: 1.1, 2.1, 3.1, 5.1, 6.1, 6.2, 7.1_

- [ ]* 7.3 Create frontend component tests
  - Test form validation in demographics form
  - Test password strength indicator
  - Test auto-save functionality
  - Test error state rendering
  - Test loading state rendering
  - _Requirements: 2.6, 3.1, 9.4, 12.2_

- [ ]* 7.4 Create end-to-end tests
  - Test complete workflow: doctor invites → receptionist accepts → creates patient → doctor completes
  - Test error scenarios: expired invitation, invalid data, unauthorized access
  - Use Playwright or Cypress for browser automation
  - Run in CI/CD pipeline
  - _Requirements: All requirements_

- [ ] 8. Add Nice-to-Have Features
  - Additional features for improved functionality
  - _Requirements: 7.1, 7.2, 11.4_

- [ ]* 8.1 Add multi-doctor clinic support
  - Add `clinic_id` field to User model
  - Create Clinic model with name, address, settings
  - Update clinic isolation logic to use clinic_id instead of invited_by_id
  - Add clinic management UI for admins
  - Allow doctors to join existing clinics
  - _Requirements: 7.1, 7.2_

- [ ]* 8.2 Add encryption key rotation
  - Create `rotate_encryption_key()` management command
  - Decrypt all data with old key, re-encrypt with new key
  - Support gradual migration (try new key first, fall back to old key)
  - Add key version field to track which key was used
  - Document key rotation procedure
  - _Requirements: 11.4_

- [ ]* 8.3 Add invitation email templates
  - Create HTML email template with branding
  - Add plain text fallback
  - Include doctor photo and clinic logo if available
  - Add "Why am I receiving this?" section
  - Add unsubscribe link (mark invitation as spam)
  - _Requirements: 11.1_

- [ ]* 8.4 Add bulk patient import
  - Create `POST /patients/v2/bulk-import` endpoint
  - Accept CSV file with patient demographics
  - Validate all rows before importing any
  - Return detailed error report for invalid rows
  - Create all valid patients in single transaction
  - Add progress indicator in frontend
  - _Requirements: 3.1_

## Task Execution Notes

### Priority Levels

1. **Critical (Tasks 1.x)**: Must be completed first. These fix bugs and missing core functionality.
2. **Important (Tasks 2.x - 4.x)**: Should be completed next. These improve security, UX, and reliability.
3. **Nice-to-Have (Tasks 5.x - 8.x)**: Can be completed later. These add polish and advanced features.

### Testing Approach

- Tasks marked with `*` are optional and can be skipped for faster MVP delivery
- All non-optional tasks should include manual testing before marking complete
- Optional test tasks (7.x) provide comprehensive coverage but are not required for core functionality

### Dependencies

- Task 1.3 must be completed before 1.5
- Task 2.1 must be completed before 2.4 (for audit trail)
- Task 4.1 must be completed before 4.4 (for role checking)
- Task 5.1 should be completed before 5.2 (optimize before paginating)

### Estimated Effort

- Critical tasks (1.x): ~8-10 hours
- Important tasks (2.x - 4.x): ~15-20 hours
- Nice-to-have tasks (5.x - 8.x): ~20-30 hours
- Total: ~43-60 hours for all non-optional tasks

### Success Criteria

After completing all non-optional tasks:
- ✅ All identified critical gaps are fixed
- ✅ Receptionists can update patient demographics
- ✅ Doctors can revoke invitations
- ✅ Encryption errors don't crash the system
- ✅ Token refresh prevents unexpected logouts
- ✅ Password requirements are enforced
- ✅ Input validation prevents bad data
- ✅ Search and filter work in pending patients
- ✅ Auto-save prevents data loss
- ✅ Clinical fields are validated
- ✅ Performance is acceptable with 100+ patients

## Implementation Order

Recommended order for maximum impact:

1. **Week 1**: Critical fixes (Tasks 1.1 - 1.5)
   - Fixes core functionality gaps
   - Improves code quality with helper functions

2. **Week 2**: Security and validation (Tasks 4.1 - 4.4)
   - Prevents security issues
   - Improves data quality

3. **Week 3**: UX improvements (Tasks 3.1 - 3.5)
   - Makes system more user-friendly
   - Reduces user errors

4. **Week 4**: Backend features (Tasks 2.1 - 2.4)
   - Adds audit trail
   - Improves search functionality

5. **Week 5+**: Performance and nice-to-haves (Tasks 5.x - 8.x)
   - Optimizes for scale
   - Adds advanced features
