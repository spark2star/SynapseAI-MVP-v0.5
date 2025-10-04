#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?set PROJECT_ID}
REGION=${REGION:-asia-south1}
IMAGE="asia-south1-docker.pkg.dev/${PROJECT_ID}/synapseai-repo/synapseai-frontend:latest"

gcloud run deploy synapseai-frontend \
  --image "$IMAGE" \
  --region "$REGION" \
  --platform managed \
  --allow-unauthenticated \
  --memory 256Mi \
  --max-instances 5 \
  --min-instances 0


