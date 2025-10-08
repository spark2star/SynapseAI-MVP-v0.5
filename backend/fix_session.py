#!/usr/bin/env python3
"""Fix stuck consultation session - standalone script"""

import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/synapseai_db')

# Patient ID with stuck session
PATIENT_ID = '9f512f0a-60f9-4faa-8ad6-20f218a4c7eb'

try:
    # Connect to database
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    print(f"🔍 Checking for stuck sessions for patient: {PATIENT_ID}")
    
    # Find stuck sessions
    cur.execute("""
        SELECT id, status, started_at 
        FROM consultation_sessions 
        WHERE patient_id = %s AND status = 'active'
    """, (PATIENT_ID,))
    
    stuck_sessions = cur.fetchall()
    
    if stuck_sessions:
        print(f"❌ Found {len(stuck_sessions)} stuck session(s):")
        for session_id, status, started_at in stuck_sessions:
            print(f"   - Session: {session_id} (Status: {status}, Started: {started_at})")
        
        # Fix them
        cur.execute("""
            UPDATE consultation_sessions 
            SET status = 'completed', ended_at = NOW()
            WHERE patient_id = %s AND status = 'active'
        """, (PATIENT_ID,))
        
        conn.commit()
        print(f"✅ Fixed {len(stuck_sessions)} session(s) - set to 'completed'")
    else:
        print("✅ No stuck sessions found - all clear!")
    
    cur.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    print(f"\n💡 Make sure PostgreSQL is running and DATABASE_URL is correct in .env")
    print(f"   Current URL: {DATABASE_URL}")
