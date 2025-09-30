# SynapseAI - Entity Relationship Diagram (ERD)

## Visual Database Schema

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    USER DOMAIN                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│       User           │         │    UserProfile       │
├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │◄───1:1──┤ id (PK)              │
│ email (encrypted)    │         │ user_id (FK)         │
│ password_hash        │         │ first_name (enc)     │
│ role                 │         │ last_name (enc)      │
│ is_verified          │         │ phone (enc)          │
│ is_active            │         │ license_number (enc) │
│ mfa_enabled          │         │ specialization (enc) │
│ last_login           │         │ clinic_name (enc)    │
│ created_at           │         │ clinic_address       │
│ updated_at           │         │ logo_url             │
└──────────────────────┘         │ timezone             │
                                 │ language             │
                                 └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  PATIENT DOMAIN                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│      Patient         │
├──────────────────────┤
│ id (PK)              │
│ patient_id (unique)  │◄──────────┐
│ first_name (enc)     │           │
│ last_name (enc)      │           │ created_by
│ date_of_birth (enc)  │           │
│ gender (enc)         │           │
│ phone_primary (enc)  │           │
│ email (enc)          │           │
│ address (enc)        │           │
│ blood_group (enc)    │      ┌────┴──────────────┐
│ allergies (enc)      │      │      User         │
│ medical_history (enc)│      └───────────────────┘
│ insurance (enc)      │
│ created_by (FK)      │
│ name_hash (indexed)  │
│ phone_hash (indexed) │
│ email_hash (indexed) │
│ notes                │
│ tags                 │
│ created_at           │
│ updated_at           │
└──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              CONSULTATION DOMAIN                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│  ConsultationSession │         │   Transcription      │         │       Report         │
├──────────────────────┤         ├──────────────────────┤         ├──────────────────────┤
│ id (PK)              │◄───1:N──┤ id (PK)              │◄───N:1──┤ id (PK)              │
│ session_id (unique)  │         │ session_id (FK)      │         │ session_id (FK)      │
│ patient_id (FK)      │         │ transcript_text (enc)│         │ transcription_id (FK)│
│ doctor_id (FK)       │         │ original_text (enc)  │         │ template_id (FK)     │
│ session_type         │         │ segments (JSON)      │         │ report_type          │
│ status               │         │ processing_status    │         │ status               │
│ started_at           │         │ stt_service          │         │ version              │
│ ended_at             │         │ stt_model            │         │ generated_content (enc)│
│ total_duration       │         │ confidence_score     │         │ structured_data (JSON)│
│ audio_file_url       │         │ word_count           │         │ ai_model             │
│ audio_duration       │         │ manually_corrected   │         │ confidence_score     │
│ chief_complaint (enc)│         │ corrected_by (FK)    │         │ reviewed_by (FK)     │
│ notes (enc)          │         │ correction_notes     │         │ signed_by (FK)       │
│ billing_code         │         │ error_message        │         │ signed_at            │
│ billing_amount       │         │ retry_count          │         │ manual_corrections(enc)│
│ created_at           │         │ created_at           │         │ exported_formats(JSON)│
│ updated_at           │         └──────────────────────┘         │ created_at           │
└──────────────────────┘                                          └──────────────────────┘
         │                                                                  │
         │                                                                  │
         │ N:1                                                         N:1  │
         ▼                                                                  ▼
┌──────────────────────┐                                          ┌──────────────────────┐
│      Patient         │                                          │   ReportTemplate     │
└──────────────────────┘                                          ├──────────────────────┤
         │                                                         │ id (PK)              │
         │ N:1                                                     │ doctor_id (FK)       │
         ▼                                                         │ template_name        │
┌──────────────────────┐                                          │ template_description │
│        User          │                                          │ report_type          │
└──────────────────────┘                                          │ template_structure(JSON)│
                                                                  │ ai_prompt_template   │
                                                                  │ is_default           │
                                                                  │ is_active            │
                                                                  │ is_public            │
                                                                  │ usage_count          │
                                                                  │ version              │
                                                                  │ parent_template_id(FK)│
                                                                  └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              SCHEDULING DOMAIN                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│        Appointment           │
├──────────────────────────────┤
│ id (PK)                      │
│ patient_id (FK)              │──────┐
│ doctor_id (FK)               │──────┼───┐
│ scheduled_datetime           │      │   │
│ duration_minutes (enc)       │      │   │
│ timezone                     │      │   │
│ appointment_type             │      │   │
│ status                       │      │   │
│ priority                     │      │   │
│ chief_complaint (enc)        │      │   │
│ notes (enc)                  │      │   │
│ reminder_sent                │      │   │
│ confirmed_at                 │      │   │
│ confirmed_by (FK)            │──────┼───┤
│ cancelled_at                 │      │   │
│ cancelled_by (FK)            │──────┼───┤
│ session_id (FK)              │──────┼───┼──┐
│ location                     │      │   │  │
│ estimated_cost (enc)         │      │   │  │
│ insurance_verified           │      │   │  │
│ created_at                   │      │   │  │
│ updated_at                   │      │   │  │
└──────────────────────────────┘      │   │  │
         │                            │   │  │
         │ rescheduled_from/to        │   │  │
         │ (self-referential)         │   │  │
         │                            │   │  │
         ▼                            │   │  │
┌──────────────────────────────┐      │   │  │
│      Appointment             │      │   │  │
│   (rescheduled version)      │      │   │  │
└──────────────────────────────┘      │   │  │
                                      │   │  │
                  ┌───────────────────┘   │  │
                  │                       │  │
                  ▼                       │  │
         ┌──────────────────┐             │  │
         │     Patient      │             │  │
         └──────────────────┘             │  │
                  ▲                       │  │
                  │                       │  │
                  └───────────────────────┘  │
                  ▲                          │
                  │                          │
                  └──────────────────────────┤
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │        User          │
                                  └──────────────────────┘
                                             │
                                             │
                                             ▼
                                  ┌──────────────────────┐
                                  │ ConsultationSession  │
                                  │  (when completed)    │
                                  └──────────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                 BILLING DOMAIN                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────┐
│           Bill               │
├──────────────────────────────┤
│ id (PK)                      │
│ bill_number (unique)         │
│ session_id (FK, optional)    │──────┐
│ patient_id (FK)              │──────┼───┐
│ appointment_id (FK, optional)│──────┼───┼──┐
│ bill_type                    │      │   │  │
│ status                       │      │   │  │
│ subtotal (enc)               │      │   │  │
│ tax_amount (enc)             │      │   │  │
│ discount_amount (enc)        │      │   │  │
│ total_amount (enc)           │      │   │  │
│ paid_amount (enc)            │      │   │  │
│ outstanding_amount (enc)     │      │   │  │
│ currency                     │      │   │  │
│ bill_date                    │      │   │  │
│ due_date                     │      │   │  │
│ line_items (JSON array)      │      │   │  │
│ [                            │      │   │  │
│   {                          │      │   │  │
│     description: "...",      │      │   │  │
│     quantity: 1,             │      │   │  │
│     unit_price: 1000,        │      │   │  │
│     amount: 1000,            │      │   │  │
│     cpt_code: "99201"        │      │   │  │
│   }                          │      │   │  │
│ ]                            │      │   │  │
│ primary_diagnosis_code       │      │   │  │
│ procedure_codes (JSON)       │      │   │  │
│ insurance_claim_number (enc) │      │   │  │
│ insurance_provider (enc)     │      │   │  │
│ payment_history (JSON array) │      │   │  │
│ payment_method               │      │   │  │
│ generated_by (FK)            │──────┼───┼──┼──┐
│ pdf_url                      │      │   │  │  │
│ created_at                   │      │   │  │  │
│ updated_at                   │      │   │  │  │
└──────────────────────────────┘      │   │  │  │
                                      │   │  │  │
              ┌───────────────────────┘   │  │  │
              │                           │  │  │
              ▼                           │  │  │
   ┌──────────────────────┐               │  │  │
   │ ConsultationSession  │               │  │  │
   └──────────────────────┘               │  │  │
              ▲                           │  │  │
              │                           │  │  │
              └───────────────────────────┘  │  │
              ▲                              │  │
              │                              │  │
              └──────────────────────────────┘  │
                                                │
                         ┌──────────────────────┘
                         │
                         ▼
                  ┌──────────────────┐
                  │      User        │
                  │  (generated_by)  │
                  └──────────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           RELATIONSHIP SUMMARY                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. User ──1:1──> UserProfile
   - Each user has exactly one profile

2. User ──1:N──> Patient (created_by)
   - Each doctor creates many patients

3. Patient ──1:N──> ConsultationSession
   - Each patient has many sessions (medical history)

4. User ──1:N──> ConsultationSession (doctor)
   - Each doctor conducts many sessions

5. ConsultationSession ──1:N──> Transcription
   - Each session has transcriptions (usually 1, but supports retries)

6. ConsultationSession ──1:N──> Report
   - Each session can generate multiple reports (versions, types)

7. Transcription ──1:N──> Report
   - Each transcription can be used for multiple report types

8. ReportTemplate ──1:N──> Report
   - Each template is used for many reports

9. User ──1:N──> ReportTemplate
   - Each doctor creates their own templates

10. Patient ──1:N──> Appointment
    - Each patient has many appointments

11. User ──1:N──> Appointment (doctor)
    - Each doctor has many appointments

12. Appointment ──1:1──> ConsultationSession (optional)
    - Completed appointment links to its session

13. ConsultationSession ──1:N──> Bill
    - Each session generates bills (usually 1)

14. Patient ──1:N──> Bill
    - Each patient has many bills

15. Appointment ──1:N──> Bill (optional)
    - Bills can be linked to appointments


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW DIAGRAM                                       │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   Patient   │
│ Registration│
└──────┬──────┘
       │
       │ Creates
       ▼
┌─────────────┐         ┌─────────────┐
│   Patient   │         │ Appointment │
│   Record    │◄────────┤ Scheduling  │
└──────┬──────┘         └─────────────┘
       │                       │
       │                       │ When appointment time
       │                       ▼
       │                ┌─────────────┐
       │                │   Doctor    │
       │                │   Arrives   │
       │                └──────┬──────┘
       │                       │
       │                       │ Starts session
       │                       ▼
       │                ┌─────────────────┐
       └───────────────>│ Consultation    │
                        │    Session      │
                        └──────┬──────────┘
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
         ┌──────────────┐           ┌──────────────┐
         │    Audio     │           │  Real-time   │
         │  Recording   │           │     STT      │
         └──────┬───────┘           └──────┬───────┘
                │                          │
                │ Saves to GCS             │ Generates
                ▼                          ▼
         ┌──────────────┐           ┌──────────────┐
         │ Audio File   │           │Transcription │
         │   (GCS)      │           │    Text      │
         └──────────────┘           └──────┬───────┘
                                           │
                                           │ Feeds into
                                           ▼
                                    ┌──────────────┐
                                    │     AI       │
                                    │   (Gemini)   │
                                    └──────┬───────┘
                                           │
                                           │ Generates
                                           ▼
                                    ┌──────────────┐
                                    │   Medical    │
                                    │    Report    │
                                    │  (Structured)│
                                    └──────┬───────┘
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
                 ┌──────────────┐                     ┌──────────────┐
                 │    Doctor    │                     │   Generate   │
                 │   Reviews    │                     │     Bill     │
                 └──────┬───────┘                     └──────┬───────┘
                        │                                    │
                        │ Approves & Signs                   │
                        ▼                                    ▼
                 ┌──────────────┐                     ┌──────────────┐
                 │    Signed    │                     │   Invoice    │
                 │    Report    │                     │   (PDF)      │
                 └──────┬───────┘                     └──────┬───────┘
                        │                                    │
                        │ Export                             │ Send to patient
                        ▼                                    ▼
                 ┌──────────────┐                     ┌──────────────┐
                 │  PDF Report  │                     │   Payment    │
                 │   Shared     │                     │  Received    │
                 └──────────────┘                     └──────────────┘


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            FIELD ENCRYPTION MAP                                      │
└─────────────────────────────────────────────────────────────────────────────────────┘

🔒 = Encrypted at rest
🔓 = Not encrypted
🔑 = Hash (for searchable encryption)

User:
├─ 🔒 email
├─ 🔓 password_hash (already hashed)
└─ 🔓 role, status fields

UserProfile:
├─ 🔒 first_name, last_name
├─ 🔒 phone
├─ 🔒 license_number, specialization
├─ 🔒 clinic_name, clinic_address
└─ 🔓 logo_url, timezone, language

Patient:
├─ 🔒 first_name, last_name, date_of_birth
├─ 🔒 phone_primary, phone_secondary, email
├─ 🔒 address fields
├─ 🔒 blood_group, allergies, medical_history
├─ 🔒 insurance information
├─ 🔑 name_hash, phone_hash, email_hash (for search)
└─ 🔓 patient_id, created_by, tags, timestamps

ConsultationSession:
├─ 🔒 chief_complaint, notes
└─ 🔓 session_id, status, timestamps, audio_file_url

Transcription:
├─ 🔒 transcript_text, original_transcript
├─ 🔓 segments (JSON), processing_status
└─ 🔓 stt_service, confidence_score

Report:
├─ 🔒 generated_content, manual_corrections
├─ 🔓 structured_data (JSON)
└─ 🔓 status, version, ai_model

Appointment:
├─ 🔒 chief_complaint, notes, preparation_instructions
├─ 🔒 cancellation_reason, reschedule_reason
├─ 🔒 duration_minutes, estimated_cost
└─ 🔓 scheduled_datetime, status, location

Bill:
├─ 🔒 All financial amounts (subtotal, tax, total, paid, outstanding)
├─ 🔒 Insurance information
├─ 🔒 Patient responsibility, copay, deductible
├─ 🔒 Notes, payment instructions
└─ 🔓 bill_number, status, line_items (JSON)


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              INDEX STRATEGY                                          │
└─────────────────────────────────────────────────────────────────────────────────────┘

High-Priority Indexes (Performance Critical):

Patient:
├─ PRIMARY KEY (id)
├─ UNIQUE INDEX (patient_id)
├─ INDEX (name_hash)          -- For encrypted name search
├─ INDEX (phone_hash)         -- For encrypted phone search
├─ INDEX (email_hash)         -- For encrypted email search
├─ INDEX (created_by)         -- Filter patients by doctor
└─ COMPOSITE INDEX (created_by, created_at DESC) -- Doctor's recent patients

ConsultationSession:
├─ PRIMARY KEY (id)
├─ UNIQUE INDEX (session_id)
├─ INDEX (patient_id)         -- Get patient's sessions
├─ INDEX (doctor_id)          -- Get doctor's sessions
├─ INDEX (status)             -- Filter by status
├─ COMPOSITE INDEX (doctor_id, created_at DESC) -- Doctor's recent sessions
└─ COMPOSITE INDEX (patient_id, created_at DESC) -- Patient's session history

Appointment:
├─ PRIMARY KEY (id)
├─ INDEX (patient_id)
├─ INDEX (doctor_id)
├─ INDEX (status)
├─ INDEX (scheduled_datetime)
├─ COMPOSITE INDEX (doctor_id, scheduled_datetime) -- Doctor's schedule
└─ COMPOSITE INDEX (patient_id, scheduled_datetime) -- Patient's appointments

Bill:
├─ PRIMARY KEY (id)
├─ UNIQUE INDEX (bill_number)
├─ INDEX (patient_id)
├─ INDEX (session_id)
├─ INDEX (status)
└─ COMPOSITE INDEX (patient_id, status, created_at DESC) -- Patient billing history

Report:
├─ PRIMARY KEY (id)
├─ INDEX (session_id)
├─ INDEX (transcription_id)
├─ INDEX (template_id)
├─ INDEX (signed_by)
└─ COMPOSITE INDEX (session_id, version DESC) -- Latest report version

Transcription:
├─ PRIMARY KEY (id)
├─ INDEX (session_id)
└─ INDEX (processing_status)  -- Monitor processing queue


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                         CASCADE DELETE RULES                                         │
└─────────────────────────────────────────────────────────────────────────────────────┘

When User is deleted:
└─> UserProfile is deleted (1:1 cascade)

When Patient is deleted:
├─> ConsultationSessions are KEPT (soft delete patient instead)
├─> Appointments are KEPT
└─> Bills are KEPT
    (Medical records must be retained for legal/compliance)

When ConsultationSession is deleted:
├─> Transcriptions are deleted (cascade)
├─> Reports are KEPT (medical record)
└─> Bills are KEPT (financial record)

When ReportTemplate is deleted:
└─> Reports are KEPT (template can be archived, reports preserved)

Best Practice: Use SOFT DELETE for:
- Patients (mark as inactive, retain records)
- Users (mark as inactive, preserve audit trail)
- Reports (mark as archived)
- Bills (mark as cancelled)


┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            SECURITY NOTES                                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

1. All PII fields use EncryptedType (AES encryption)
2. Searchable encrypted fields use SHA-256 hashing
3. Row-level security: Users can only access their own data
4. Audit logging for all data access and modifications
5. JWT authentication with role-based access control
6. MFA support for enhanced security
7. Password hashing with bcrypt
8. API rate limiting to prevent abuse
9. HTTPS required in production
10. Regular security audits and penetration testing
```

## Database Cardinality Legend

- **1:1** - One-to-One relationship
- **1:N** - One-to-Many relationship  
- **N:1** - Many-to-One relationship
- **N:M** - Many-to-Many relationship (not used in current schema)

## Table Size Estimates (for production planning)

Assuming **1 doctor, 100 patients, 500 sessions/year**:

| Table | Rows/Year | Growth Rate | Storage Impact |
|-------|-----------|-------------|----------------|
| User | ~5 | Low | Minimal |
| UserProfile | ~5 | Low | Minimal |
| Patient | ~100 | Medium | Low (encrypted PII) |
| ConsultationSession | ~500 | High | Medium (metadata only) |
| Transcription | ~500 | High | **HIGH** (large text fields) |
| Report | ~500 | High | **HIGH** (large text + JSON) |
| Appointment | ~750 | High | Low (mostly metadata) |
| Bill | ~500 | High | Medium (JSON line items) |
| ReportTemplate | ~10 | Very Low | Minimal |

**Storage Optimization Tips:**
- Archive old transcriptions/reports to cold storage after 2 years
- Compress audio files and store in GCS with lifecycle policies
- Use database partitioning for large tables (sessions, transcriptions, reports)
- Consider read replicas for reporting queries
