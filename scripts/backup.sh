#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-${PROJECT_ROOT}/.env.backup}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"
SUCCESS_TIMESTAMP="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

COMPOSE_FILES=(
  -f "${PROJECT_ROOT}/docker-compose.yml"
  -f "${PROJECT_ROOT}/docker-compose.prod.yml"
)

load_env_file() {
  local env_file="$1"
  if [ ! -f "${env_file}" ]; then
    echo "error: ${env_file} does not exist" >&2
    exit 1
  fi

  local line key value
  while IFS= read -r line || [ -n "${line}" ]; do
    line="${line#"${line%%[![:space:]]*}"}"
    line="${line%"${line##*[![:space:]]}"}"

    if [ -z "${line}" ] || [ "${line#\#}" != "${line}" ] || [ "${line#*=}" = "${line}" ]; then
      continue
    fi

    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"

    if [[ ! "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi

    if [ "${value#\"}" != "${value}" ] && [ "${value%\"}" != "${value}" ]; then
      value="${value#\"}"
      value="${value%\"}"
    elif [ "${value#\'}" != "${value}" ] && [ "${value%\'}" != "${value}" ]; then
      value="${value#\'}"
      value="${value%\'}"
    fi

    export "${key}=${value}"
  done < "${env_file}"
}

require_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "error: required command not found: $1" >&2
    exit 1
  fi
}

require_env() {
  local name="$1"
  if [ -z "${!name:-}" ]; then
    echo "error: ${name} is required" >&2
    exit 1
  fi
}

json_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  value="${value//$'\n'/\\n}"
  value="${value//$'\r'/\\r}"
  value="${value//$'\t'/\\t}"
  printf '%s' "${value}"
}

resolve_project_path() {
  local path="$1"
  if [ "${path#/}" != "${path}" ]; then
    printf '%s\n' "${path}"
  else
    printf '%s\n' "${PROJECT_ROOT}/${path}"
  fi
}

restic_cmd() {
  restic \
    --repo "${RESTIC_REPOSITORY}" \
    --password-file "${RESTIC_PASSWORD_FILE}" \
    "$@"
}

backup_docker_volume() {
  local volume="$1"
  local target_dir="$2"
  local archive="${target_dir}/volume_${volume}_${TIMESTAMP}.tar.gz"

  echo "[backup] archiving Docker volume ${volume}"
  docker run --rm \
    -v "${volume}:/data:ro" \
    -v "${target_dir}:/backup" \
    alpine:3.20 \
    tar czf "/backup/$(basename "${archive}")" -C /data .
}

load_env_file "${ENV_FILE}"
load_env_file "${BACKUP_ENV_FILE}"
require_command docker
require_command restic
require_env POSTGRES_USER
require_env POSTGRES_DB
require_env RESTIC_REPOSITORY
require_env RESTIC_PASSWORD_FILE

if [ ! -f "${RESTIC_PASSWORD_FILE}" ]; then
  echo "error: RESTIC_PASSWORD_FILE does not exist: ${RESTIC_PASSWORD_FILE}" >&2
  exit 1
fi

RESTIC_KEEP_DAILY="${RESTIC_KEEP_DAILY:-7}"
RESTIC_KEEP_WEEKLY="${RESTIC_KEEP_WEEKLY:-4}"
RESTIC_KEEP_MONTHLY="${RESTIC_KEEP_MONTHLY:-6}"
BACKUP_REDIS="${BACKUP_REDIS:-false}"
BACKUP_VOLUMES="${BACKUP_VOLUMES:-}"
BACKUP_STATUS_DIR="${BACKUP_STATUS_DIR:-var/backup-status}"
BACKUP_STATUS_PATH="$(resolve_project_path "${BACKUP_STATUS_DIR}")"
BACKUP_HEARTBEAT_URL="${BACKUP_HEARTBEAT_URL:-}"
BACKUP_MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-36}"

if [[ ! "${BACKUP_MAX_AGE_HOURS}" =~ ^[0-9]+$ ]] || [ "${BACKUP_MAX_AGE_HOURS}" -lt 1 ]; then
  echo "error: BACKUP_MAX_AGE_HOURS must be a positive integer" >&2
  exit 1
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TEMP_DIR}"' EXIT

cd "${PROJECT_ROOT}"

echo "[backup] writing PostgreSQL dump for ${POSTGRES_DB}"
docker compose "${COMPOSE_FILES[@]}" exec -T db \
  pg_dump -U "${POSTGRES_USER}" -d "${POSTGRES_DB}" -Fc \
  > "${TEMP_DIR}/postgres_${POSTGRES_DB}_${TIMESTAMP}.dump"

if [ "${BACKUP_REDIS}" = "true" ]; then
  echo "[backup] writing Redis dump"
  docker compose "${COMPOSE_FILES[@]}" exec -T redis redis-cli BGSAVE >/dev/null
  sleep 5
  docker compose "${COMPOSE_FILES[@]}" cp redis:/data/dump.rdb \
    "${TEMP_DIR}/redis_${TIMESTAMP}.rdb"
else
  echo "[backup] skipping Redis backup; set BACKUP_REDIS=true to enable it"
fi

if [ -n "${BACKUP_VOLUMES}" ]; then
  IFS=',' read -r -a volumes <<< "${BACKUP_VOLUMES}"
  for volume in "${volumes[@]}"; do
    volume="${volume#"${volume%%[![:space:]]*}"}"
    volume="${volume%"${volume##*[![:space:]]}"}"
    if [ -n "${volume}" ]; then
      backup_docker_volume "${volume}" "${TEMP_DIR}"
    fi
  done
fi

echo "[backup] saving files into restic repository"
restic_cmd backup \
  --tag app-backup \
  --tag "postgres:${POSTGRES_DB}" \
  --host "$(hostname)" \
  "${TEMP_DIR}"

echo "[backup] applying retention policy"
restic_cmd forget \
  --tag app-backup \
  --keep-daily "${RESTIC_KEEP_DAILY}" \
  --keep-weekly "${RESTIC_KEEP_WEEKLY}" \
  --keep-monthly "${RESTIC_KEEP_MONTHLY}" \
  --prune

mkdir -p "${BACKUP_STATUS_PATH}"
cat > "${BACKUP_STATUS_PATH}/last-success.json" <<EOF
{"status":"ok","timestamp":"$(json_escape "${SUCCESS_TIMESTAMP}")","postgres_db":"$(json_escape "${POSTGRES_DB}")","hostname":"$(json_escape "$(hostname)")","restic_repository":"$(json_escape "${RESTIC_REPOSITORY}")","max_age_hours":${BACKUP_MAX_AGE_HOURS}}
EOF

if [ -n "${BACKUP_HEARTBEAT_URL}" ]; then
  require_command curl
  echo "[backup] sending backup heartbeat"
  curl -fsS --max-time 20 "${BACKUP_HEARTBEAT_URL}" >/dev/null
fi

echo "[backup] completed successfully"
