# Database Column Size Fix - Transcription Text Too Long

## Problem
Report generation is failing with error:
```
value too long for type character varying(10000)
```

The encrypted transcript text (17,614 characters) exceeds the database column limit of 10,000 characters.

## Root Cause
- `transcript_text` and `original_transcript` columns are defined as `EncryptedType(10000)`
- Encryption adds significant overhead (base64 encoding + encryption metadata)
- A 7,000 character transcript becomes ~17,600 characters after encryption
- Database rejects the insert because 17,600 > 10,000

## Solution Applied

### 1. Updated Model Definition
File: `backend/app/models/session.py`

Changed from:
```python
transcript_text = Column(EncryptedType(10000), nullable=False)
original_transcript = Column(EncryptedType(10000), nullable=True)
```

To:
```python
transcript_text = Column(EncryptedType(50000), nullable=False)
original_transcript = Column(EncryptedType(50000), nullable=True)
```

### 2. Database Migration Required

You need to run a migration to update the existing database columns:

```sql
ALTER TABLE transcriptions 
ALTER COLUMN transcript_text TYPE VARCHAR(50000);

ALTER TABLE transcriptions 
ALTER COLUMN original_transcript TYPE VARCHAR(50000);
```

## Steps to Fix

### Option 1: Using Alembic (Recommended)

```bash
cd backend

# Create a new migration
alembic revision -m "increase_transcription_text_column_size"

# Edit the generated migration file in backend/alembic/versions/
# Add the ALTER TABLE statements above

# Run the migration
alembic upgrade head
```

### Option 2: Manual SQL (Quick Fix)

Connect to your database and run:

```bash
psql -h 127.0.0.1 -U emr_user -d emr_db
```

Then execute:

```sql
ALTER TABLE transcriptions 
ALTER COLUMN transcript_text TYPE VARCHAR(50000);

ALTER TABLE transcriptions 
ALTER COLUMN original_transcript TYPE VARCHAR(50000);
```

### Option 3: Using Python Script

```bash
cd backend
python -c "
from app.core.database import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text('ALTER TABLE transcriptions ALTER COLUMN transcript_text TYPE VARCHAR(50000)'))
    conn.execute(text('ALTER TABLE transcriptions ALTER COLUMN original_transcript TYPE VARCHAR(50000)'))
    conn.commit()
    print('✅ Column sizes updated successfully')
"
```

## Verification

After running the migration, test report generation:

1. Create a new consultation session
2. Add a long transcript (5000+ characters)
3. Generate a report
4. Should succeed without "value too long" error

## Why 50,000?

- Typical consultation: 2,000-5,000 characters
- After encryption: ~5,000-12,500 characters  
- 50,000 limit provides 4x safety margin
- Allows for very long consultations (20,000+ characters unencrypted)

## Files Modified
- `backend/app/models/session.py` - Increased EncryptedType size to 50000

## Status
✅ Code fixed - awaiting database migration
⏳ Database migration required before testing

## Note
This is a **separate issue** from the Gemini model problem. Both need to be fixed:
1. Gemini model configuration (already fixed in code, needs backend restart)
2. Database column size (this fix, needs migration)
