#!/usr/bin/env python3
"""
Create demo users for the EMR system with raw SQL to bypass encryption length issues temporarily.
"""

import sys
import os
from datetime import datetime, timezone
import uuid

# Add the backend app to the Python path
sys.path.append('/app')

from sqlalchemy import text
from app.core.database import SessionLocal
from app.models.user import UserRole
from app.core.encryption import HashingUtility, DatabaseEncryption

def create_demo_users_simple():
    """Create demo users using raw SQL."""
    db = SessionLocal()
    hash_util = HashingUtility()
    encryptor = DatabaseEncryption()
    
    try:
        demo_users = [
            {
                "email": "doc@demo.com",
                "password": "password123",
                "role": UserRole.DOCTOR.value,
                "first_name": "Dr",
                "last_name": "Smith",
                "phone": "+15550123",
                "license_number": "MD12345",
                "specialization": "General"
            },
            {
                "email": "adm@demo.com",
                "password": "password123",
                "role": UserRole.ADMIN.value,
                "first_name": "Admin",
                "last_name": "User",
                "phone": "+15550124",
                "license_number": None,
                "specialization": None
            }
        ]
        
        for user_data in demo_users:
            # Check if this specific user exists by email
            encrypted_email_check = encryptor.encrypt_field(user_data["email"])
            result = db.execute(text("SELECT id FROM users WHERE email = :email"), {"email": encrypted_email_check}).fetchone()
            if result:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user
            user_id = str(uuid.uuid4())
            password_hash = hash_util.hash_password(user_data["password"])
            encrypted_email = encryptor.encrypt_field(user_data["email"])
            
            # Generate email hash for efficient lookups
            import hashlib
            email_hash = hashlib.sha256(user_data["email"].lower().strip().encode('utf-8')).hexdigest()
            
            now = datetime.now(timezone.utc)
            
            db.execute(text("""
                INSERT INTO users (id, email, email_hash, password_hash, role, is_verified, is_active, 
                                   is_locked, mfa_enabled, failed_login_attempts, created_at, updated_at)
                VALUES (:id, :email, :email_hash, :password_hash, :role, true, true, false, false, '0', :now, :now)
            """), {
                "id": user_id,
                "email": encrypted_email,
                "email_hash": email_hash,
                "password_hash": password_hash,
                "role": user_data["role"],
                "now": now
            })
            
            # Create profile with encrypted fields
            profile_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO user_profiles (id, user_id, first_name, last_name, phone, 
                                           license_number, specialization, timezone, language, created_at, updated_at)
                VALUES (:id, :user_id, :first_name, :last_name, :phone, 
                        :license_number, :specialization, 'UTC', 'en', :now, :now)
            """), {
                "id": profile_id,
                "user_id": user_id,
                "first_name": encryptor.encrypt_field(user_data["first_name"]),
                "last_name": encryptor.encrypt_field(user_data["last_name"]),
                "phone": encryptor.encrypt_field(user_data["phone"]),
                "license_number": encryptor.encrypt_field(user_data["license_number"]) if user_data["license_number"] else None,
                "specialization": encryptor.encrypt_field(user_data["specialization"]) if user_data["specialization"] else None,
                "now": now
            })
            
            print(f"✅ Created user: {user_data['email']} ({user_data['role']})")
        
        db.commit()
        print("\n🎉 Demo users created successfully!")
        print("\nDemo Credentials:")
        print("- doc@demo.com / password123 (Doctor)")
        print("- adm@demo.com / password123 (Admin)")
        
    except Exception as e:
        print(f"❌ Error creating demo users: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users_simple()

