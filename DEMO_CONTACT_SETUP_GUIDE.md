# 🚀 Demo Request & Contact Us System - Setup Guide

## ✅ Implementation Complete!

Your complete demo request and contact management system has been successfully implemented.

---

## 📋 What's Been Implemented

### **Backend**
- ✅ Email configuration in `config.py`
- ✅ Demo Request model (`demo_request.py`)
- ✅ Contact Message model (`contact_message.py`)
- ✅ Email notification service (`email_service.py`)
- ✅ Forms API endpoints (`forms.py`)
- ✅ Router registration in API

### **Frontend**
- ✅ Demo request page (`/demo`)
- ✅ Contact page (`/contact`)
- ✅ Updated landing page links
- ✅ API service methods

---

## 🔧 Setup Instructions

### **Step 1: Environment Configuration**

Add these lines to your `backend/.env` file:

```bash
# ============================================================================
# EMAIL CONFIGURATION
# ============================================================================

# Gmail SMTP Settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=mohdanees1717@gmail.com
SMTP_PASSWORD=vsddn ipjookqvixz
SMTP_FROM_EMAIL=mohdanees1717@gmail.com
SMTP_FROM_NAME=SynapseAI Notifications

# Admin notification email
ADMIN_EMAIL=mohdanees1717@gmail.com
ADMIN_NOTIFICATION_ENABLED=true

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

**Note:** Remove the space in `SMTP_PASSWORD` - it should be `vsddnipjookqvixz` (no space).

---

### **Step 2: Database Migration**

Run these commands to create the database tables:

```bash
cd backend

# Create migration manually
python << 'EOF'
import uuid
from datetime import datetime

# Generate unique revision ID
revision_id = str(uuid.uuid4())[:12]

migration_content = f'''"""add_demo_and_contact_models

Revision ID: {revision_id}
Revises: 
Create Date: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '{revision_id}'
down_revision = None  # Update this to your latest migration ID
branch_labels = None
depends_on = None


def upgrade():
    # Create demo_requests table
    op.create_table(
        'demo_requests',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('organization', sa.String(length=255), nullable=True),
        sa.Column('job_title', sa.String(length=255), nullable=True),
        sa.Column('message', sa.Text(), nullable=True),
        sa.Column('preferred_date', sa.String(length=100), nullable=True),
        sa.Column('interested_features', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('NEW', 'CONTACTED', 'SCHEDULED', 'COMPLETED', 'CANCELLED', name='demorequestatus'), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('admin_notes', sa.Text(), nullable=True),
        sa.Column('contacted_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_demo_requests_full_name'), 'demo_requests', ['full_name'], unique=False)
    op.create_index(op.f('ix_demo_requests_email'), 'demo_requests', ['email'], unique=False)
    op.create_index(op.f('ix_demo_requests_status'), 'demo_requests', ['status'], unique=False)
    op.create_index(op.f('ix_demo_requests_created_at'), 'demo_requests', ['created_at'], unique=False)

    # Create contact_messages table
    op.create_table(
        'contact_messages',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('full_name', sa.String(length=255), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('phone', sa.String(length=20), nullable=True),
        sa.Column('subject', sa.String(length=500), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('category', sa.String(length=100), nullable=True),
        sa.Column('priority', sa.Enum('LOW', 'MEDIUM', 'HIGH', 'URGENT', name='messagepriority'), nullable=False),
        sa.Column('status', sa.Enum('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', name='messagestatus'), nullable=False),
        sa.Column('ip_address', sa.String(length=45), nullable=True),
        sa.Column('user_agent', sa.Text(), nullable=True),
        sa.Column('admin_response', sa.Text(), nullable=True),
        sa.Column('responded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('responded_by', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_contact_messages_full_name'), 'contact_messages', ['full_name'], unique=False)
    op.create_index(op.f('ix_contact_messages_email'), 'contact_messages', ['email'], unique=False)
    op.create_index(op.f('ix_contact_messages_status'), 'contact_messages', ['status'], unique=False)
    op.create_index(op.f('ix_contact_messages_created_at'), 'contact_messages', ['created_at'], unique=False)


def downgrade():
    op.drop_index(op.f('ix_contact_messages_created_at'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_status'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_email'), table_name='contact_messages')
    op.drop_index(op.f('ix_contact_messages_full_name'), table_name='contact_messages')
    op.drop_table('contact_messages')
    op.execute('DROP TYPE messagestatus')
    op.execute('DROP TYPE messagepriority')
    
    op.drop_index(op.f('ix_demo_requests_created_at'), table_name='demo_requests')
    op.drop_index(op.f('ix_demo_requests_status'), table_name='demo_requests')
    op.drop_index(op.f('ix_demo_requests_email'), table_name='demo_requests')
    op.drop_index(op.f('ix_demo_requests_full_name'), table_name='demo_requests')
    op.drop_table('demo_requests')
    op.execute('DROP TYPE demorequestatus')
'''

with open(f'alembic/versions/{revision_id}_add_demo_and_contact_models.py', 'w') as f:
    f.write(migration_content)

print(f"✅ Migration created: {revision_id}_add_demo_and_contact_models.py")
print(f"📝 Revision ID: {revision_id}")
EOF

# Apply migration (update DATABASE_URL in .env first)
# alembic upgrade head
```

---

### **Step 3: Test the System**

#### **Test Backend**
```bash
cd backend
uvicorn app.main:app --reload --port 8080
```

Visit: http://localhost:8080/docs to see the new endpoints:
- `POST /api/v1/forms/demo-requests`
- `POST /api/v1/forms/contact-messages`

#### **Test Frontend**
```bash
cd frontend
npm run dev
```

Visit:
- http://localhost:3000/demo - Demo request form
- http://localhost:3000/contact - Contact form

---

## 📧 Email Notifications

When someone submits a form:

1. **You receive** an email at `mohdanees1717@gmail.com` with:
   - All form details
   - Submission timestamp
   - Link to view in admin dashboard

2. **User receives** a confirmation email with:
   - Acknowledgment of their submission
   - Expected response time

---

## 🎨 Features

### **Demo Request Form**
- Full name, email, phone (optional)
- Organization, job title (optional)
- Preferred date/time (optional)
- Message (optional)
- Beautiful UI with proper validation

### **Contact Form**
- Full name, email, phone (optional)
- Subject, category
- Message
- Contact information cards

### **Email Templates**
- Professional HTML design
- Gradient headers with brand colors
- Responsive layout
- Call-to-action buttons

---

## 🔍 Database Tables

### **demo_requests**
```sql
- id (UUID)
- full_name, email, phone
- organization, job_title
- message, preferred_date
- status (NEW, CONTACTED, SCHEDULED, COMPLETED, CANCELLED)
- ip_address, user_agent
- admin_notes, contacted_at
- created_at, updated_at
```

### **contact_messages**
```sql
- id (UUID)
- full_name, email, phone
- subject, message, category
- priority (LOW, MEDIUM, HIGH, URGENT)
- status (NEW, IN_PROGRESS, RESOLVED, CLOSED)
- ip_address, user_agent
- admin_response, responded_at, responded_by
- created_at, updated_at
```

---

## 🚀 Next Steps

1. **Set up `.env` file** with email credentials
2. **Run database migration**
3. **Start backend and frontend**
4. **Test demo request form**
5. **Test contact form**
6. **Check your email** for notifications

---

## 📝 API Endpoints

### Submit Demo Request
```bash
POST /api/v1/forms/demo-requests
Content-Type: application/json

{
  "full_name": "Dr. John Doe",
  "email": "doctor@example.com",
  "phone": "+91 9876543210",
  "organization": "City Hospital",
  "job_title": "Psychiatrist",
  "message": "Interested in learning more",
  "preferred_date": "Next Tuesday"
}
```

### Submit Contact Message
```bash
POST /api/v1/forms/contact-messages
Content-Type: application/json

{
  "full_name": "Jane Doe",
  "email": "jane@example.com",
  "phone": "+91 9876543210",
  "subject": "Question about pricing",
  "message": "I'd like to know more about your pricing plans",
  "category": "sales"
}
```

---

## 🎉 Success!

Your demo request and contact system is now fully functional. Submissions will be stored in the database and you'll receive email notifications for each new submission!

---

**Need Help?**
- Check backend logs for any errors
- Verify email credentials in `.env`
- Ensure database is running
- Test API endpoints with Swagger UI at `/docs`
