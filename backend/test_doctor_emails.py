#!/usr/bin/env python3
"""
Test script for doctor approval and rejection emails.
Run this to test the email service independently.
"""

import sys
import os

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.email_service import email_service
from app.core.config import settings


def test_approval_email():
    """Test sending an approval email"""
    print("=" * 60)
    print("TESTING APPROVAL EMAIL")
    print("=" * 60)
    
    test_data = {
        "to_email": "test.doctor@example.com",  # Change this to your test email
        "doctor_name": "John Smith",
        "login_email": "test.doctor@example.com",
        "temporary_password": "TestPass123",
        "login_url": f"{settings.FRONTEND_URL}/auth/login" if hasattr(settings, 'FRONTEND_URL') else "http://localhost:3000/auth/login"
    }
    
    print(f"Sending approval email to: {test_data['to_email']}")
    print(f"Doctor Name: {test_data['doctor_name']}")
    print(f"Temp Password: {test_data['temporary_password']}")
    print(f"Login URL: {test_data['login_url']}")
    print()
    
    try:
        result = email_service.send_doctor_approval_email(
            to_email=test_data["to_email"],
            doctor_name=test_data["doctor_name"],
            login_email=test_data["login_email"],
            temporary_password=test_data["temporary_password"],
            login_url=test_data["login_url"]
        )
        
        if result:
            print("✅ APPROVAL EMAIL SENT SUCCESSFULLY!")
            print(f"Check inbox: {test_data['to_email']}")
        else:
            print("❌ APPROVAL EMAIL FAILED!")
            print("Check logs above for details")
        
        return result
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def test_rejection_email():
    """Test sending a rejection email"""
    print("\n")
    print("=" * 60)
    print("TESTING REJECTION EMAIL")
    print("=" * 60)
    
    test_data = {
        "to_email": "test.doctor@example.com",  # Change this to your test email
        "doctor_name": "Jane Doe",
        "rejection_reason": "The medical registration number provided could not be verified with the State Medical Council. Please ensure the registration number is current and matches the council records."
    }
    
    print(f"Sending rejection email to: {test_data['to_email']}")
    print(f"Doctor Name: {test_data['doctor_name']}")
    print(f"Rejection Reason: {test_data['rejection_reason'][:50]}...")
    print()
    
    try:
        result = email_service.send_doctor_rejection_email(
            to_email=test_data["to_email"],
            doctor_name=test_data["doctor_name"],
            rejection_reason=test_data["rejection_reason"]
        )
        
        if result:
            print("✅ REJECTION EMAIL SENT SUCCESSFULLY!")
            print(f"Check inbox: {test_data['to_email']}")
        else:
            print("❌ REJECTION EMAIL FAILED!")
            print("Check logs above for details")
        
        return result
    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        return False


def main():
    """Run all email tests"""
    print("=" * 60)
    print("DOCTOR EMAIL NOTIFICATION TESTING")
    print("=" * 60)
    print()
    print("📧 SMTP Configuration:")
    print(f"   Host: {email_service.smtp_host}")
    print(f"   Port: {email_service.smtp_port}")
    print(f"   User: {email_service.smtp_user}")
    print(f"   From: {email_service.from_email}")
    print(f"   Admin: {email_service.admin_email}")
    print()
    
    # Ask for test email
    print("⚠️  IMPORTANT: Change test email addresses in this script before running!")
    print("   Current test email: test.doctor@example.com")
    print()
    
    response = input("Do you want to continue with the current test email? (yes/no): ").strip().lower()
    
    if response not in ['yes', 'y']:
        print("❌ Test cancelled. Please update the email addresses in the script.")
        return
    
    print("\n" + "=" * 60)
    print("STARTING EMAIL TESTS")
    print("=" * 60)
    
    # Test approval email
    approval_result = test_approval_email()
    
    # Wait a bit between emails
    print("\nWaiting 2 seconds before next test...")
    import time
    time.sleep(2)
    
    # Test rejection email
    rejection_result = test_rejection_email()
    
    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    print(f"Approval Email: {'✅ PASSED' if approval_result else '❌ FAILED'}")
    print(f"Rejection Email: {'✅ PASSED' if rejection_result else '❌ FAILED'}")
    print()
    
    if approval_result and rejection_result:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED - Check logs above")
    print("=" * 60)


if __name__ == "__main__":
    main()
