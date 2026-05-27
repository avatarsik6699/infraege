#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env}"
RESTORE_TARGET="$(mktemp -d)"
RESTORE_DB_NAME="restore_check_$(date -u +%Y%m%d%H%M%S)"

COMPOSE_FILES=(
  -f "${PROJECT_ROOT}/docker-compose.yml"
  -f "${PROJECT_ROOT}/docker-compose.prod.yml"
)

cleanup() {
  set +e
  rm -rf "${RESTORE_TARGET}"
  if [ -n "${POSTGRES_USER:-}" ]; then
    cd "${PROJECT_ROOT}" || exit 0
    docker compose "${COMPOSE_FILES[@]}" exec -T db \
      dropdb -U "${POSTGRES_USER}" --if-exists "${RESTORE_DB_NAME}" >/dev/null 2>&1
  fi
}
trap cleanup EXIT

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

cd "${PROJECT_ROOT}"

echo "[restore-check] restoring latest backup snapshot into ${RESTORE_TARGET}"
restic_cmd restore latest --target "${RESTORE_TARGET}" --tag app-backup

dump_file="$(find "${RESTORE_TARGET}" -type f -name "postgres_${POSTGRES_DB}_*.dump" | sort | tail -n 1)"
if [ -z "${dump_file}" ]; then
  echo "error: PostgreSQL dump for ${POSTGRES_DB} was not found in latest snapshot" >&2
  exit 1
fi

echo "[restore-check] creating temporary database ${RESTORE_DB_NAME}"
docker compose "${COMPOSE_FILES[@]}" exec -T db \
  createdb -U "${POSTGRES_USER}" "${RESTORE_DB_NAME}"

echo "[restore-check] restoring dump into ${RESTORE_DB_NAME}"
docker compose "${COMPOSE_FILES[@]}" exec -T db \
  pg_restore -U "${POSTGRES_USER}" -d "${RESTORE_DB_NAME}" --clean --if-exists \
  < "${dump_file}"

echo "[restore-check] dropping temporary database ${RESTORE_DB_NAME}"
docker compose "${COMPOSE_FILES[@]}" exec -T db \
  dropdb -U "${POSTGRES_USER}" --if-exists "${RESTORE_DB_NAME}"

echo "[restore-check] restore verification completed successfully"
