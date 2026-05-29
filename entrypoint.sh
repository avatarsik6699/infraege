#!/bin/sh
set -e

echo "Running Alembic migrations..."
uv run alembic upgrade head

if [ "${APP_ENV:-development}" = "development" ] && [ "${SEED_ON_BOOT:-true}" = "true" ]; then
    echo "Running database seeders (APP_ENV=${APP_ENV:-development}, SEED_ON_BOOT=${SEED_ON_BOOT:-true})..."
    uv run python scripts/seed.py
else
    echo "Skipping seeders (APP_ENV=${APP_ENV:-development}, SEED_ON_BOOT=${SEED_ON_BOOT:-true})."
fi

echo "Importing repository content..."
uv run python -m app.content import

echo "Starting Uvicorn..."
# exec replaces the shell process with uvicorn so it becomes PID 1 and receives SIGTERM directly → graceful shutdown
if [ "${APP_ENV}" = "development" ]; then
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    exec uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
