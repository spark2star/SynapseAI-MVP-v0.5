#!/usr/bin/env bash
set -euo pipefail

echo "Starting database migration..."

# Wait for database to be ready (asyncpg quick check)
python - <<'PY'
import os, asyncio, sys
import asyncpg

async def main():
    url = os.environ.get('DATABASE_URL')
    if not url:
        print('DATABASE_URL not set', file=sys.stderr)
        sys.exit(1)
    # Ensure asyncpg scheme
    if url.startswith('postgresql://'):
        url = url.replace('postgresql://', 'postgresql+asyncpg://', 1)
    # asyncpg.connect expects postgresql://
    connect_url = os.environ['DATABASE_URL'].replace('postgresql+asyncpg://', 'postgresql://')
    for _ in range(30):
        try:
            conn = await asyncpg.connect(connect_url)
            await conn.close()
            return
        except Exception as e:
            await asyncio.sleep(2)
    print('Database connection failed', file=sys.stderr)
    sys.exit(1)

asyncio.run(main())
PY

# Run migrations with rollback on failure
if ! alembic upgrade head; then
  echo "Migration failed - attempting rollback one step"
  alembic downgrade -1 || true
  exit 1
fi

echo "Migration completed successfully"

exec uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload

