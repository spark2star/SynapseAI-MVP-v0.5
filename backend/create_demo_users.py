#!/usr/bin/env python3
"""
Create demo users for the EMR system.
Run this script to populate the database with test users.
"""

import asyncio
import sys
import os
from datetime import datetime, timezone

# Add the backend app to the Python path
sys.path.append('/app')

import app.models  # Ensure models are imported so Base.metadata has all tables
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, create_tables
from app.models.user import User, UserProfile, UserRole
from app.core.encryption import HashingUtility

def create_demo_users():
    """Create demo users for testing."""
    db = SessionLocal()
    hash_util = HashingUtility()
    
    try:
        # Ensure tables exist
        create_tables()
        
        demo_users = [
            {
                "email": "doc@demo.com",
                "password": "password123",
                "role": UserRole.DOCTOR,
                "profile": {
                    "first_name": "Dr",
                    "last_name": "Smith",
                    "phone": "+15550123",
                    "license_number": "MD12345",
                    "specialization": "General",
                    "timezone": "UTC",
                    "language": "en"
                }
            },
            {
                "email": "adm@demo.com", 
                "password": "password123",
                "role": UserRole.ADMIN,
                "profile": {
                    "first_name": "Admin",
                    "last_name": "User",
                    "phone": "+15550124",
                    "license_number": None,
                    "specialization": None,
                    "timezone": "UTC",
                    "language": "en"
                }
            },
            {
                "email": "rec@demo.com",
                "password": "password123", 
                "role": UserRole.RECEPTIONIST,
                "profile": {
                    "first_name": "Recept",
                    "last_name": "Desk",
                    "phone": "+15550125",
                    "license_number": None,
                    "specialization": None,
                    "timezone": "UTC",
                    "language": "en"
                }
            }
        ]
        
        for user_data in demo_users:
            # Check if user already exists by querying all users
            # (Can't filter by encrypted email directly)
            all_users = db.query(User).all()
            existing_user = None
            for u in all_users:
                if u.email == user_data["email"]:  # Will decrypt and compare
                    existing_user = u
                    break
            
            if existing_user:
                print(f"User {user_data['email']} already exists, skipping...")
                continue
            
            # Create user - password must be plain text, will be hashed
            # Email will be automatically encrypted by the model
            user = User(
                email=user_data["email"],
                password_hash=hash_util.hash_password(user_data["password"]),
                role=user_data["role"],
                is_verified=True,
                is_active=True,
                failed_login_attempts="0",
                is_locked=False,
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            db.add(user)
            db.flush()  # Get the user ID
            
            # Create user profile
            profile = UserProfile(
                user_id=user.id,
                first_name=user_data["profile"]["first_name"],
                last_name=user_data["profile"]["last_name"],
                phone=user_data["profile"]["phone"],
                license_number=user_data["profile"]["license_number"],
                specialization=user_data["profile"]["specialization"],
                timezone=user_data["profile"]["timezone"],
                language=user_data["profile"]["language"],
                created_at=datetime.now(timezone.utc),
                updated_at=datetime.now(timezone.utc)
            )
            
            db.add(profile)
            print(f"✅ Created user: {user_data['email']} ({user_data['role']})")
        
        db.commit()
        print("\n🎉 Demo users created successfully!")
        print("\nDemo Credentials:")
        print("- doc@demo.com / password123 (Doctor)")
        print("- adm@demo.com / password123 (Admin)")  
        print("- rec@demo.com / password123 (Receptionist)")
        
    except Exception as e:
        print(f"❌ Error creating demo users: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_users()
