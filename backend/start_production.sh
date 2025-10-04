#!/bin/bash
cd /Users/wildeagle/Documents/SynapseAI/MVP/MVP_v0.5/backend
export DATABASE_URL="postgresql+asyncpg://emr_user:emr_password@localhost:5432/emr_db"
export REDIS_URL="redis://localhost:6379/0"
export ENCRYPTION_KEY="dev-encryption-key-32-bytes-long!"
export FIELD_ENCRYPTION_KEY="dev-field-encryption-key-32-bytes!"
export SECRET_KEY="dev-secret-key-change-in-development"
export JWT_SECRET_KEY="dev-jwt-secret-key-change-in-development"
export DEBUG="True"

# Use venv's python directly
./venv/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
