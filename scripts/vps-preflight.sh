#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/vps-common.sh
source "${SCRIPT_DIR}/vps-common.sh"

dry_run=false
if [[ "${1:-}" == "--dry-run" ]]; then
  dry_run=true
  shift
fi
[[ "$#" -eq 0 ]] || vps_fail "Použití: scripts/vps-preflight.sh [--dry-run]"

vps_load_environment

required_environment=(
  APP_DOMAIN
  APP_PROTOCOL
  APP_RELEASE
  ACME_EMAIL
  APP_RUNTIME_UID
  APP_RUNTIME_GID
  BACKUP_RETENTION_COUNT
  DATABASE_URL
  GATEWAY_MAX_REQUEST_BODY
  GOOGLE_ALLOWED_EMAILS
  GOOGLE_CLIENT_ID
  INTERNAL_HEALTH_TOKEN
  POSTGRES_DB
  POSTGRES_PASSWORD
  POSTGRES_USER
  SINGLE_HOUSEHOLD_NAME
  SINGLE_HOUSEHOLD_OWNER_EMAIL
  VITE_API_URL
  VITE_GOOGLE_CLIENT_ID
  VPS_MIN_FREE_BYTES
  WEB_ORIGIN
)

missing=()
for key in "${required_environment[@]}"; do
  [[ -n "${!key:-}" ]] || missing+=("${key}")
done
if ((${#missing[@]} > 0)); then
  vps_fail "Chybí povinné environment názvy: ${missing[*]}."
fi

[[ "${NODE_ENV:-}" == "production" ]] ||
  vps_fail "NODE_ENV musí být production."
[[ "${TRUST_PROXY:-}" == "true" ]] ||
  vps_fail "TRUST_PROXY musí být true."
[[ "${APP_PROTOCOL}" == "https" ]] ||
  vps_fail "APP_PROTOCOL musí být https."
[[ "${WEB_ORIGIN}" == "https://${APP_DOMAIN}" ]] ||
  vps_fail "WEB_ORIGIN musí přesně odpovídat HTTPS aplikační doméně."
[[ "${VITE_API_URL}" == "/api/v1" ]] ||
  vps_fail "VITE_API_URL musí být same-origin cesta /api/v1."
[[ "${VITE_GOOGLE_CLIENT_ID}" == "${GOOGLE_CLIENT_ID}" ]] ||
  vps_fail "Frontend a backend musí používat stejný Google Client ID."
[[ "${DATABASE_URL}" == *"@db:5432/"* ]] ||
  vps_fail "DATABASE_URL musí v produkčním Compose používat host db:5432."
[[ "${GOOGLE_ALLOWED_EMAILS}" != "" ]] ||
  vps_fail "Produkční Google allowlist nesmí být prázdný."
[[ "${#INTERNAL_HEALTH_TOKEN}" -ge 32 ]] ||
  vps_fail "INTERNAL_HEALTH_TOKEN musí mít nejméně 32 znaků."
[[ "${INTERNAL_HEALTH_TOKEN}" != replace-* ]] ||
  vps_fail "INTERNAL_HEALTH_TOKEN stále obsahuje ukázkovou hodnotu."
[[ "${POSTGRES_PASSWORD}" != "homeapp_local_password" ]] ||
  vps_fail "Produkční PostgreSQL nesmí používat vývojové heslo."
[[ "${POSTGRES_PASSWORD}" != replace-* ]] ||
  vps_fail "POSTGRES_PASSWORD stále obsahuje ukázkovou hodnotu."
[[ "${APP_RUNTIME_UID}" =~ ^[0-9]+$ && "${APP_RUNTIME_UID}" -gt 0 ]] ||
  vps_fail "APP_RUNTIME_UID musí být nenulové číselné UID."
[[ "${APP_RUNTIME_GID}" =~ ^[0-9]+$ && "${APP_RUNTIME_GID}" -gt 0 ]] ||
  vps_fail "APP_RUNTIME_GID musí být nenulové číselné GID."
[[ "${BACKUP_RETENTION_COUNT}" =~ ^[0-9]+$ && "${BACKUP_RETENTION_COUNT}" -ge 1 ]] ||
  vps_fail "BACKUP_RETENTION_COUNT musí být kladné celé číslo."
[[ "${VPS_MIN_FREE_BYTES}" =~ ^[0-9]+$ && "${VPS_MIN_FREE_BYTES}" -ge 1 ]] ||
  vps_fail "VPS_MIN_FREE_BYTES musí být kladné celé číslo."

if [[ "${MAPY_API_ENABLED:-false}" == "true" ]]; then
  [[ -n "${MAPY_API_KEY:-}" && "${MAPY_API_KEY}" != replace-* ]] ||
    vps_fail "Zapnutá Mapy integrace vyžaduje skutečný backendový klíč."
fi

for command in curl df docker sha256sum ss tar; do
  command -v "${command}" >/dev/null ||
    vps_fail "Chybí požadovaný příkaz ${command}."
done
docker compose version >/dev/null ||
  vps_fail "Docker Compose plugin není dostupný."
vps_compose config --quiet ||
  vps_fail "Produkční Compose konfigurace není platná."

if "${dry_run}"; then
  printf 'Preflight dry-run prošel; runtime adresáře, porty a disk nebyly změněny.\n'
  exit 0
fi

runtime_directories=(
  "${VPS_PROJECT_ROOT}/database/postgres"
  "${VPS_PROJECT_ROOT}/uploads"
  "${VPS_PROJECT_ROOT}/backups"
  "${VPS_PROJECT_ROOT}/caddy/data"
  "${VPS_PROJECT_ROOT}/caddy/config"
)
for directory in "${runtime_directories[@]}"; do
  if [[ ! -d "${directory}" ]]; then
    install -d -m 0750 "${directory}"
  fi
  [[ -w "${directory}" ]] ||
    vps_fail "Runtime adresář ${directory} není zapisovatelný deployment uživatelem."
done

uploads_uid="$(stat --format '%u' "${VPS_PROJECT_ROOT}/uploads")"
uploads_gid="$(stat --format '%g' "${VPS_PROJECT_ROOT}/uploads")"
if [[ "${uploads_uid}" != "${APP_RUNTIME_UID}" || "${uploads_gid}" != "${APP_RUNTIME_GID}" ]]; then
  vps_fail "uploads/ musí vlastnit APP_RUNTIME_UID:APP_RUNTIME_GID; opravte vlastnictví před deployem."
fi

available_bytes="$(df --output=avail -B1 "${VPS_PROJECT_ROOT}" | tail -n 1 | tr -d ' ')"
[[ "${available_bytes}" -ge "${VPS_MIN_FREE_BYTES}" ]] ||
  vps_fail "Na disku není dostatek volného místa pro bezpečný deploy."

gateway_running=false
if vps_service_is_running gateway; then gateway_running=true; fi
for port in 80 443; do
  if ss -H -ltn | awk '{print $4}' | grep -Eq "(^|:|\\])${port}$"; then
    "${gateway_running}" ||
      vps_fail "Host port ${port} je obsazený jiným procesem."
  fi
done

printf 'VPS preflight prošel: konfigurace, adresáře, disk a porty jsou připravené.\n'
