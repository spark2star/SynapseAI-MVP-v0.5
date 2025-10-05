"""
Email Configuration Test Script
Run: python test_email.py
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

print("🔍 Testing Email Configuration...")
print("=" * 60)

# Load environment
from dotenv import load_dotenv
load_dotenv()

print("\n📋 Environment Variables:")
print(f"SMTP_HOST: {os.getenv('SMTP_HOST')}")
print(f"SMTP_PORT: {os.getenv('SMTP_PORT')}")
print(f"SMTP_USER: {os.getenv('SMTP_USER')}")
print(f"SMTP_PASSWORD: {'*' * len(os.getenv('SMTP_PASSWORD', '')) if os.getenv('SMTP_PASSWORD') else 'NOT SET'}")
print(f"SMTP_PASSWORD Length: {len(os.getenv('SMTP_PASSWORD', ''))}")
print(f"ADMIN_EMAIL: {os.getenv('ADMIN_EMAIL')}")
print("=" * 60)

# Import email service
from app.services.email_service import email_service

print("\n🧪 Testing Email Send...")
print("=" * 60)

# Test data
test_demo_request = {
    'id': 'test-123',
    'full_name': 'Test User',
    'email': 'test@example.com',
    'phone': '+91 9876543210',
    'organization': 'Test Clinic',
    'job_title': 'Psychiatrist',
    'message': 'This is a test demo request',
    'preferred_date': 'Tomorrow at 3 PM',
}

# Send test email
print("\n📤 Sending test email...")
success = email_service.send_demo_request_notification(test_demo_request)

print("\n" + "=" * 60)
if success:
    print("✅ TEST SUCCESSFUL!")
    print(f"📬 Check your inbox: {email_service.admin_email}")
    print("\nIf you don't see the email:")
    print("1. Check your spam/junk folder")
    print("2. Wait 1-2 minutes for delivery")
    print("3. Check the logs above for any errors")
else:
    print("❌ TEST FAILED!")
    print("\nCheck the error logs above for details.")
    print("\nCommon issues:")
    print("1. App password is incorrect (must be 16 chars, no spaces)")
    print("2. 2FA is not enabled on Gmail")
    print("3. Wrong email address")
    print("\n📝 Current Configuration:")
    print(f"   Email: {email_service.smtp_user}")
    print(f"   Password Length: {len(email_service.smtp_password)}")
    print(f"   Admin Email: {email_service.admin_email}")
print("=" * 60)
