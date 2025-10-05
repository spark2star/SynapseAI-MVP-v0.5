# 🔧 Email Troubleshooting Guide

## 🚨 **Problem: Emails Not Being Received**

Forms work, data saves to database, but emails don't arrive at mohdanees1717@gmail.com.

---

## ✅ **QUICK FIX CHECKLIST**

### **1. Check Gmail App Password Setup**

Go to: https://myaccount.google.com/apppasswords

**Requirements:**
- ✅ 2-Step Verification must be **ENABLED**
- ✅ Generate a new App Password (16 characters)
- ✅ Copy the password **WITHOUT SPACES**

**Example:**
```
Google shows: vsdd nipj ooks qvix
You type in .env: vsddnipjooksqvix  (NO SPACES!)
```

---

### **2. Verify Environment Variables**

**File:** `backend/.env`

```bash
# CRITICAL: No spaces in password!
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mohdanees1717@gmail.com
SMTP_PASSWORD=vsddnipjooksqvix
SMTP_FROM_EMAIL=mohdanees1717@gmail.com
SMTP_FROM_NAME=SynapseAI Notifications
ADMIN_EMAIL=mohdanees1717@gmail.com
ADMIN_NOTIFICATION_ENABLED=true
FRONTEND_URL=http://localhost:3000
```

**Common Mistakes:**
- ❌ Spaces in password: `vsdd nipj ooks qvix`
- ❌ Wrong file location: `/.env` (should be `backend/.env`)
- ❌ Typo in email address
- ❌ Using regular password instead of App Password

---

## 🧪 **TEST PROCEDURE**

### **Step 1: Test with Python Script**

```bash
cd backend

# Install dependencies if needed
pip install python-dotenv

# Run test
python test_email.py
```

**Expected Output (Success):**
```
============================================================
EMAIL SERVICE INITIALIZED
============================================================
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: mohdanees1717@gmail.com
SMTP Password: ****************
============================================================
ATTEMPTING TO SEND EMAIL
============================================================
✓ Email message created
✓ Connected to SMTP server
✓ TLS started
✓ Login successful
✓ Email sent
✓ Connection closed
============================================================
✅ EMAIL SENT SUCCESSFULLY TO mohdanees1717@gmail.com
============================================================
✅ TEST SUCCESSFUL!
```

**If you see errors, jump to the "Common Errors" section below.**

---

### **Step 2: Test via API**

```bash
# Start backend
cd backend
uvicorn app.main:app --reload --port 8080

# In browser or curl:
curl http://localhost:8080/api/v1/forms/test-email

# Or visit in browser:
http://localhost:8080/api/v1/forms/test-email
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Test email sent successfully to mohdanees1717@gmail.com",
  "config": {
    "smtp_host": "smtp.gmail.com",
    "smtp_port": 587,
    "smtp_user": "mohdanees1717@gmail.com",
    "admin_email": "mohdanees1717@gmail.com",
    "password_set": true,
    "password_length": 16
  }
}
```

---

## ❌ **COMMON ERRORS & SOLUTIONS**

### **Error 1: "SMTP_PASSWORD is not set"**

**What you see:**
```
❌ SMTP_PASSWORD is not set in environment variables!
Password Length: 0
```

**Solution:**
```bash
# 1. Check .env file exists
ls -la backend/.env

# 2. Add password to .env
cd backend
nano .env

# Add this line (NO SPACES in password):
SMTP_PASSWORD=vsddnipjooksqvix

# 3. Save and restart backend
# Press Ctrl+X, Y, Enter
# Then restart: uvicorn app.main:app --reload
```

---

### **Error 2: "535 Authentication failed"**

**What you see:**
```
❌ SMTP AUTHENTICATION ERROR
Error: (535, b'5.7.8 Username and Password not accepted')
```

**Causes:**
1. App Password is wrong
2. App Password has spaces
3. 2FA not enabled
4. Using regular password instead of App Password

**Solution:**
```bash
# Step 1: Enable 2FA
Go to: https://myaccount.google.com/security
Enable 2-Step Verification

# Step 2: Generate NEW App Password
Go to: https://myaccount.google.com/apppasswords
Select: Mail, Other (SynapseAI)
Copy the password (e.g., "vsdd nipj ooks qvix")

# Step 3: Update .env WITHOUT SPACES
SMTP_PASSWORD=vsddnipjooksqvix

# Step 4: Restart backend
```

---

### **Error 3: "Password length: 19" (should be 16)**

**Problem:** Spaces included in password

**Solution:**
```bash
# Wrong (19 characters with spaces):
SMTP_PASSWORD=vsdd nipj ooks qvix

# Right (16 characters, no spaces):
SMTP_PASSWORD=vsddnipjooksqvix
```

---

### **Error 4: "Connection timeout"**

**What you see:**
```
❌ UNEXPECTED ERROR
Error: timed out
```

**Solutions:**
1. **Check internet connection**
2. **Check firewall:**
   ```bash
   # Allow port 587
   sudo ufw allow 587
   ```
3. **Try port 465 (SSL) instead:**
   ```bash
   # In .env:
   SMTP_PORT=465
   SMTP_HOST=smtp.gmail.com
   ```

---

### **Error 5: Email sent but not received**

**What you see:**
```
✅ EMAIL SENT SUCCESSFULLY
```
But no email in inbox.

**Solutions:**

1. **Check Spam Folder**
   - Go to Gmail spam folder
   - Search for "SynapseAI"

2. **Wait 1-2 minutes**
   - Gmail can be slow sometimes

3. **Check Gmail filters**
   - Go to Settings → Filters and Blocked Addresses
   - Remove any filters blocking the domain

4. **Try sending to different email**
   ```bash
   # In .env, temporarily change:
   ADMIN_EMAIL=your_other_email@gmail.com
   ```

---

## 🔍 **DETAILED DIAGNOSTICS**

### **Check 1: Environment Variables Loaded**

```bash
cd backend
python -c "
from dotenv import load_dotenv
import os
load_dotenv()
print('SMTP_USER:', os.getenv('SMTP_USER'))
print('SMTP_PASSWORD Length:', len(os.getenv('SMTP_PASSWORD', '')))
print('ADMIN_EMAIL:', os.getenv('ADMIN_EMAIL'))
"
```

**Expected:**
```
SMTP_USER: mohdanees1717@gmail.com
SMTP_PASSWORD Length: 16
ADMIN_EMAIL: mohdanees1717@gmail.com
```

---

### **Check 2: Manual SMTP Test**

```bash
cd backend
python << 'EOF'
import smtplib
import os
from dotenv import load_dotenv

load_dotenv()

try:
    server = smtplib.SMTP('smtp.gmail.com', 587, timeout=10)
    server.starttls()
    server.login(os.getenv('SMTP_USER'), os.getenv('SMTP_PASSWORD'))
    print("✅ SMTP Login Successful!")
    server.quit()
except Exception as e:
    print(f"❌ Error: {e}")
EOF
```

---

### **Check 3: Python Dependencies**

```bash
cd backend
pip install python-dotenv pydantic-settings

# Verify installation
pip list | grep -E "dotenv|pydantic"
```

---

## 📋 **COMPLETE SETUP VERIFICATION**

Run this complete check:

```bash
cd backend

echo "=== Checking Email Configuration ==="
echo ""

echo "1. Check .env file exists:"
ls -la .env

echo ""
echo "2. Check environment variables:"
python -c "
from dotenv import load_dotenv
import os
load_dotenv()
print(f'SMTP_USER: {os.getenv(\"SMTP_USER\")}')
print(f'SMTP_PASSWORD: {\"*\" * len(os.getenv(\"SMTP_PASSWORD\", \"\"))} (length: {len(os.getenv(\"SMTP_PASSWORD\", \"\"))})')
print(f'ADMIN_EMAIL: {os.getenv(\"ADMIN_EMAIL\")}')
"

echo ""
echo "3. Test SMTP connection:"
python test_email.py

echo ""
echo "=== Check Complete ==="
```

---

## 🎯 **FINAL VERIFICATION**

Once you've fixed the configuration:

1. **Stop backend** (Ctrl+C)
2. **Restart backend:**
   ```bash
   cd backend
   uvicorn app.main:app --reload --port 8080
   ```
3. **Run test:**
   ```bash
   python test_email.py
   ```
4. **Check Gmail inbox** (and spam folder)
5. **Wait 2 minutes** for delivery

---

## 📧 **Gmail Account Requirements**

Your Gmail account needs:

- ✅ **2-Step Verification** enabled
- ✅ **App Password** generated (not regular password)
- ✅ **IMAP enabled** (usually on by default)
- ✅ No security alerts blocking access

**Check at:** https://myaccount.google.com/security

---

## 🆘 **Still Not Working?**

If emails still don't work after all checks:

### **Option 1: Try SendGrid (Free Alternative)**

```bash
# Sign up at: https://sendgrid.com
# Get API key
# Update .env:

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=YOUR_SENDGRID_API_KEY
SMTP_FROM_EMAIL=mohdanees1717@gmail.com
```

### **Option 2: Use Mailgun**

```bash
# Sign up at: https://www.mailgun.com
# Get SMTP credentials
```

### **Option 3: Temporarily Disable Email**

Comment out email sending in `forms.py`:

```python
# email_service.send_demo_request_notification(email_data)
# email_service.send_confirmation_to_user(demo.email, demo.full_name, "demo")
```

---

## 📝 **Quick Reference**

### **Correct .env Format:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mohdanees1717@gmail.com
SMTP_PASSWORD=vsddnipjooksqvix
SMTP_FROM_EMAIL=mohdanees1717@gmail.com
SMTP_FROM_NAME=SynapseAI Notifications
ADMIN_EMAIL=mohdanees1717@gmail.com
ADMIN_NOTIFICATION_ENABLED=true
FRONTEND_URL=http://localhost:3000
```

### **Test Command:**
```bash
cd backend && python test_email.py
```

### **API Test:**
```bash
curl http://localhost:8080/api/v1/forms/test-email
```

---

## ✅ **Success Indicators**

You'll know it's working when you see:

```
✓ Connected to SMTP server
✓ TLS started
✓ Login successful
✓ Email sent
✓ Connection closed
✅ EMAIL SENT SUCCESSFULLY
```

And receive email at **mohdanees1717@gmail.com** within 1-2 minutes!

---

**Need more help?** Share the error logs from `python test_email.py` and I can provide specific guidance.
