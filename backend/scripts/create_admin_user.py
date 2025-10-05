#!/usr/bin/env python3
"""
Create Admin User for SynapseAI
Usage: python scripts/create_admin_user.py
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone
import uuid

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User, UserProfile
from app.core.encryption import HashingUtility
import hashlib

def create_admin_user():
    """Create default admin user"""
    db: Session = SessionLocal()
    
    try:
        # Admin credentials
        admin_email = "admin@synapseai.com"
        admin_password = "SynapseAdmin2025!"  # Strong default password
        
        # Create email hash for lookup
        email_hash = hashlib.sha256(admin_email.encode()).hexdigest()
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(
            User.email_hash == email_hash
        ).first()
        
        if existing_admin:
            print(f"⚠️  Admin user already exists: {admin_email}")
            print(f"🔑 Password: {admin_password}")
            print(f"👤 User ID: {existing_admin.id}")
            print(f"✅ Role: {existing_admin.role}")
            return
        
        # Create admin user
        admin_user_id = str(uuid.uuid4())
        admin_user = User(
            id=admin_user_id,
            email=admin_email,
            email_hash=email_hash,
            password_hash=HashingUtility.hash_password(admin_password),
            role="admin",  # Set admin role
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(admin_user)
        db.flush()
        
        # Create admin profile
        admin_profile = UserProfile(
            user_id=admin_user_id,
            first_name="Admin",
            last_name="User",
            phone="+919876543210",
            specialization="Admin"
        )
        
        db.add(admin_profile)
        db.commit()
        db.refresh(admin_user)
        
        print("✅ Admin user created successfully!")
        print(f"📧 Email: {admin_email}")
        print(f"🔑 Password: {admin_password}")
        print(f"👤 User ID: {admin_user.id}")
        print(f"✅ Role: {admin_user.role}")
        print("\n🚨 IMPORTANT: Change this password after first login!")
        
    except Exception as e:
        print(f"❌ Error creating admin user: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
