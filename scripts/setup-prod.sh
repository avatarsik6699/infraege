#!/usr/bin/env bash
set -euo pipefail

PROJECT_SLUG="${1:?usage: ./scripts/setup-prod.sh <project-slug> <domain>}"
DOMAIN="${2:?usage: ./scripts/setup-prod.sh <project-slug> <domain>}"
DB_NAME="${PROJECT_SLUG//-/_}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
NGINX_FILE="${PROJECT_ROOT}/nginx/nginx.conf"
OVERRIDE_FILE="${PROJECT_ROOT}/docker-compose.override.yml"

random_hex() {
  openssl rand -hex "$1"
}

if ! command -v openssl >/dev/null 2>&1; then
  echo "error: openssl is required" >&2
  exit 1
fi

POSTGRES_PASSWORD="$(random_hex 24)"
SECRET_KEY="$(random_hex 32)"

cat > "${ENV_FILE}" <<EOF
DATABASE_URL=postgresql+asyncpg://app_user:${POSTGRES_PASSWORD}@db:5432/${DB_NAME}
POSTGRES_USER=app_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=${DB_NAME}

REDIS_URL=redis://redis:6379/0

SECRET_KEY=${SECRET_KEY}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=14

CORS_ORIGINS=["https://${DOMAIN}","https://www.${DOMAIN}"]
APP_ENV=production
LOG_LEVEL=INFO
AUTH_RATE_LIMIT=20/minute

DOMAIN=${DOMAIN}
API_BASE_URL=https://${DOMAIN}
API_BASE_INTERNAL_URL=http://backend:8000
VITE_API_BASE_URL=https://${DOMAIN}
EOF

sed -i "s/\\[DOMAIN\\]/${DOMAIN}/g" "${NGINX_FILE}"

if [ -f "${OVERRIDE_FILE}" ]; then
  rm "${OVERRIDE_FILE}"
fi

if docker compose version >/dev/null 2>&1; then
  rendered="$(mktemp)"
  docker compose -f "${PROJECT_ROOT}/docker-compose.yml" -f "${PROJECT_ROOT}/docker-compose.prod.yml" config > "${rendered}"
  if grep -Eq '\\[DOMAIN\\]|changeme|template_app|API_BASE_URL=http://localhost:8000|VITE_API_BASE_URL=http://localhost:8000' "${rendered}" "${ENV_FILE}" "${NGINX_FILE}"; then
    echo "error: rendered production config still contains template values" >&2
    rm -f "${rendered}"
    exit 1
  fi
  rm -f "${rendered}"
else
  echo "warning: docker compose not available; skipped rendered compose validation" >&2
fi

echo "Production files generated for ${PROJECT_SLUG} at ${DOMAIN}"
