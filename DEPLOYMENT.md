## SynapseAI Hybrid Deployment (Local + GCP Cloud Run)

### Overview
This guide covers local development with Docker Compose, CI/CD with Cloud Build, migrations with Alembic, and deployment of backend and frontend as independent Cloud Run services. Secrets are managed via Secret Manager.

### Prerequisites
- GCP project and billing enabled
- gcloud CLI authenticated and configured
- Permissions to create Artifact Registry, Cloud Run, Secret Manager, and Cloud SQL resources

### Local Development
1. docker-compose up
2. Backend at http://localhost:8080, Frontend at http://localhost:3000
3. DB is Postgres 14 with volume persistence; pgAdmin available via profile dev-tools

### CI/CD Pipeline (Cloud Build)
Pipeline performs:
1) Build backend and frontend images (with BuildKit)
2) Push to Artifact Registry
3) Run Alembic migrations using DATABASE_URL secret
4) Deploy backend and frontend to Cloud Run with autoscaling, concurrency, memory, timeout

Trigger: push to main branch (set up trigger in Cloud Build UI)

### Secrets
Create and manage secrets in Secret Manager:
- database-url: DATABASE_URL (Cloud SQL recommended)
- jwt-secret: JWT signing key
- app-secret: application secret key

Grant Cloud Run SA roles/secretmanager.secretAccessor.

### Database
- Local: Postgres 14 in docker-compose; run migrations: docker compose exec backend alembic upgrade head
- Production: Cloud SQL Postgres 14; connect via Unix socket host=/cloudsql/PROJECT:REGION:INSTANCE

### Rollback
- Migrations: alembic downgrade -1 (or target revision)
- Images: redeploy previous SHA tags via deploy scripts or Cloud Run revisions

### Monitoring & Health
- Backend /health endpoint
- Frontend /health route added
- Cloud Logging via Cloud Build and Cloud Run


