# Design Document

## Overview

The Receptionist Workflow system implements a comprehensive two-stage patient registration process with role-based access control (RBAC) and clinic isolation. The system enables doctors to invite receptionists via secure email invitations, allowing receptionists to handle administrative patient registration while doctors complete clinical information. The architecture ensures data security through field-level encryption, proper access control, and clinic-based data isolation.

### Key Design Principles

1. **Separation of Concerns**: Clear distinction between administrative (demographics) and clinical data
2. **Security by Default**: All PII encrypted at rest, RBAC enforced at API level
3. **Clinic Isolation**: Data access restricted to users within the same clinic
4. **Progressive Enhancement**: Two-stage workflow allows parallel work between receptionists and doctors
5. **Fail-Safe Design**: Graceful error handling with transaction rollbacks

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Next.js)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Staff Mgmt   │  │ Patient Reg  │  │ Clinical     │      │
│  │ (Doctor)     │  │ (Receptionist│  │ Completion   │      │
│  │              │  │  + Doctor)   │  │ (Doctor)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (FastAPI)                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Staff API    │  │ Patient V2   │  │ Auth/RBAC    │      │
│  │ /staff/*     │  │ /patients/v2 │  │ Middleware   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Dependencies │  │ Encryption   │  │ Email        │      │
│  │ (RBAC)       │  │ Service      │  │ Service      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQLAlchemy ORM
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database (PostgreSQL)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ users        │  │ patients     │  │ staff_       │      │
│  │ (invited_by) │  │ (profile_    │  │ invitations  │      │
│  │              │  │  status)     │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Staff Invitation Flow
```
Doctor → Staff Invite Form → POST /staff/invite
  → Create StaffInvitation (token, expires_at)
  → Send Email (invitation URL)
  → Display Pending Invitations

Receptionist → Invitation URL → GET /staff/invite/{token}/status
  → Validate Token
  → Display Invitation Details
  → POST /staff/accept-invite/{token}
  → Create User (role=receptionist, invited_by_id)
  → Delete Invitation Token
  → Auto-login with JWT
  → Redirect to Dashboard
```

#### Two-Stage Patient Registration Flow
```
Stage 1 (Receptionist or Doctor):
  Demographics Form → POST /patients/v2/demographics
    → Create Patient (profile_status=DEMOGRAPHICS_ONLY)
    → Encrypt PII fields
    → Generate search hashes
    → Set created_by = current_user.id

Stage 2 (Doctor Only):
  Pending Review → GET /patients/v2/pending-clinical-review
    → Filter by clinic (created_by in [doctor, receptionists])
    → Display pending patients
  
  Complete Clinical → GET /patients/v2/{id}/demographics
    → Display read-only demographics
  
  Clinical Form → PUT /patients/v2/{id}/clinical-info
    → Update Patient (clinical fields)
    → Set profile_status=CLINICAL_INFO_COMPLETE
    → Remove from pending list
```

## Components and Interfaces

### Backend Components

#### 1. Staff Management API (`/staff/*`)

**Endpoints:**
- `POST /staff/invite` - Create invitation (Doctor only)
- `GET /staff/invite/{token}/status` - Check invitation validity (Public)
- `POST /staff/accept-invite/{token}` - Accept invitation (Public)
- `GET /staff/list` - List clinic staff (Doctor only)
- `GET /staff/pending-invitations` - List pending invitations (Doctor only)

**Key Implementation Details:**
```python
# Invitation creation with token generation
invitation = StaffInvitation(
    inviter_id=current_user.id,
    recipient_email=email.lower(),
    token=secrets.token_urlsafe(32),  # Secure random token
    expires_at=datetime.utcnow() + timedelta(days=7)
)

# Clinic isolation check
if creator.id != current_user.id and creator.invited_by_id != current_user.id:
    raise HTTPException(status_code=403, detail="Access denied")
```

**Gap Identified:** No mechanism to revoke pending invitations. If a doctor sends an invitation by mistake, they cannot cancel it.

#### 2. Patient V2 API (`/patients/v2/*`)

**Endpoints:**
- `POST /patients/v2/demographics` - Create demographics (Doctor + Receptionist)
- `PUT /patients/v2/{id}/clinical-info` - Complete clinical (Doctor only)
- `GET /patients/v2/pending-clinical-review` - List pending (Doctor only)
- `GET /patients/v2/{id}/demographics` - Get demographics (Doctor + Receptionist)
- `GET /patients/v2/{id}/complete` - Get complete profile (Doctor only)

**Key Implementation Details:**
```python
# Two-stage status management
class ProfileStatus(str, Enum):
    DEMOGRAPHICS_ONLY = "DEMOGRAPHICS_ONLY"
    CLINICAL_INFO_COMPLETE = "CLINICAL_INFO_COMPLETE"

# Clinic isolation for pending patients
receptionist_ids = db.query(User.id).filter(
    User.invited_by_id == current_user.id,
    User.role == UserRole.RECEPTIONIST.value
).all()
creator_ids = [current_user.id] + [r[0] for r in receptionist_ids]

patients = db.query(Patient).filter(
    Patient.profile_status == ProfileStatus.DEMOGRAPHICS_ONLY.value,
    Patient.created_by.in_(creator_ids)
).all()
```

**Gap Identified:** No endpoint to update patient demographics after initial creation. If receptionist makes a mistake, only a doctor can fix it by accessing the database directly.

#### 3. RBAC Dependencies (`dependencies.py`)

**Key Functions:**
- `require_doctor()` - Enforces doctor role
- `require_receptionist()` - Enforces receptionist role
- `require_doctor_or_receptionist()` - Allows both roles
- `get_current_user()` - Validates JWT and loads user

**Implementation:**
```python
async def require_doctor_or_receptionist(
    current_user: User = Depends(get_current_active_user)
) -> User:
    if current_user.role not in [UserRole.DOCTOR.value, UserRole.RECEPTIONIST.value]:
        raise ForbiddenException("Doctor or Receptionist access required")
    return current_user
```

**Gap Identified:** No helper function to check clinic membership. Clinic isolation logic is duplicated across endpoints.

#### 4. Encryption Service

**Implementation:**
```python
class EncryptedType(TypeDecorator):
    impl = String
    cache_ok = True
    
    def process_bind_param(self, value, dialect):
        if value is not None:
            return encrypt_field(value)
        return value
    
    def process_result_value(self, value, dialect):
        if value is not None:
            return decrypt_field(value)
        return value
```

**Gap Identified:** Encryption errors are not handled gracefully. If encryption key changes or data is corrupted, the entire request fails with a 500 error instead of returning partial data or a specific error message.

### Frontend Components

#### 1. Staff Management Page (`/dashboard/settings/staff`)

**Features:**
- Invitation form with email validation
- Pending invitations table
- Active staff members table
- Real-time status updates

**Key Implementation:**
```typescript
const handleInvite = async (e: React.FormEvent) => {
    const response = await apiClient.inviteStaff(email);
    toast.success(`Invitation sent to ${email}`);
    await loadStaffData();  // Refresh lists
};
```

**Gap Identified:** No way to copy invitation URL manually if email fails. The URL is only in backend logs.

#### 2. Invitation Acceptance Page (`/invite/[token]`)

**Features:**
- Token validation on page load
- Display invitation details (doctor name, clinic name)
- Password creation form with validation
- Auto-login after account creation

**Key Implementation:**
```typescript
useEffect(() => {
    checkInvitationStatus();  // Validate token immediately
}, [token]);

const handleSubmit = async (e: React.FormEvent) => {
    const response = await apiClient.acceptInvitation(token, password, confirmPassword);
    apiClient.setAuthTokens(response.accessToken, response.refreshToken);
    router.push('/dashboard');
};
```

**Gap Identified:** No indication of password strength requirements beyond "minimum 8 characters". Users might create weak passwords.

#### 3. Demographics Registration Page (`/dashboard/patients/new-demographics`)

**Features:**
- Comprehensive form with all demographic fields
- Required field validation
- Organized sections (Basic Info, Contact, Address, Emergency, Insurance)
- Success feedback and redirect

**Gap Identified:** No auto-save or draft functionality. If user accidentally navigates away, all data is lost.

#### 4. Pending Review Page (`/dashboard/patients/pending-review`)

**Features:**
- Table of patients with DEMOGRAPHICS_ONLY status
- Display creator name (receptionist who registered)
- "Complete Profile" button for each patient
- Empty state when no pending patients

**Key Implementation:**
```typescript
const loadPendingPatients = async () => {
    const data = await apiClient.getPendingPatients();
    setPatients(data);
};
```

**Gap Identified:** No search or filter functionality. With many pending patients, finding a specific one is difficult.

#### 5. Clinical Completion Page (`/dashboard/patients/[id]/complete-clinical`)

**Features:**
- Read-only demographics summary
- Clinical information form (blood group, allergies, medical history, medications)
- Notes and tags fields
- Success feedback and redirect

**Gap Identified:** No validation for clinical fields. Doctor could submit empty clinical info, defeating the purpose of Stage 2.

### Frontend Middleware

**Implementation:**
```typescript
const publicPaths = [
    '/', '/auth/login', '/auth/signup', '/invite', ...
];

if (!token && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
}
```

**Gap Identified:** Middleware doesn't check user role. A receptionist could theoretically access doctor-only routes if they guess the URL (though backend RBAC would block the API calls).

## Data Models

### User Model

```python
class User(BaseModel):
    email = Column(EncryptedType(255), nullable=False)
    email_hash = Column(String(64), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default=UserRole.DOCTOR.value)
    invited_by_id = Column(String(36), ForeignKey("users.id"), nullable=True, index=True)
    
    # Relationships
    invited_by = relationship("User", remote_side="User.id", foreign_keys=[invited_by_id])
    invited_staff = relationship("User", foreign_keys="User.invited_by_id", 
                                remote_side=[invited_by_id], overlaps="invited_by")
```

**Design Decision:** `invited_by_id` creates a clinic hierarchy. Receptionists are linked to their inviting doctor, enabling clinic isolation.

**Gap Identified:** No `clinic_id` field. Current design assumes one doctor = one clinic, but doesn't support multi-doctor clinics or doctor transfers.

### Patient Model

```python
class Patient(BaseModel):
    patient_id = Column(String(20), unique=True, nullable=False, index=True)
    
    # Demographics (encrypted)
    first_name = Column(EncryptedType(100), nullable=False)
    last_name = Column(EncryptedType(100), nullable=False)
    date_of_birth = Column(EncryptedType(20), nullable=False)
    gender = Column(EncryptedType(30), nullable=False)
    
    # Clinical (encrypted)
    blood_group = Column(EncryptedType(10), nullable=True)
    allergies = Column(EncryptedType(1000), nullable=True)
    medical_history = Column(EncryptedType(5000), nullable=True)
    current_medications = Column(EncryptedType(2000), nullable=True)
    
    # System fields
    created_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    profile_status = Column(String(30), nullable=False, 
                           default=ProfileStatus.DEMOGRAPHICS_ONLY.value, index=True)
    
    # Search hashes
    name_hash = Column(String(64), nullable=False, index=True)
    phone_hash = Column(String(64), nullable=True, index=True)
    email_hash = Column(String(64), nullable=True, index=True)
```

**Design Decision:** Separate encrypted fields and search hashes enable secure storage while maintaining search capability.

**Gap Identified:** No `updated_by` field. Cannot track who made the last update (important for audit trail).

### StaffInvitation Model

```python
class StaffInvitation(BaseModel):
    inviter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    recipient_email = Column(String(255), nullable=False)
    token = Column(String(255), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime(timezone=True), nullable=False)
    
    def is_expired(self) -> bool:
        return datetime.now(timezone.utc) > self.expires_at
```

**Design Decision:** Single-use tokens with 7-day expiration. Tokens are deleted after acceptance.

**Gap Identified:** No `accepted_at` or `revoked_at` fields. Cannot track invitation history or audit who accepted when.

## Error Handling

### Backend Error Handling

**Current Implementation:**
```python
try:
    # Operation
    db.commit()
except HTTPException:
    raise
except Exception as e:
    logger.error(f"Error: {str(e)}", exc_info=True)
    db.rollback()
    raise HTTPException(status_code=500, detail="Failed to ...")
```

**Strengths:**
- Transaction rollback on errors
- Logging with stack traces
- Generic error messages to prevent information leakage

**Gap Identified:** No distinction between different error types. Database constraint violations, encryption errors, and business logic errors all return generic 500 errors.

### Frontend Error Handling

**Current Implementation:**
```typescript
try {
    await apiClient.someOperation();
    toast.success('Success message');
} catch (error: any) {
    const message = error.response?.data?.detail || 'Generic error';
    toast.error(message);
}
```

**Gap Identified:** No retry logic for transient failures. Network errors or temporary backend issues require manual page refresh.

## Testing Strategy

### Unit Tests (Recommended)

**Backend:**
1. **Model Tests**
   - Test encryption/decryption of PII fields
   - Test search hash generation
   - Test clinic isolation queries
   - Test invitation expiration logic

2. **API Tests**
   - Test RBAC enforcement (403 for wrong roles)
   - Test clinic isolation (403 for cross-clinic access)
   - Test two-stage workflow state transitions
   - Test invitation token validation

3. **Service Tests**
   - Test email service with mock SMTP
   - Test encryption service with test keys
   - Test JWT token generation and validation

**Frontend:**
1. **Component Tests**
   - Test form validation
   - Test role-based UI rendering
   - Test error state handling
   - Test loading states

2. **Integration Tests**
   - Test complete invitation flow
   - Test complete patient registration flow
   - Test navigation between stages

### Manual Testing Checklist

Based on `TEST_RECEPTIONIST_WORKFLOW.md`:

1. ✅ Doctor invites receptionist
2. ✅ Receptionist accepts invitation
3. ✅ Receptionist creates patient demographics
4. ✅ Doctor views pending patients
5. ✅ Doctor completes clinical information
6. ✅ Patient removed from pending list
7. ✅ RBAC enforcement (receptionist cannot access clinical endpoints)
8. ✅ Clinic isolation (cross-clinic access denied)

**Gap Identified:** No automated end-to-end tests. All testing is manual, which is time-consuming and error-prone.

## Security Considerations

### Authentication & Authorization

**Implemented:**
- JWT-based authentication with access and refresh tokens
- Role-based access control at API level
- Middleware authentication for protected routes
- Token expiration and validation

**Gap Identified:** No token refresh mechanism in frontend. When access token expires, user is logged out instead of silently refreshing.

### Data Encryption

**Implemented:**
- Field-level encryption for all PII
- Automatic encryption/decryption via SQLAlchemy TypeDecorator
- Search hashes for encrypted fields
- Separate email_hash for user lookups

**Gaps Identified:**
1. No key rotation mechanism. If encryption key is compromised, all data must be re-encrypted manually.
2. No encryption key per clinic. All clinics share the same encryption key.
3. Encryption errors crash the entire request instead of graceful degradation.

### Clinic Isolation

**Implemented:**
- `invited_by_id` relationship chain
- Query filtering by `created_by` and receptionist IDs
- RBAC checks before data access

**Gap Identified:** Clinic isolation logic is duplicated across endpoints. Should be centralized in a helper function or middleware.

### Input Validation

**Implemented:**
- Pydantic schemas for request validation
- Email validation
- Password minimum length (8 characters)
- Frontend form validation

**Gaps Identified:**
1. No password complexity requirements (uppercase, numbers, special characters)
2. No email domain validation (could invite personal emails instead of professional)
3. No phone number format validation
4. No date range validation (could enter future date of birth)

## Performance Considerations

### Database Queries

**Current Implementation:**
- Indexed fields: `email_hash`, `patient_id`, `name_hash`, `phone_hash`, `profile_status`, `invited_by_id`
- Eager loading of relationships where needed
- Pagination support (though not used in frontend)

**Gap Identified:** Pending patients query loads all receptionists first, then queries patients. Could be optimized with a single JOIN query.

### Encryption Performance

**Current Implementation:**
- Encryption happens on every field access
- No caching of decrypted values

**Gap Identified:** Repeated access to encrypted fields (e.g., in loops) causes redundant decryption. Should cache decrypted values within request context.

### Frontend Performance

**Current Implementation:**
- Client-side rendering with React
- API calls on component mount
- Loading states during data fetch

**Gaps Identified:**
1. No pagination in patient lists. With 1000+ patients, page load will be slow.
2. No debouncing on search inputs (if search is added).
3. No optimistic UI updates. Every action requires server round-trip.

## Deployment Considerations

### Environment Variables

**Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `ENCRYPTION_KEY` - Fernet encryption key
- `JWT_SECRET_KEY` - JWT signing key
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` - Email configuration
- `FRONTEND_URL` - For invitation URLs

**Gap Identified:** No documentation of required environment variables. Developers must read code to find them.

### Database Migrations

**Current Implementation:**
- Alembic migrations for schema changes
- Migration `9691ddd22bb4` adds `staff_invitations` table, `invited_by_id`, and `profile_status`

**Gap Identified:** No rollback testing. If migration fails halfway, manual intervention required.

### Email Delivery

**Current Implementation:**
- SMTP-based email sending
- Graceful fallback: logs invitation URL if email fails
- Email service returns boolean success status

**Gap Identified:** No email queue or retry mechanism. If SMTP is temporarily down, invitations are lost.

## Identified Gaps and Improvements

### Critical Gaps

1. **No invitation revocation** - Cannot cancel pending invitations
2. **No demographics update endpoint** - Cannot fix receptionist mistakes
3. **No clinic membership helper** - Clinic isolation logic duplicated
4. **No encryption error handling** - Crashes on encryption failures
5. **No token refresh mechanism** - Users logged out on token expiry

### Important Gaps

6. **No invitation URL copy button** - Must check backend logs if email fails
7. **No password strength indicator** - Users create weak passwords
8. **No auto-save in forms** - Data lost on accidental navigation
9. **No search/filter in pending patients** - Hard to find specific patient
10. **No clinical field validation** - Can submit empty clinical info
11. **No audit trail** - Cannot track who updated what when
12. **No automated tests** - All testing is manual

### Nice-to-Have Improvements

13. **No pagination in patient lists** - Performance issue with many patients
14. **No optimistic UI updates** - Slow user experience
15. **No email queue** - Lost invitations if SMTP down
16. **No key rotation** - Security risk if key compromised
17. **No multi-doctor clinics** - Cannot support group practices
18. **No role-based frontend routing** - Receptionists can see doctor URLs (though blocked by backend)

## Design Decisions and Rationales

### Why Two-Stage Registration?

**Decision:** Split patient registration into demographics (Stage 1) and clinical (Stage 2).

**Rationale:**
- Allows parallel work: receptionist handles intake while doctor sees other patients
- Enforces separation of duties: receptionists don't need clinical training
- Improves data quality: doctors review demographics before adding clinical data
- Supports compliance: clinical data access restricted to licensed professionals

### Why Invitation-Based Onboarding?

**Decision:** Receptionists cannot self-register; must be invited by a doctor.

**Rationale:**
- Establishes clinic hierarchy automatically
- Prevents unauthorized access to patient data
- Ensures receptionists are linked to a specific doctor/clinic
- Provides audit trail of who invited whom

### Why Field-Level Encryption?

**Decision:** Encrypt individual fields rather than entire database.

**Rationale:**
- Allows selective decryption (e.g., show name but not medical history)
- Enables search via hashes without decrypting all data
- Reduces attack surface (compromised backup doesn't expose all data)
- Supports compliance with HIPAA/GDPR requirements

### Why Profile Status Enum?

**Decision:** Use explicit status field rather than checking if clinical fields are null.

**Rationale:**
- Clear state machine: DEMOGRAPHICS_ONLY → CLINICAL_INFO_COMPLETE
- Efficient querying: indexed status field faster than checking multiple nulls
- Extensible: can add more states (e.g., PENDING_VERIFICATION, ARCHIVED)
- Explicit intent: null fields could be missing data vs. incomplete workflow

### Why Single-Use Invitation Tokens?

**Decision:** Delete invitation token after acceptance.

**Rationale:**
- Prevents token reuse if intercepted
- Reduces database clutter
- Forces new invitation if first one fails
- Clear audit trail (invitation accepted = token deleted)

## Conclusion

The Receptionist Workflow system is well-designed and mostly complete. The core functionality works as intended:
- Staff invitation and onboarding ✅
- Two-stage patient registration ✅
- Role-based access control ✅
- Clinic isolation ✅
- Data encryption ✅

However, several gaps exist that should be addressed:
- **Critical**: Invitation revocation, demographics updates, encryption error handling
- **Important**: Search/filter, audit trail, automated tests
- **Nice-to-have**: Pagination, optimistic UI, email queue

The next phase (implementation plan) will prioritize these gaps and create actionable tasks to address them.
