# Quick Test Guide - Receptionist Workflow

## ✅ Prerequisites
- Database migration applied (DONE)
- Backend running on port 8080
- Frontend running on port 3000

## 🧪 Test Scenario: Complete Workflow

### Test User Accounts

Create these test accounts for testing:

```sql
-- Doctor account (if not exists)
-- Email: doctor@test.com
-- Password: Test1234!

-- Receptionist will be created via invitation
```

### Step-by-Step Test

#### 1. Doctor Invites Receptionist (2 minutes)

**URL:** `http://localhost:3000/dashboard/settings/staff`

**Actions:**
1. Login as doctor
2. Navigate to Settings → Staff
3. Enter email: `receptionist@test.com`
4. Click "Send Invite"
5. **Copy the invitation URL from:**
   - Email (if SMTP configured)
   - Backend logs: `tail -f backend.log | grep "invitation"`
   - Or construct manually: `http://localhost:3000/invite/{token}`

**Expected Result:**
- ✅ Success toast: "Invitation sent to receptionist@test.com"
- ✅ Email appears in "Pending Invitations" table
- ✅ Invitation URL generated

---

#### 2. Receptionist Accepts Invitation (2 minutes)

**URL:** `http://localhost:3000/invite/{token}` (use token from step 1)

**Actions:**
1. Open invitation URL in new incognito window
2. Verify page shows:
   - Doctor's name
   - Clinic name (if set)
   - Role description
3. Create password: `Test1234!`
4. Confirm password: `Test1234!`
5. Click "Create Account"

**Expected Result:**
- ✅ Account created successfully
- ✅ Auto-login with JWT tokens
- ✅ Redirected to dashboard
- ✅ User role is "receptionist"

---

#### 3. Receptionist Creates Patient - Stage 1 (3 minutes)

**URL:** `http://localhost:3000/dashboard/patients/new-demographics`

**Actions:**
1. Login as receptionist (if not already)
2. Navigate to "New Patient" or use URL above
3. Fill in the form:

```
Basic Information:
- First Name: John
- Last Name: Doe
- Date of Birth: 1980-01-15
- Gender: Male

Contact Information:
- Primary Phone: +1-555-0123
- Secondary Phone: +1-555-0124
- Email: john.doe@email.com

Address:
- Address Line 1: 123 Main Street
- City: New York
- State: NY
- Postal Code: 10001

Emergency Contact:
- Name: Jane Doe
- Phone: +1-555-0125
- Relationship: Spouse

Insurance:
- Provider: Blue Cross
- Policy Number: BC123456
- Group Number: GRP789
```

4. Click "Save Patient Demographics"

**Expected Result:**
- ✅ Success toast: "Patient demographics saved successfully!"
- ✅ Redirected to patient list
- ✅ Patient created with `profile_status='DEMOGRAPHICS_ONLY'`
- ✅ Patient visible in receptionist's patient list

---

#### 4. Doctor Reviews Pending Patients (1 minute)

**URL:** `http://localhost:3000/dashboard/patients/pending-review`

**Actions:**
1. Logout receptionist
2. Login as doctor
3. Navigate to "Pending Review" or use URL above

**Expected Result:**
- ✅ John Doe appears in pending patients table
- ✅ Shows: Patient ID, Name, Age (44), Gender, Phone
- ✅ Shows "Created By: {receptionist name}"
- ✅ "Complete Profile" button visible

---

#### 5. Doctor Completes Clinical Info - Stage 2 (3 minutes)

**URL:** `http://localhost:3000/dashboard/patients/{id}/complete-clinical`

**Actions:**
1. From pending review page, click "Complete Profile" for John Doe
2. Verify demographics summary is displayed (read-only)
3. Fill in clinical information:

```
Clinical Information:
- Blood Group: A+
- Allergies: Penicillin, Peanuts
- Medical History: 
  * Hypertension diagnosed 2015
  * Type 2 Diabetes diagnosed 2018
  * Appendectomy 2010
- Current Medications:
  * Lisinopril 10mg once daily
  * Metformin 500mg twice daily
- Clinical Notes:
  * Patient reports good medication compliance
  * Blood pressure well controlled
  * Last HbA1c: 6.8%
- Tags: chronic-disease, follow-up-3months
```

4. Click "Complete Clinical Profile"

**Expected Result:**
- ✅ Success toast: "Clinical information saved successfully!"
- ✅ Redirected to main patient list
- ✅ Patient status changed to `CLINICAL_INFO_COMPLETE`
- ✅ Patient no longer appears in pending review
- ✅ Patient appears in main patient list with full profile

---

## 🔍 Verification Queries

Run these SQL queries to verify the workflow:

```sql
-- 1. Check receptionist was created with invited_by_id
SELECT id, email, role, invited_by_id, created_at 
FROM users 
WHERE email LIKE '%receptionist@test.com%';

-- 2. Check patient was created with correct status
SELECT id, patient_id, first_name, last_name, profile_status, created_by 
FROM patients 
WHERE first_name = 'John' AND last_name = 'Doe';

-- 3. Check patient status changed after clinical completion
SELECT patient_id, first_name, last_name, profile_status, 
       blood_group, allergies, medical_history 
FROM patients 
WHERE patient_id = 'PAT-XXXXXX';  -- Use actual patient_id

-- 4. Verify clinic isolation (receptionist linked to doctor)
SELECT 
    r.id as receptionist_id,
    r.email as receptionist_email,
    d.id as doctor_id,
    d.email as doctor_email
FROM users r
JOIN users d ON r.invited_by_id = d.id
WHERE r.role = 'receptionist';

-- 5. Check invitation was deleted after acceptance
SELECT * FROM staff_invitations 
WHERE recipient_email = 'receptionist@test.com';
-- Should return 0 rows (deleted after acceptance)
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "Invalid invitation token"
**Cause:** Token expired or already used
**Solution:** 
- Tokens expire after 7 days
- Tokens are single-use (deleted after acceptance)
- Generate a new invitation

### Issue 2: "Failed to load patient information"
**Cause:** RBAC blocking access
**Solution:**
- Verify user role is correct
- Check patient was created by same clinic
- Check `invited_by_id` relationship

### Issue 3: "Database schema is out of sync"
**Cause:** Migration not applied
**Solution:**
```bash
cd backend
alembic current  # Should show: 9691ddd22bb4
alembic upgrade head  # If not at latest
```

### Issue 4: Can't see pending patients
**Cause:** Patient status not set correctly
**Solution:**
```sql
-- Check patient status
SELECT patient_id, profile_status FROM patients;

-- Manually set if needed (for testing)
UPDATE patients 
SET profile_status = 'DEMOGRAPHICS_ONLY' 
WHERE patient_id = 'PAT-XXXXXX';
```

---

## 📊 Success Metrics

After completing the test, verify:

- [ ] Receptionist account created via invitation
- [ ] Receptionist linked to doctor (`invited_by_id` set)
- [ ] Patient created with demographics only
- [ ] Patient appears in pending review for doctor
- [ ] Doctor can complete clinical information
- [ ] Patient status changes to complete
- [ ] Patient no longer in pending review
- [ ] Receptionist cannot access clinical data
- [ ] Clinic isolation working (cross-clinic access denied)

---

## 🎯 Performance Test

Test with multiple patients:

```bash
# Create 10 test patients via receptionist
# Then complete them via doctor
# Measure time for each stage
```

**Expected Performance:**
- Stage 1 (Demographics): < 30 seconds
- Stage 2 (Clinical): < 45 seconds
- Total per patient: < 2 minutes

---

## 🔒 Security Test

### Test RBAC Enforcement

1. **Receptionist tries to access clinical endpoint:**
```bash
# Should return 403 Forbidden
curl -X GET http://localhost:8080/api/v1/patients/v2/{id}/complete \
  -H "Authorization: Bearer {receptionist_token}"
```

2. **Receptionist tries to complete clinical info:**
```bash
# Should return 403 Forbidden
curl -X PUT http://localhost:8080/api/v1/patients/v2/{id}/clinical-info \
  -H "Authorization: Bearer {receptionist_token}" \
  -H "Content-Type: application/json" \
  -d '{"bloodGroup": "A+"}'
```

3. **Cross-clinic access test:**
- Create patient with Doctor A's receptionist
- Try to access with Doctor B
- Should return 403 or 404

---

## 📝 Test Report Template

```markdown
# Receptionist Workflow Test Report

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Local/Staging/Production]

## Test Results

### 1. Staff Invitation
- [ ] Invitation sent successfully
- [ ] Email received (if configured)
- [ ] Token generated correctly
- **Issues:** None / [Describe]

### 2. Invitation Acceptance
- [ ] Token validated correctly
- [ ] Account created successfully
- [ ] Auto-login worked
- [ ] Role set to receptionist
- **Issues:** None / [Describe]

### 3. Patient Demographics (Stage 1)
- [ ] Form loads correctly
- [ ] All fields save properly
- [ ] Patient created with correct status
- [ ] Receptionist can view patient
- **Issues:** None / [Describe]

### 4. Pending Review
- [ ] Doctor can see pending patients
- [ ] Correct patient information displayed
- [ ] Created by receptionist shown
- **Issues:** None / [Describe]

### 5. Clinical Completion (Stage 2)
- [ ] Demographics displayed correctly
- [ ] Clinical form saves properly
- [ ] Patient status updated
- [ ] Patient removed from pending
- **Issues:** None / [Describe]

### 6. Security & RBAC
- [ ] Receptionist cannot access clinical data
- [ ] Clinic isolation working
- [ ] Cross-clinic access denied
- **Issues:** None / [Describe]

## Overall Status
- [ ] All tests passed
- [ ] Minor issues (non-blocking)
- [ ] Major issues (blocking)

## Notes
[Additional observations]
```

---

## 🚀 Ready to Test!

Everything is set up and ready. Follow the steps above to test the complete receptionist workflow. The entire test should take approximately 15-20 minutes.

**Good luck! 🎉**
