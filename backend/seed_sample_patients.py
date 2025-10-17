#!/usr/bin/env python3
"""
Script to seed sample patients into the database for testing.
This creates realistic patient data for the doctor dashboard.
"""

import sys
import uuid
from datetime import datetime, timezone, timedelta
from sqlalchemy import text

# Add backend to path
sys.path.insert(0, '/Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend')

from app.core.database import get_db
from app.models.symptom import IntakePatient
from app.models.user import User

def create_sample_patients(doctor_id: str, num_patients: int = 5):
    """Create sample patients for testing."""
    db = next(get_db())
    
    sample_patients = [
        {
            "name": "Raj Sharma",
            "age": 45,
            "sex": "Male",
            "address": "123 MG Road, Mumbai, Maharashtra",
            "phone": "9876543210",
            "informants": {
                "selection": ["self", "family"],
                "other_details": "Patient and spouse present"
            },
            "illness_duration_value": 3,
            "illness_duration_unit": "months",
            "referred_by": "Dr. Patel",
            "precipitating_factor_narrative": "Work stress and family issues",
            "precipitating_factor_tags": ["stress", "work-related"]
        },
        {
            "name": "Priya Desai",
            "age": 32,
            "sex": "Female",
            "address": "45 Park Street, Kolkata, West Bengal",
            "phone": "9876543211",
            "informants": {
                "selection": ["self"],
                "other_details": None
            },
            "illness_duration_value": 6,
            "illness_duration_unit": "weeks",
            "referred_by": "Self",
            "precipitating_factor_narrative": "Recent job loss",
            "precipitating_factor_tags": ["unemployment", "anxiety"]
        },
        {
            "name": "Amit Kumar",
            "age": 28,
            "sex": "Male",
            "address": "78 Residency Road, Bangalore, Karnataka",
            "phone": "9876543212",
            "informants": {
                "selection": ["self", "family"],
                "other_details": "Mother accompanying"
            },
            "illness_duration_value": 2,
            "illness_duration_unit": "years",
            "referred_by": "Dr. Singh",
            "precipitating_factor_narrative": "Academic pressure during college",
            "precipitating_factor_tags": ["academic-stress", "depression"]
        },
        {
            "name": "Sunita Reddy",
            "age": 52,
            "sex": "Female",
            "address": "92 Jubilee Hills, Hyderabad, Telangana",
            "phone": "9876543213",
            "informants": {
                "selection": ["family"],
                "other_details": "Husband providing history"
            },
            "illness_duration_value": 1,
            "illness_duration_unit": "year",
            "referred_by": "Dr. Rao",
            "precipitating_factor_narrative": "Loss of family member",
            "precipitating_factor_tags": ["grief", "depression"]
        },
        {
            "name": "Vikram Singh",
            "age": 38,
            "sex": "Male",
            "address": "15 Civil Lines, Delhi",
            "phone": "9876543214",
            "informants": {
                "selection": ["self"],
                "other_details": None
            },
            "illness_duration_value": 4,
            "illness_duration_unit": "months",
            "referred_by": "Self",
            "precipitating_factor_narrative": "Relationship issues",
            "precipitating_factor_tags": ["relationship-stress", "anxiety"]
        }
    ]
    
    created_patients = []
    
    try:
        for i, patient_data in enumerate(sample_patients[:num_patients]):
            patient_uuid = str(uuid.uuid4())
            
            # Create intake patient
            intake_patient = IntakePatient(
                id=patient_uuid,
                name=patient_data["name"],
                age=patient_data["age"],
                sex=patient_data["sex"],
                address=patient_data["address"],
                informants=patient_data["informants"],
                illness_duration_value=patient_data["illness_duration_value"],
                illness_duration_unit=patient_data["illness_duration_unit"],
                referred_by=patient_data["referred_by"],
                precipitating_factor_narrative=patient_data["precipitating_factor_narrative"],
                precipitating_factor_tags=patient_data["precipitating_factor_tags"],
                doctor_id=doctor_id,
                main_patient_id=patient_uuid,
                created_at=datetime.now(timezone.utc) - timedelta(days=30-i*5)  # Stagger creation dates
            )
            
            # Insert minimal Patient record for FK constraint
            patient_insert_sql = text("""
                INSERT INTO patients (id, patient_id, first_name, last_name, date_of_birth, gender, created_by, name_hash)
                VALUES (:id, :patient_id, :first_name, :last_name, :dob, :gender, :created_by, :name_hash)
            """)
            
            db.execute(patient_insert_sql, {
                'id': patient_uuid,
                'patient_id': f'PT{patient_uuid[:10].upper()}',
                'first_name': patient_data["name"][:20],
                'last_name': '',
                'dob': f'{2024 - patient_data["age"]}-01-01',
                'gender': patient_data["sex"][:10],
                'created_by': doctor_id,
                'name_hash': patient_uuid[:64]
            })
            
            db.add(intake_patient)
            created_patients.append(patient_data["name"])
        
        db.commit()
        print(f"✅ Successfully created {len(created_patients)} sample patients:")
        for name in created_patients:
            print(f"   - {name}")
        
        return created_patients
        
    except Exception as e:
        db.rollback()
        print(f"❌ Error creating patients: {str(e)}")
        raise
    finally:
        db.close()


def main():
    """Main function to seed sample patients."""
    print("🌱 Seeding sample patients...")
    
    # Get the doctor from database
    db = next(get_db())
    doctor = db.query(User).filter(User.role == "doctor").first()
    
    if not doctor:
        print("❌ No doctor found in database. Please create a doctor account first.")
        sys.exit(1)
    
    print(f"📋 Using doctor: {doctor.email} (ID: {doctor.id})")
    db.close()
    
    # Create sample patients
    num_patients = 5
    if len(sys.argv) > 1:
        num_patients = int(sys.argv[1])
    
    create_sample_patients(doctor.id, num_patients)
    
    print("\n✅ Database seeding complete!")
    print("🔄 Refresh your dashboard to see the patient data.")


if __name__ == "__main__":
    main()

