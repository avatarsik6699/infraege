#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env}"
TIMESTAMP="$(date -u +%Y%m%dT%H%M%SZ)"

COMPOSE_FILES=(
  -f "${PROJECT_ROOT}/docker-compose.yml"
  -f "${PROJECT_ROOT}/docker-compose.prod.yml"
)

load_env() {
  if [ ! -f "${ENV_FILE}" ]; then
    echo "error: ${ENV_FILE} does not exist" >&2
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
  done < "${ENV_FILE}"
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

load_env
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

echo "[backup] completed successfully"
