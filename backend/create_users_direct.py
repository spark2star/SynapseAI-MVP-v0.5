#!/usr/bin/env python3
"""
Direct database user creation script.
Creates demo users without using ORM to avoid encryption issues.
"""

import os
import sys
import hashlib
import bcrypt
from sqlalchemy import create_engine, text
from cryptography.fernet import Fernet

# Database connection (sync, not async)
# Use Docker Compose database credentials
DATABASE_URL = "postgresql://emr_user:emr_password@localhost:5432/emr_db"
ENCRYPTION_KEY = "ZmDfcTF7_60GrrY167zsiPd67pEvs0aGOv_6mqKcM9g="

def hash_email(email: str) -> str:
    """Generate SHA256 hash of email for efficient lookups."""
    return hashlib.sha256(email.encode()).hexdigest()

def hash_password(password: str) -> str:
    """Hash password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def encrypt_field(value: str) -> str:
    """Encrypt a field value using Fernet."""
    cipher = Fernet(ENCRYPTION_KEY.encode())
    return cipher.encrypt(value.encode()).decode()

def main():
    print("🔧 Creating demo users directly in database...")
    
    engine = create_engine(DATABASE_URL)
    
    # Demo users data
    demo_users = [
        {
            'email': 'doc@demo.com',
            'password': 'password123',
            'role': 'doctor',
            'first_name': 'Dr. Demo',
            'last_name': 'Doctor',
            'phone': '+1234567890',
            'license_number': 'MD12345',
            'specialization': 'General'
        },
        {
            'email': 'adm@demo.com',
            'password': 'password123',
            'role': 'admin',
            'first_name': 'Admin',
            'last_name': 'User',
            'phone': '+1234567891',
            'license_number': 'ADM001',
            'specialization': 'Admin'
        },
        {
            'email': 'rec@demo.com',
            'password': 'password123',
            'role': 'receptionist',
            'first_name': 'Reception',
            'last_name': 'Desk',
            'phone': '+1234567892',
            'license_number': 'REC001',
            'specialization': 'Front Desk'
        }
    ]
    
    with engine.connect() as conn:
        for user_data in demo_users:
            email = user_data['email']
            email_hash = hash_email(email)
            
            # Check if user already exists
            result = conn.execute(
                text("SELECT id FROM users WHERE email_hash = :email_hash"),
                {"email_hash": email_hash}
            )
            existing_user = result.fetchone()
            
            if existing_user:
                print(f"⏭️  User {email} already exists, skipping...")
                continue
            
            # Encrypt sensitive fields
            encrypted_email = encrypt_field(email)
            encrypted_first_name = encrypt_field(user_data['first_name'])
            encrypted_last_name = encrypt_field(user_data['last_name'])
            encrypted_phone = encrypt_field(user_data['phone'])
            encrypted_license = encrypt_field(user_data['license_number'])
            encrypted_specialization = encrypt_field(user_data['specialization'])
            
            # Hash password
            password_hash = hash_password(user_data['password'])
            
            # Generate UUID
            import uuid
            user_id = str(uuid.uuid4())
            
            # Insert user
            conn.execute(text("""
                INSERT INTO users (
                    id, email, email_hash, password_hash, role,
                    is_verified, is_active, mfa_enabled, is_locked,
                    failed_login_attempts,
                    created_at, updated_at
                )
                VALUES (
                    :id, :email, :email_hash, :password_hash, :role,
                    true, true, false, false,
                    '0',
                    NOW(), NOW()
                )
            """), {
                'id': user_id,
                'email': encrypted_email,
                'email_hash': email_hash,
                'password_hash': password_hash,
                'role': user_data['role']
            })
            
            # Generate profile ID
            profile_id = str(uuid.uuid4())
            
            # Insert user profile
            conn.execute(text("""
                INSERT INTO user_profiles (
                    id, user_id, first_name, last_name, phone,
                    license_number, specialization, timezone, language,
                    created_at, updated_at
                )
                VALUES (
                    :id, :user_id, :first_name, :last_name, :phone,
                    :license_number, :specialization, 'UTC', 'en',
                    NOW(), NOW()
                )
            """), {
                'id': profile_id,
                'user_id': user_id,
                'first_name': encrypted_first_name,
                'last_name': encrypted_last_name,
                'phone': encrypted_phone,
                'license_number': encrypted_license,
                'specialization': encrypted_specialization
            })
            
            conn.commit()
            print(f"✅ Created user: {email} (role: {user_data['role']})")
    
    print("\n🎉 Demo users created successfully!")
    print("\n📝 Login credentials:")
    print("   • doc@demo.com / password123 (Doctor)")
    print("   • adm@demo.com / password123 (Admin)")
    print("   • rec@demo.com / password123 (Receptionist)")

if __name__ == "__main__":
    main()
