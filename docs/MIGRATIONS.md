# Database Migrations (Alembic)

## Local Commands

```bash
# Create new migration
docker compose exec backend alembic revision --autogenerate -m "description"

# Apply migrations
docker compose exec backend alembic upgrade head

# Rollback last migration
docker compose exec backend alembic downgrade -1

# Show history and current
docker compose exec backend alembic history
docker compose exec backend alembic current
```

## Health

- Backend: `/api/v1/health/migration` shows current vs head.

## Notes
- Use additive, backward-compatible migrations for zero-downtime.
- Include downgrade paths.

