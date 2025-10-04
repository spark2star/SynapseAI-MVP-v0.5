#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID=${PROJECT_ID:?set PROJECT_ID}
REGION=${REGION:-asia-south1}
INSTANCE_NAME=${INSTANCE_NAME:-synapseai-postgres}
DB_VERSION=${DB_VERSION:-POSTGRES_14}

echo "Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  artifactregistry.googleapis.com \
  cloudbuild.googleapis.com \
  secretmanager.googleapis.com \
  sqladmin.googleapis.com \
  monitoring.googleapis.com \
  logging.googleapis.com \
  --project "$PROJECT_ID"

echo "Creating Artifact Registry repository if not exists..."
gcloud artifacts repositories create synapseai-repo \
  --repository-format=docker \
  --location="$REGION" \
  --description="SynapseAI container images" \
  --project "$PROJECT_ID" || true

echo "Creating Secret Manager secrets (placeholders)..."
for secret in database-url jwt-secret app-secret; do
  if ! gcloud secrets describe "$secret" --project "$PROJECT_ID" >/dev/null 2>&1; then
    gcloud secrets create "$secret" --replication-policy=automatic --project "$PROJECT_ID"
    echo "CHANGEME" | gcloud secrets versions add "$secret" --data-file=- --project "$PROJECT_ID"
  fi
done

echo "Creating Cloud SQL instance (PostgreSQL 14)..."
gcloud sql instances create "$INSTANCE_NAME" \
  --database-version="$DB_VERSION" \
  --cpu=2 --memory=7680MiB \
  --region="$REGION" \
  --availability-type=zonal \
  --project "$PROJECT_ID" || true

echo "Creating default database and user..."
gcloud sql databases create synapseai_prod --instance="$INSTANCE_NAME" --project "$PROJECT_ID" || true
gcloud sql users create synapseai --instance="$INSTANCE_NAME" --password="CHANGEME" --project "$PROJECT_ID" || true

CONN_NAME=$(gcloud sql instances describe "$INSTANCE_NAME" --project "$PROJECT_ID" --format='get(connectionName)')
echo "Cloud SQL connection: $CONN_NAME"
echo "Example DATABASE_URL: postgresql://synapseai:CHANGEME@/synapseai_prod?host=/cloudsql/$CONN_NAME"

echo "Granting secret accessor to Cloud Run default SA..."
SA="${PROJECT_ID}@appspot.gserviceaccount.com"
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member "serviceAccount:$SA" \
  --role roles/secretmanager.secretAccessor

echo "Done. Update secret values and passwords before production use."


