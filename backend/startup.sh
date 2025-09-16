#!/bin/bash
set -e

echo "Waiting for database to be ready..."
# Simple wait - database should be ready since we have depends_on with healthcheck
sleep 5

echo "Database is ready!"

echo "Starting FastAPI application with FULL EMR SYSTEM..."
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
