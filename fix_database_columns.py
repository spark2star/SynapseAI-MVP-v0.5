#!/usr/bin/env python3
"""
Quick fix script to increase transcription column sizes in the database.
Run this from the backend directory.
"""

import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.core.database import engine
from sqlalchemy import text

def fix_column_sizes():
    """Increase transcript_text and original_transcript column sizes to 50000"""
    
    print("🔧 Fixing transcription column sizes...")
    print("=" * 60)
    
    try:
        with engine.connect() as conn:
            # Start transaction
            trans = conn.begin()
            
            try:
                # Increase transcript_text column size
                print("📝 Updating transcript_text column...")
                conn.execute(text(
                    "ALTER TABLE transcriptions "
                    "ALTER COLUMN transcript_text TYPE VARCHAR(50000)"
                ))
                
                # Increase original_transcript column size
                print("📝 Updating original_transcript column...")
                conn.execute(text(
                    "ALTER TABLE transcriptions "
                    "ALTER COLUMN original_transcript TYPE VARCHAR(50000)"
                ))
                
                # Commit transaction
                trans.commit()
                
                print("=" * 60)
                print("✅ Column sizes updated successfully!")
                print("   - transcript_text: VARCHAR(10000) → VARCHAR(50000)")
                print("   - original_transcript: VARCHAR(10000) → VARCHAR(50000)")
                print()
                print("🎉 You can now generate reports with longer transcripts!")
                
                return True
                
            except Exception as e:
                trans.rollback()
                raise e
                
    except Exception as e:
        print("=" * 60)
        print(f"❌ Error updating column sizes: {str(e)}")
        print()
        print("💡 Try running the SQL manually:")
        print("   psql -h 127.0.0.1 -U emr_user -d emr_db")
        print("   ALTER TABLE transcriptions ALTER COLUMN transcript_text TYPE VARCHAR(50000);")
        print("   ALTER TABLE transcriptions ALTER COLUMN original_transcript TYPE VARCHAR(50000);")
        return False

if __name__ == "__main__":
    success = fix_column_sizes()
    sys.exit(0 if success else 1)
