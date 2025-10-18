"""
Simple test script to verify the dashboard endpoint implementation.
This script tests the endpoint logic without requiring a running server.
"""

import sys
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

# Add backend to path
sys.path.insert(0, '/Users/kiro/synapse-ai')

from backend.app.core.database import SessionLocal
from backend.app.api.api_v1.endpoints.dashboard import (
    _get_pending_intake_patients,
    _get_needs_attention_count,
    _get_pending_reports_count,
    _get_active_patients_count,
    _get_weekly_sessions
)


def test_dashboard_queries():
    """Test all dashboard query functions."""
    db = SessionLocal()
    
    try:
        # Use a test doctor ID - you'll need to replace this with an actual doctor ID from your database
        test_doctor_id = "test-doctor-id"
        
        print("Testing Dashboard Endpoint Queries")
        print("=" * 50)
        
        # Test 1: Pending intake patients
        print("\n1. Testing pending intake patients query...")
        pending_patients = _get_pending_intake_patients(db, test_doctor_id)
        print(f"   Result: {len(pending_patients)} pending patients")
        if pending_patients:
            print(f"   Sample: {pending_patients[0]}")
        
        # Test 2: Needs attention count
        print("\n2. Testing needs attention count query...")
        needs_attention = _get_needs_attention_count(db, test_doctor_id)
        print(f"   Result: {needs_attention} patients need attention")
        
        # Test 3: Pending reports count
        print("\n3. Testing pending reports count query...")
        pending_reports = _get_pending_reports_count(db, test_doctor_id)
        print(f"   Result: {pending_reports} pending reports")
        
        # Test 4: Active patients count
        print("\n4. Testing active patients count query...")
        active_patients = _get_active_patients_count(db, test_doctor_id)
        print(f"   Result: {active_patients} active patients")
        
        # Test 5: Weekly sessions
        print("\n5. Testing weekly sessions query...")
        weekly_sessions = _get_weekly_sessions(db, test_doctor_id)
        print(f"   Result: {len(weekly_sessions)} days")
        for session_day in weekly_sessions:
            print(f"   {session_day['day']}: {session_day['count']} sessions")
        
        print("\n" + "=" * 50)
        print("All queries executed successfully!")
        print("\nNote: If all counts are 0, you may need to:")
        print("1. Replace 'test-doctor-id' with an actual doctor ID")
        print("2. Ensure you have test data in your database")
        
    except Exception as e:
        print(f"\nError during testing: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_dashboard_queries()
