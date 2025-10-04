#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?set PROJECT_ID}
REGION=${REGION:-asia-south1}
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/synapseai-repo/synapseai-backend:latest"

gcloud run deploy synapseai-backend \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 512Mi \
  --concurrency 80 \
  --cpu-boost \
  --max-instances 5 \
  --min-instances 0 \
  --timeout 300 \
  --set-env-vars ENVIRONMENT=production,DEBUG=false \
  --set-secrets DATABASE_URL=database-url:latest,JWT_SECRET_KEY=jwt-secret:latest,SECRET_KEY=app-secret:latest


