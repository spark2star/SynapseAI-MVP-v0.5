"""
Direct Email Test - No Dependencies Required
Tests SMTP connection directly without importing the app
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

# Load environment variables
from dotenv import load_dotenv
load_dotenv()

print("=" * 60)
print("🧪 DIRECT EMAIL TEST (No App Dependencies)")
print("=" * 60)
print()

# Get credentials
SMTP_HOST = os.getenv('SMTP_HOST', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', '587'))
SMTP_USER = os.getenv('SMTP_USER')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')
ADMIN_EMAIL = os.getenv('ADMIN_EMAIL')

# Validate
print("📋 Configuration:")
print(f"SMTP Host: {SMTP_HOST}")
print(f"SMTP Port: {SMTP_PORT}")
print(f"SMTP User: {SMTP_USER}")
print(f"Password Set: {'Yes' if SMTP_PASSWORD else 'No'}")
print(f"Password Length: {len(SMTP_PASSWORD) if SMTP_PASSWORD else 0}")
print(f"Admin Email: {ADMIN_EMAIL}")
print()

if not SMTP_USER or not SMTP_PASSWORD or not ADMIN_EMAIL:
    print("❌ ERROR: Missing required environment variables!")
    print("Make sure backend/.env has:")
    print("  SMTP_USER=mohdanees1717@gmail.com")
    print("  SMTP_PASSWORD=vsddnipjooksqvix")
    print("  ADMIN_EMAIL=mohdanees1717@gmail.com")
    exit(1)

print("=" * 60)
print("📤 SENDING TEST EMAIL")
print("=" * 60)
print()

try:
    # Create message
    print("✓ Creating email message...")
    msg = MIMEMultipart('alternative')
    msg['Subject'] = "🎯 Test Email from SynapseAI"
    msg['From'] = f"SynapseAI <{SMTP_USER}>"
    msg['To'] = ADMIN_EMAIL
    
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #50B9E8, #0A4D8B); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }}
            .success {{ color: #10B981; font-size: 48px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Email Test Successful!</h1>
            </div>
            <div class="content">
                <div class="success">🎉</div>
                <h2>Your email system is working!</h2>
                <p><strong>Test Details:</strong></p>
                <ul>
                    <li>SMTP Host: {SMTP_HOST}</li>
                    <li>SMTP Port: {SMTP_PORT}</li>
                    <li>From: {SMTP_USER}</li>
                    <li>To: {ADMIN_EMAIL}</li>
                    <li>Time: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</li>
                </ul>
                <p>Your demo request and contact forms will now send emails successfully!</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    part = MIMEText(html_body, 'html')
    msg.attach(part)
    print("✓ Message created")
    
    # Connect to SMTP server
    print(f"✓ Connecting to {SMTP_HOST}:{SMTP_PORT}...")
    server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10)
    print("✓ Connected")
    
    # Start TLS
    print("✓ Starting TLS...")
    server.starttls()
    print("✓ TLS enabled")
    
    # Login
    print(f"✓ Logging in as {SMTP_USER}...")
    server.login(SMTP_USER, SMTP_PASSWORD)
    print("✓ Login successful")
    
    # Send email
    print("✓ Sending email...")
    server.send_message(msg)
    print("✓ Email sent")
    
    # Close
    server.quit()
    print("✓ Connection closed")
    
    print()
    print("=" * 60)
    print("✅ SUCCESS! Email sent to", ADMIN_EMAIL)
    print("=" * 60)
    print()
    print("📬 Check your inbox at:", ADMIN_EMAIL)
    print("📁 Also check spam/junk folder")
    print("⏰ Email should arrive within 1-2 minutes")
    print()
    print("🎉 Your email system is working!")
    print("   Forms will now send emails successfully.")
    print()
    
except smtplib.SMTPAuthenticationError as e:
    print()
    print("=" * 60)
    print("❌ AUTHENTICATION ERROR")
    print("=" * 60)
    print(f"Error: {e}")
    print()
    print("This means:")
    print("1. Your App Password is incorrect")
    print("2. Or 2FA is not enabled on Gmail")
    print()
    print("Fix:")
    print("1. Go to: https://myaccount.google.com/security")
    print("2. Enable 2-Step Verification")
    print("3. Go to: https://myaccount.google.com/apppasswords")
    print("4. Generate NEW app password")
    print("5. Copy WITHOUT spaces (16 characters)")
    print("6. Update backend/.env:")
    print("   SMTP_PASSWORD=vsddnipjooksqvix")
    print()
    
except Exception as e:
    print()
    print("=" * 60)
    print("❌ ERROR")
    print("=" * 60)
    print(f"Error: {e}")
    print(f"Type: {type(e).__name__}")
    print()
    print("If you see 'Connection refused' or 'timeout':")
    print("  - Check your internet connection")
    print("  - Try port 465 instead of 587")
    print()
    print("If you see other errors, share this output for help.")
    print()

print("=" * 60)
