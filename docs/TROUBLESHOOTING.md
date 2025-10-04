# Migration Troubleshooting

- Permission denied running startup.sh
  - Ensure image contains bash and script has executable perms.
- Alembic cannot connect in pipeline
  - Verify DATABASE_URL secret and networking.
- Out-of-date schema
  - Check `/api/v1/health/migration` and run `alembic upgrade head`.

