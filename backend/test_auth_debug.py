"""
Test script to debug authentication issues.
"""
import sys
import asyncio
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models.user import User
from app.core.encryption import HashingUtility
from app.services.auth_service import AuthenticationService
from app.schemas.user import UserLogin
import os

async def test_authentication():
    """Test authentication flow."""
    # Create sync engine for testing
    sync_db_url = os.environ.get("DATABASE_URL", "").replace("+asyncpg", "")
    engine = create_engine(sync_db_url)
    SessionLocal = sessionmaker(bind=engine)
    db = SessionLocal()
    
    try:
        print("=" * 80)
        print("AUTHENTICATION DEBUG TEST")
        print("=" * 80)
        
        # Test 1: Check if user exists
        print("\n1️⃣ Checking if users exist in database...")
        users = db.query(User).all()
        print(f"   Found {len(users)} users")
        
        for user in users:
            print(f"   - User ID: {user.id}")
            print(f"     Email Hash: {user.email_hash[:20]}...")
            print(f"     Is Verified: {user.is_verified}")
            print(f"     Is Active: {user.is_active}")
            print(f"     Password Hash: {user.password_hash[:30]}...")
        
        # Test 2: Generate email hash for test email
        print("\n2️⃣ Generating email hash for 'doc@demo.com'...")
        test_email = "doc@demo.com"
        email_hash = User.hash_email(test_email)
        print(f"   Email: {test_email}")
        print(f"   Generated Hash: {email_hash}")
        
        # Test 3: Find user by email_hash
        print("\n3️⃣ Looking up user by email_hash...")
        user = db.query(User).filter(User.email_hash == email_hash).first()
        
        if user:
            print(f"   ✅ User found!")
            print(f"   User ID: {user.id}")
            print(f"   Email Hash: {user.email_hash}")
            print(f"   Is Verified: {user.is_verified}")
            print(f"   Is Active: {user.is_active}")
            print(f"   Failed Login Attempts: {user.failed_login_attempts}")
            print(f"   Is Locked: {user.is_locked}")
            print(f"   Password Hash: {user.password_hash}")
        else:
            print(f"   ❌ User NOT found!")
            return
        
        # Test 4: Verify password
        print("\n4️⃣ Testing password verification...")
        test_password = "password123"
        hash_util = HashingUtility()
        
        print(f"   Test Password: {test_password}")
        print(f"   Stored Hash: {user.password_hash}")
        
        is_valid = hash_util.verify_password(test_password, user.password_hash)
        print(f"   Verification Result: {'✅ VALID' if is_valid else '❌ INVALID'}")
        
        # Test 5: Full authentication flow
        print("\n5️⃣ Testing full authentication flow...")
        auth_service = AuthenticationService(db)
        login_data = UserLogin(
            email=test_email,
            password=test_password,
            remember_me=False
        )
        
        try:
            login_response, session_id = await auth_service.authenticate_user(
                login_data=login_data,
                ip_address="127.0.0.1",
                user_agent="test-script"
            )
            
            print(f"   ✅ Authentication SUCCESSFUL!")
            print(f"   Access Token: {login_response.access_token[:50]}...")
            print(f"   User ID: {login_response.user_id}")
            print(f"   Role: {login_response.role}")
            print(f"   Session ID: {session_id[:20]}...")
            
        except Exception as e:
            print(f"   ❌ Authentication FAILED!")
            print(f"   Error: {str(e)}")
            print(f"   Error Type: {type(e).__name__}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "=" * 80)
        print("TEST COMPLETE")
        print("=" * 80)
        
    finally:
        db.close()

if __name__ == "__main__":
    asyncio.run(test_authentication())
