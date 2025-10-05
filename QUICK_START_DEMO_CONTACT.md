# 🚀 Quick Start: Demo Request & Contact Us System

## ✅ **IMPLEMENTATION COMPLETE!**

Everything is ready to go. Just follow these 3 simple steps:

---

## 📝 **Step 1: Configure Email (2 minutes)**

Create or update your `backend/.env` file with these settings:

```bash
# Add these lines to your existing .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mohdanees1717@gmail.com
SMTP_PASSWORD=vsddnipjookqvixz
SMTP_FROM_EMAIL=mohdanees1717@gmail.com
SMTP_FROM_NAME=SynapseAI Notifications
ADMIN_EMAIL=mohdanees1717@gmail.com
ADMIN_NOTIFICATION_ENABLED=true
FRONTEND_URL=http://localhost:3000
```

**⚠️ Important:** The password should be **one word without spaces**: `vsddnipjookqvixz`

---

## 🗄️ **Step 2: Run Database Migration (1 minute)**

```bash
cd backend

# Apply the migration (this creates the demo_requests and contact_messages tables)
alembic upgrade head
```

✅ **Expected output:** "Running upgrade ... -> 73b46280-33b, add_demo_and_contact_models"

---

## 🎯 **Step 3: Start the Application**

### **Terminal 1 - Backend:**
```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

### **Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

---

## 🧪 **Test the System**

### **Test Demo Request:**
1. Open: http://localhost:3000/demo
2. Fill out the form
3. Submit
4. Check your email: `mohdanees1717@gmail.com` ✉️

### **Test Contact Form:**
1. Open: http://localhost:3000/contact
2. Fill out the form
3. Submit
4. Check your email: `mohdanees1717@gmail.com` ✉️

### **Test API Directly:**
Visit: http://localhost:8080/docs

Look for these new endpoints:
- `POST /api/v1/forms/demo-requests`
- `POST /api/v1/forms/contact-messages`

---

## 📧 **Email Notifications**

When someone submits a form, **two emails are sent:**

### **1. To You (Admin)**
- Professional HTML email with gradient header
- All form details
- Submission timestamp
- Link to admin dashboard

### **2. To User (Confirmation)**
- Thank you message
- Expected response time
- Professional branding

---

## 🎨 **What You Get**

### **✨ Beautiful Forms**
- `/demo` - Request a demo form
- `/contact` - Contact us form
- Responsive design
- Proper validation
- Loading states
- Success screens

### **📊 Database Tables**
- `demo_requests` - All demo requests
- `contact_messages` - All contact messages

### **🔔 Email System**
- Automated notifications
- HTML templates with your branding
- Professional design

### **🔗 Updated Landing Page**
- Hero section → Demo button
- CTA section → Demo & Contact links
- Footer → Contact links

---

## 🐛 **Troubleshooting**

### **Email not sending?**
```bash
# Check email credentials in backend/.env
# Verify SMTP password has no spaces: vsddnipjookqvixz
# Check backend logs for email errors
```

### **Migration error?**
```bash
cd backend
alembic current  # Check current version
alembic history  # View all migrations
alembic upgrade head  # Apply latest
```

### **Frontend not connecting?**
```bash
# Verify backend is running on port 8080
# Check frontend/.env has: NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1
```

---

## 📁 **Files Created/Modified**

### **Backend:**
```
✅ backend/app/core/config.py (updated)
✅ backend/app/models/demo_request.py (new)
✅ backend/app/models/contact_message.py (new)
✅ backend/app/services/email_service.py (new)
✅ backend/app/api/api_v1/endpoints/forms.py (new)
✅ backend/app/api/api_v1/api.py (updated)
✅ backend/alembic/versions/73b46280-33b_add_demo_and_contact_models.py (new)
```

### **Frontend:**
```
✅ frontend/src/services/api.ts (updated)
✅ frontend/src/app/demo/page.tsx (new)
✅ frontend/src/app/contact/page.tsx (new)
✅ frontend/src/components/landing/HeroSection.tsx (updated)
✅ frontend/src/components/landing/CTASection.tsx (updated)
✅ frontend/src/components/landing/Footer.tsx (updated)
```

---

## 🎉 **Success Indicators**

✅ Backend starts without errors  
✅ Frontend starts without errors  
✅ Can visit `/demo` page  
✅ Can visit `/contact` page  
✅ Forms submit successfully  
✅ Emails arrive at mohdanees1717@gmail.com  
✅ Data saved in database  

---

## 🚀 **You're All Set!**

Your demo request and contact system is fully functional. Start receiving inquiries! 🎊

---

**Need help?** Check `DEMO_CONTACT_SETUP_GUIDE.md` for detailed documentation.
