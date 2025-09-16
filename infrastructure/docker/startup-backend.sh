#!/bin/bash
set -e

echo "Waiting for database to be ready..."
until PGPASSWORD=emr_password psql -h postgres -U emr_user -d emr_db -c '\q'; do
  >&2 echo "Database is unavailable - sleeping"
  sleep 1
done

echo "Database is ready!"

echo "Starting FastAPI application..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
