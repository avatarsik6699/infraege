#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ENV_FILE:-${PROJECT_ROOT}/.env}"
BACKUP_ENV_FILE="${BACKUP_ENV_FILE:-${PROJECT_ROOT}/.env.backup}"

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

emit_status() {
  local status="$1"
  local reason="$2"
  local age_hours="$3"
  printf '{"status":"%s","reason":"%s","age_hours":%s,"max_age_hours":%s}\n' \
    "$(json_escape "${status}")" \
    "$(json_escape "${reason}")" \
    "${age_hours}" \
    "${BACKUP_MAX_AGE_HOURS}"
}

extract_json_string() {
  local key="$1"
  local file="$2"
  sed -n "s/.*\"${key}\"[[:space:]]*:[[:space:]]*\"\\([^\"]*\\)\".*/\\1/p" "${file}" | tail -n 1
}

load_env_file "${ENV_FILE}"
load_env_file "${BACKUP_ENV_FILE}"

BACKUP_STATUS_DIR="${BACKUP_STATUS_DIR:-var/backup-status}"
BACKUP_MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-36}"
BACKUP_STATUS_PATH="$(resolve_project_path "${BACKUP_STATUS_DIR}")"
MARKER_FILE="${BACKUP_STATUS_PATH}/last-success.json"

if [[ ! "${BACKUP_MAX_AGE_HOURS}" =~ ^[0-9]+$ ]] || [ "${BACKUP_MAX_AGE_HOURS}" -lt 1 ]; then
  echo "error: BACKUP_MAX_AGE_HOURS must be a positive integer" >&2
  exit 1
fi

if [ ! -f "${MARKER_FILE}" ]; then
  emit_status "degraded" "backup marker is missing" "null"
  exit 1
fi

marker_status="$(extract_json_string status "${MARKER_FILE}")"
timestamp="$(extract_json_string timestamp "${MARKER_FILE}")"

if [ "${marker_status}" != "ok" ] || [ -z "${timestamp}" ]; then
  emit_status "degraded" "backup marker is invalid" "null"
  exit 1
fi

if ! backup_epoch="$(date -u -d "${timestamp}" +%s 2>/dev/null)"; then
  emit_status "degraded" "backup marker timestamp is invalid" "null"
  exit 1
fi

now_epoch="$(date -u +%s)"
age_seconds="$((now_epoch - backup_epoch))"
if [ "${age_seconds}" -lt 0 ]; then
  emit_status "degraded" "backup marker timestamp is in the future" "null"
  exit 1
fi

age_hours="$((age_seconds / 3600))"
max_age_seconds="$((BACKUP_MAX_AGE_HOURS * 3600))"

if [ "${age_seconds}" -gt "${max_age_seconds}" ]; then
  emit_status "degraded" "backup marker is stale" "${age_hours}"
  exit 1
fi

emit_status "ok" "backup marker is fresh" "${age_hours}"
