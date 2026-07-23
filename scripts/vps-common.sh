#!/usr/bin/env bash

set -Eeuo pipefail

readonly VPS_SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
readonly VPS_PROJECT_ROOT="$(cd -- "${VPS_SCRIPT_DIR}/.." && pwd)"
readonly VPS_COMPOSE_FILE="${VPS_PROJECT_ROOT}/compose.prod.yaml"
readonly VPS_ENV_FILE="${HOMEAPP_ENV_FILE:-${VPS_PROJECT_ROOT}/.env}"

vps_fail() {
  printf 'Chyba: %s\n' "$1" >&2
  exit 1
}

vps_load_environment() {
  [[ -f "${VPS_ENV_FILE}" ]] ||
    vps_fail "Chybí environment soubor ${VPS_ENV_FILE}."

  declare -gA VPS_RAW_ENVIRONMENT=()
  local line
  local key
  local value
  while IFS= read -r line || [[ -n "${line}" ]]; do
    [[ -z "${line//[[:space:]]/}" || "${line}" =~ ^[[:space:]]*# ]] &&
      continue
    if [[ ! "${line}" =~ ^([A-Z][A-Z0-9_]*)=(.*)$ ]]; then
      vps_fail "Environment soubor obsahuje neplatný KEY=value řádek."
    fi
    key="${BASH_REMATCH[1]}"
    value="${BASH_REMATCH[2]}"
    if [[ "${value}" =~ ^\"(.*)\"$ || "${value}" =~ ^\'(.*)\'$ ]]; then
      value="${BASH_REMATCH[1]}"
    fi
    VPS_RAW_ENVIRONMENT["${key}"]="${value}"
  done <"${VPS_ENV_FILE}"

  for key in "${!VPS_RAW_ENVIRONMENT[@]}"; do
    vps_resolve_environment_value "${key}" 0
    printf -v "${key}" '%s' "${VPS_RESOLVED_VALUE}"
    export "${key?}"
  done
}

vps_resolve_environment_value() {
  local key="$1"
  local depth="$2"
  local value="${VPS_RAW_ENVIRONMENT[${key}]:-${!key:-}}"
  local reference
  local replacement

  ((depth < 20)) ||
    vps_fail "Environment expanze je cyklická nebo příliš hluboká."
  while [[ "${value}" =~ \$\{([A-Z][A-Z0-9_]*)\} ]]; do
    reference="${BASH_REMATCH[1]}"
    if [[ -n "${VPS_RAW_ENVIRONMENT[${reference}]+set}" ]]; then
      vps_resolve_environment_value "${reference}" "$((depth + 1))"
      replacement="${VPS_RESOLVED_VALUE}"
    else
      replacement="${!reference:-}"
    fi
    value="${value//\$\{${reference}\}/${replacement}}"
  done
  VPS_RESOLVED_VALUE="${value}"
}

vps_compose() {
  docker compose \
    --env-file "${VPS_ENV_FILE}" \
    -f "${VPS_COMPOSE_FILE}" \
    "$@"
}

vps_service_is_running() {
  vps_compose ps --status running --services 2>/dev/null |
    grep -Fxq "$1"
}

vps_wait_for_health() {
  local service="$1"
  local attempts="${2:-60}"
  local container_id
  local status

  for ((attempt = 1; attempt <= attempts; attempt += 1)); do
    container_id="$(vps_compose ps -q "${service}")"
    if [[ -n "${container_id}" ]]; then
      status="$(docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "${container_id}")"
      if [[ "${status}" == "healthy" || "${status}" == "running" ]]; then
        return 0
      fi
      if [[ "${status}" == "unhealthy" || "${status}" == "exited" ]]; then
        vps_fail "Služba ${service} skončila ve stavu ${status}."
      fi
    fi
    sleep 2
  done

  vps_fail "Služba ${service} nebyla včas připravená."
}

vps_print_command() {
  printf 'DRY-RUN:'
  printf ' %q' "$@"
  printf '\n'
}
