#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/../backend"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must be set in the environment" >&2
  exit 1
fi

pip install -r requirements.txt >/dev/null
alembic upgrade head


