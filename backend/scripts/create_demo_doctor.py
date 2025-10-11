#!/usr/bin/env python3
"""
Create Demo Doctor for SynapseAI
Usage: python scripts/create_demo_doctor.py
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

def create_demo_doctor():
    """Create demo doctor user"""
    db: Session = SessionLocal()
    
    try:
        # Demo doctor credentials
        doctor_email = "doc@demo.com"
        doctor_password = "demo123"
        
        # Create email hash for lookup
        email_hash = hashlib.sha256(doctor_email.encode()).hexdigest()
        
        # Delete existing demo doctor
        existing_doctor = db.query(User).filter(
            User.email_hash == email_hash
        ).first()
        
        if existing_doctor:
            print(f"🗑️  Deleting existing demo doctor...")
            db.delete(existing_doctor)
            db.commit()
        
        # Create demo doctor
        doctor_user_id = str(uuid.uuid4())
        doctor_user = User(
            id=doctor_user_id,
            email=doctor_email,
            email_hash=email_hash,
            password_hash=HashingUtility.hash_password(doctor_password),
            role="doctor",
            is_active=True,
            is_verified=True,
            created_at=datetime.now(timezone.utc)
        )
        
        db.add(doctor_user)
        db.flush()
        
        # Create doctor profile
        doctor_profile = UserProfile(
            user_id=doctor_user_id,
            first_name="Demo",
            last_name="Doctor",
            phone="+919876543210",
            specialization="General Medicine"
        )
        
        db.add(doctor_profile)
        db.commit()
        db.refresh(doctor_user)
        
        print("✅ Demo doctor created successfully!")
        print(f"📧 Email: {doctor_email}")
        print(f"🔑 Password: {doctor_password}")
        print(f"👤 User ID: {doctor_user.id}")
        print(f"✅ Role: {doctor_user.role}")
        
    except Exception as e:
        print(f"❌ Error creating demo doctor: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_demo_doctor()
