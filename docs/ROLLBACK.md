# Migration Rollback Procedures

## Local

```bash
docker compose exec backend alembic downgrade -1
```

## Cloud Build Job (automated in pipeline on failure)

The pipeline creates a one-off Cloud Run Job that executes:

```bash
alembic downgrade -1
```

Ensure DATABASE_URL secret is configured. Review Cloud Logging for job output.

