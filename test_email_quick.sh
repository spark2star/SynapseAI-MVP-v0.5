#!/bin/bash

echo "=========================================="
echo "🧪 Quick Email Configuration Test"
echo "=========================================="
echo ""

cd backend

echo "📋 Step 1: Checking environment variables..."
python -c "
from dotenv import load_dotenv
import os
load_dotenv()
print(f'SMTP_USER: {os.getenv(\"SMTP_USER\")}')
print(f'SMTP_PASSWORD: {\"*\" * len(os.getenv(\"SMTP_PASSWORD\", \"\"))} (length: {len(os.getenv(\"SMTP_PASSWORD\", \"\"))})')
print(f'ADMIN_EMAIL: {os.getenv(\"ADMIN_EMAIL\")}')
print('')
if not os.getenv('SMTP_PASSWORD'):
    print('❌ ERROR: SMTP_PASSWORD not set!')
    print('Add to backend/.env: SMTP_PASSWORD=vsddnipjooksqvix')
    exit(1)
if len(os.getenv('SMTP_PASSWORD', '')) != 16:
    print(f'⚠️  WARNING: Password length is {len(os.getenv(\"SMTP_PASSWORD\", \"\"))} (should be 16)')
    print('Make sure there are NO SPACES in the password')
else:
    print('✅ Password length correct (16 characters)')
"

echo ""
echo "=========================================="
echo "📤 Step 2: Sending test email..."
echo "=========================================="
echo ""

python test_email.py

echo ""
echo "=========================================="
echo "📝 Next Steps:"
echo "=========================================="
echo ""
echo "1. Check mohdanees1717@gmail.com inbox"
echo "2. Check spam/junk folder if not in inbox"
echo "3. If test failed, see EMAIL_TROUBLESHOOTING_GUIDE.md"
echo "4. Once working, test via frontend at http://localhost:3000/demo"
echo ""
