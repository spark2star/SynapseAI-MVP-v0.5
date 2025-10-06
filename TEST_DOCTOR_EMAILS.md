# 🧪 Doctor Email Notifications - Testing Guide

## 📋 Quick Start

The doctor approval and rejection email notifications have been implemented. Follow these steps to test them.

---

## 🔧 Method 1: Test Script (Standalone)

### Step 1: Update Test Email Address

Edit `backend/test_doctor_emails.py` and change the test email:

```python
# Line ~16 and ~57
"to_email": "YOUR_EMAIL@gmail.com",  # ← Change this
```

### Step 2: Run Test Script

```bash
cd backend
python test_doctor_emails.py
```

### Step 3: Check Your Email Inbox

You should receive:
1. ✅ Approval email with temp password
2. ✅ Rejection email with reason

---

## 🌐 Method 2: Full Integration Test (Recommended)

### Step 1: Start Backend

```bash
cd backend
source venv/bin/activate  # If using virtual environment
python -m uvicorn app.main:app --reload --port 8000
```

### Step 2: Create Test Doctor Account

Use the frontend or API to create a doctor account:

**Via API:**
```bash
curl -X POST http://localhost:8000/api/v1/auth/register/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testdoctor@gmail.com",
    "password": "TestPass123!",
    "full_name": "Dr. Test Doctor",
    "medical_registration_number": "TEST123456",
    "state_medical_council": "Maharashtra Medical Council",
    "phone_number": "+91 9876543210"
  }'
```

**Via Frontend:**
1. Go to `http://localhost:3000/auth/register`
2. Select "Doctor" role
3. Fill in registration form
4. Submit

### Step 3: Login as Admin

```bash
# Login to get admin token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@synapseai.com",
    "password": "your_admin_password"
  }'
```

Save the returned `access_token`.

### Step 4: Test Approval

```bash
# Get the doctor's user_id from the registration response or database
DOCTOR_ID="<doctor_user_id>"
ADMIN_TOKEN="<access_token_from_step_3>"

curl -X POST http://localhost:8000/api/v1/admin/applications/${DOCTOR_ID}/approve \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "doctorUserId": "'${DOCTOR_ID}'"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Doctor application approved successfully",
    "doctor_id": "uuid-here",
    "doctor_email": "testdoctor@gmail.com",
    "temporary_password": "Abc123XYZ789",  // ✅ Will be returned!
    "email_sent": true,
    "request_id": "abc12345"
  }
}
```

**Check Email:**
- ✅ Doctor should receive approval email
- ✅ Email contains temporary password
- ✅ Email has login instructions

### Step 5: Test Rejection

Create another test doctor account, then:

```bash
DOCTOR_ID="<new_doctor_user_id>"
ADMIN_TOKEN="<access_token>"

curl -X POST http://localhost:8000/api/v1/admin/applications/${DOCTOR_ID}/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -d '{
    "doctorUserId": "'${DOCTOR_ID}'",
    "rejection_reason": "Medical registration number could not be verified with the State Medical Council."
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "data": {
    "message": "Doctor application rejected",
    "doctor_id": "uuid-here",
    "email_sent": true,
    "request_id": "abc12345"
  }
}
```

**Check Email:**
- ✅ Doctor should receive rejection email
- ✅ Email contains rejection reason
- ✅ Email has contact information

---

## 🎯 Method 3: Frontend Testing (Most Realistic)

### Step 1: Start Both Frontend and Backend

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Step 2: Register as Doctor

1. Open browser: `http://localhost:3000`
2. Go to Register → Doctor
3. Fill in form with **your real email** (so you can check inbox)
4. Submit registration

### Step 3: Login as Admin

1. Go to: `http://localhost:3000/auth/login`
2. Login with admin credentials
3. Navigate to: `http://localhost:3000/admin/applications`

### Step 4: Test Approval

1. Find the pending doctor application
2. Click "Approve" button
3. Confirm in modal
4. **Check:**
   - ✅ Success toast appears
   - ✅ Application status changes to "Verified"
   - ✅ Check doctor's email inbox
   - ✅ Approval email received with temp password

### Step 5: Test Rejection

1. Create another test doctor account
2. Find it in admin applications list
3. Click "Reject" button
4. Enter rejection reason (min 10 chars)
5. Confirm in modal
6. **Check:**
   - ✅ Success toast appears
   - ✅ Application status changes to "Rejected"
   - ✅ Check doctor's email inbox
   - ✅ Rejection email received with reason

---

## 📧 Email Checklist

### Approval Email Should Have:
- ✅ Subject: "🎉 Your SynapseAI Doctor Account Has Been Approved"
- ✅ Green-themed header with "Congratulations!"
- ✅ Doctor's name (Dear Dr. [Name])
- ✅ Login email in credentials box
- ✅ Temporary password in credentials box
- ✅ Security warning about password change
- ✅ 4-step onboarding guide
- ✅ "Login to Dashboard" button
- ✅ Pro tip about saving password
- ✅ Support contact email

### Rejection Email Should Have:
- ✅ Subject: "Update on Your SynapseAI Doctor Application"
- ✅ Gray-themed header
- ✅ Doctor's name (Dear Dr. [Name])
- ✅ Polite rejection message
- ✅ Rejection reason in highlighted box
- ✅ "What This Means" section
- ✅ Contact information box
- ✅ Reapplication information
- ✅ Professional closing

---

## 🔍 Troubleshooting

### Email Not Received?

**Check 1: Spam/Junk Folder**
```
Look in:
- Gmail: Spam folder
- Outlook: Junk folder
- Other: Spam/Junk folder
```

**Check 2: SMTP Configuration**
```bash
cd backend
python -c "from app.services.email_service import email_service; print(f'SMTP: {email_service.smtp_user}')"
```

**Check 3: Backend Logs**
```bash
tail -f backend/backend.log | grep -i "email"
```

Look for:
- ✅ `"Sending approval email to doctor: ..."`
- ✅ `"Email sent successfully"`
- ❌ `"Failed to send email"`
- ❌ `"SMTP ERROR"`

**Check 4: Test SMTP Directly**
```bash
cd backend
python test_email.py  # If this file exists
```

### Common Issues:

**Issue 1: SMTP Authentication Failed**
```
Solution:
1. Check SMTP_PASSWORD is correct (Gmail App Password)
2. Ensure 2FA is enabled on Gmail
3. Regenerate App Password if needed
```

**Issue 2: Email Shows as "From Unknown Sender"**
```
Solution:
1. Check SMTP_FROM_EMAIL and SMTP_FROM_NAME in .env
2. Verify sending domain is configured
3. Add to Gmail/Outlook safe senders
```

**Issue 3: Temp Password Not Showing in Frontend**
```
Solution:
1. Check API response includes "temporary_password" field
2. Check frontend console for errors
3. Verify admin service returns temp password
```

**Issue 4: Email Delivery Delayed**
```
Normal - SMTP servers can take 1-5 minutes
Check backend logs to confirm email was sent
```

---

## 🔐 Security Notes

**Temporary Password:**
- ✅ Generated using `secrets.token_urlsafe()` (cryptographically secure)
- ✅ 12 characters, alphanumeric
- ✅ Hashed before storing in database
- ✅ Doctor forced to change on first login
- ✅ Sent via secure email (TLS encrypted)

**Email Security:**
- ✅ Sent via TLS/SSL (port 587 with STARTTLS)
- ✅ From verified domain
- ✅ HTML formatted (professional appearance)
- ✅ Direct links to official domain only

**Admin Visibility:**
- ✅ Temp password returned in API response
- ✅ Admin can copy/share if email fails
- ✅ Only visible to admin immediately after approval
- ✅ Not stored in plaintext anywhere

---

## 📊 Expected Backend Logs

### Successful Approval:
```
[abc12345] ✅ Admin <admin_id> approving doctor <doctor_id>
[abc12345] ✅ Doctor approved successfully: <doctor_id> by admin: <admin_id>
[abc12345] 📧 Sending approval email to doctor: doctor@example.com
[abc12345] ✓ Email message created
[abc12345] Connecting to SMTP server: smtp.gmail.com:587
[abc12345] ✓ Connected to SMTP server
[abc12345] ✓ TLS started
[abc12345] ✓ Login successful
[abc12345] ✓ Email sent
[abc12345] ✓ Connection closed
[abc12345] ✅ EMAIL SENT SUCCESSFULLY TO doctor@example.com
[abc12345] ✅ Approval email sent successfully to doctor@example.com
```

### Successful Rejection:
```
[def45678] ❌ Admin <admin_id> rejecting doctor <doctor_id>
[def45678] ✅ Doctor rejected successfully: <doctor_id> by admin: <admin_id>
[def45678] 📧 Sending rejection email to doctor: doctor@example.com
[def45678] ✓ Email message created
[def45678] Connecting to SMTP server: smtp.gmail.com:587
[def45678] ✓ Connected to SMTP server
[def45678] ✓ TLS started
[def45678] ✓ Login successful
[def45678] ✓ Email sent
[def45678] ✓ Connection closed
[def45678] ✅ EMAIL SENT SUCCESSFULLY TO doctor@example.com
[def45678] ✅ Rejection email sent successfully to doctor@example.com
```

---

## ✅ Test Completion Checklist

Before marking as complete, verify:

- [ ] **Approval Email**
  - [ ] Email received in inbox
  - [ ] Subject line correct
  - [ ] Doctor name personalized
  - [ ] Temp password visible and correct
  - [ ] Login link works
  - [ ] HTML formatting looks good
  - [ ] No broken images or links

- [ ] **Rejection Email**
  - [ ] Email received in inbox
  - [ ] Subject line correct
  - [ ] Doctor name personalized
  - [ ] Rejection reason matches what admin entered
  - [ ] Contact info is correct
  - [ ] HTML formatting looks good
  - [ ] Professional and empathetic tone

- [ ] **API Responses**
  - [ ] Approval returns `temporary_password` field
  - [ ] Approval returns `email_sent: true`
  - [ ] Rejection returns `email_sent: true`
  - [ ] Error messages are clear if email fails

- [ ] **Frontend Integration**
  - [ ] Admin can approve from dashboard
  - [ ] Admin can reject from dashboard
  - [ ] Success toasts appear
  - [ ] Application list refreshes
  - [ ] Status badges update correctly

- [ ] **Error Handling**
  - [ ] Approval succeeds even if email fails
  - [ ] Rejection succeeds even if email fails
  - [ ] Errors are logged properly
  - [ ] No server crashes on email errors

---

## 📞 Need Help?

**Check Documentation:**
- See `DOCTOR_EMAIL_NOTIFICATIONS_COMPLETE.md` for full implementation details

**Check Logs:**
```bash
# Backend logs
tail -f backend/backend.log

# Filter for email-related logs
tail -f backend/backend.log | grep -i "email"

# Filter for specific request
tail -f backend/backend.log | grep "[abc12345]"
```

**Test Email Service:**
```bash
cd backend
python test_doctor_emails.py
```

**Verify SMTP Config:**
```bash
cd backend
python -c "from app.core.config import settings; print(f'SMTP: {settings.SMTP_HOST}:{settings.SMTP_PORT}')"
```

---

## 🎉 Success!

If all tests pass, you're ready to use the email notification system in production!

**Remember:**
- Doctors receive emails immediately after approval/rejection
- Temp passwords are sent securely via email
- Admins can see temp passwords in the API response
- Email failures don't block approvals/rejections
- All actions are logged for debugging

**Happy Testing! 🚀**
