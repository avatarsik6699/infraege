#!/usr/bin/env bash
set -euo pipefail

PROJECT_SLUG="${1:?usage: ./scripts/setup-prod.sh <project-slug> <domain> <letsencrypt-email>}"
DOMAIN="${2:?usage: ./scripts/setup-prod.sh <project-slug> <domain> <letsencrypt-email>}"
LETSENCRYPT_EMAIL="${3:?usage: ./scripts/setup-prod.sh <project-slug> <domain> <letsencrypt-email>}"
DB_NAME="${PROJECT_SLUG//-/_}"
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${PROJECT_ROOT}/.env"
BACKUP_ENV_FILE="${PROJECT_ROOT}/.env.backup"
MONITORING_ENV_FILE="${PROJECT_ROOT}/.env.monitoring"
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
FEEDBACK_IP_PEPPER="$(random_hex 32)"

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
FEEDBACK_IP_PEPPER=${FEEDBACK_IP_PEPPER}
FEEDBACK_RATE_LIMIT=5/minute
PAGEVIEW_RATE_LIMIT=60/minute
LETSENCRYPT_EMAIL=${LETSENCRYPT_EMAIL}

DOMAIN=${DOMAIN}
API_BASE_URL=https://${DOMAIN}
API_BASE_INTERNAL_URL=http://backend:8000
VITE_API_BASE_URL=https://${DOMAIN}
VITE_PUBLIC_SITE_URL=https://${DOMAIN}
VITE_PUBLIC_APP_NAME=Template App
EOF

cat > "${BACKUP_ENV_FILE}" <<EOF
# Production backups.
# Create this file on the VPS with: sudo install -m 600 -o deploy -g deploy /dev/null /etc/${PROJECT_SLUG}/restic-password
# Then write a strong password into it. Do not commit the password file.
RESTIC_REPOSITORY=/var/backups/${PROJECT_SLUG}/restic
RESTIC_PASSWORD_FILE=/etc/${PROJECT_SLUG}/restic-password
# Commercial production should use S3-compatible off-site storage, for example:
# RESTIC_REPOSITORY=s3:https://storage.yandexcloud.net/your-backup-bucket/${PROJECT_SLUG}/restic
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_DEFAULT_REGION=ru-central1
BACKUP_REDIS=false
BACKUP_VOLUMES=
BACKUP_STATUS_DIR=var/backup-status
BACKUP_MAX_AGE_HOURS=36
BACKUP_HEARTBEAT_URL=
RESTIC_KEEP_DAILY=7
RESTIC_KEEP_WEEKLY=4
RESTIC_KEEP_MONTHLY=6
EOF

cat > "${MONITORING_ENV_FILE}" <<EOF
# Optional Gatus monitoring.
# Use /config/config.yaml for dashboard-only checks.
# Use /config/config.telegram.yaml for Telegram alerts.
# Use /config/config.custom.yaml for a webhook relay.
# Use /config/config.backup.yaml after enabling BACKUP_HEALTH_ENABLED=true.
# Alert variants: /config/config.backup.telegram.yaml and /config/config.backup.custom.yaml.
APP_DOCKER_NETWORK=${PROJECT_SLUG}_default
GATUS_CONFIG_PATH=/config/config.yaml
GATUS_BIND_ADDRESS=127.0.0.1
GATUS_WEB_PORT=8080
GATUS_MONITOR_INTERVAL=60s
GATUS_RESPONSE_TIME_LIMIT=1000
GATUS_FAILURE_THRESHOLD=3
GATUS_SUCCESS_THRESHOLD=2
GATUS_HTTP_PROXY=
GATUS_HTTPS_PROXY=
GATUS_NO_PROXY=backend,frontend,db,redis,localhost,127.0.0.1
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
TELEGRAM_TOPIC_ID=
CUSTOM_ALERT_URL=
CUSTOM_ALERT_AUTHORIZATION=
EOF

sed -i "s/\\[DOMAIN\\]/${DOMAIN}/g" "${NGINX_FILE}"

if [ -f "${OVERRIDE_FILE}" ]; then
  rm "${OVERRIDE_FILE}"
fi

if docker compose version >/dev/null 2>&1; then
  rendered="$(mktemp)"
  docker compose \
    --env-file "${ENV_FILE}" \
    -f "${PROJECT_ROOT}/docker-compose.yml" \
    -f "${PROJECT_ROOT}/docker-compose.prod.yml" \
    config > "${rendered}"
  if grep -Eq '\\[DOMAIN\\]|changeme|template_app|API_BASE_URL=http://localhost:8000|VITE_API_BASE_URL=http://localhost:8000' "${rendered}" "${ENV_FILE}" "${NGINX_FILE}"; then
    echo "error: rendered production config still contains template values" >&2
    rm -f "${rendered}"
    exit 1
  fi
  rm -f "${rendered}"

  monitoring_rendered="$(mktemp)"
  docker compose \
    --env-file "${ENV_FILE}" \
    --env-file "${MONITORING_ENV_FILE}" \
    -f "${PROJECT_ROOT}/docker-compose.monitoring.yml" \
    config > "${monitoring_rendered}"
  if grep -Eq '\\[DOMAIN\\]' "${monitoring_rendered}" "${MONITORING_ENV_FILE}"; then
    echo "error: rendered monitoring config still contains template values" >&2
    rm -f "${monitoring_rendered}"
    exit 1
  fi
  rm -f "${monitoring_rendered}"
else
  echo "warning: docker compose not available; skipped rendered compose validation" >&2
fi

echo "Production files generated for ${PROJECT_SLUG} at ${DOMAIN} (${LETSENCRYPT_EMAIL}): .env, .env.backup, .env.monitoring"
