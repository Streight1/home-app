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
[[ "$#" -eq 0 ]] || vps_fail "Použití: scripts/backup-vps.sh [--dry-run]"

vps_load_environment

timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_root="${VPS_PROJECT_ROOT}/backups"
backup_directory="${backup_root}/${timestamp}"

if "${dry_run}"; then
  vps_print_command docker compose -f compose.prod.yaml stop api
  vps_print_command docker compose -f compose.prod.yaml exec -T db pg_dump --format=custom
  vps_print_command tar --create --gzip --file uploads.tar.gz uploads
  printf 'DRY-RUN: vytvořit manifest, SHA256SUMS a aplikovat retention %s záloh.\n' \
    "${BACKUP_RETENTION_COUNT:-7}"
  exit 0
fi

vps_service_is_running db ||
  vps_fail "Databázová služba neběží; zálohu nelze bezpečně vytvořit."
mkdir -p "${backup_root}"
mkdir -m 0700 "${backup_directory}"

api_was_running=false
backup_complete=false
if vps_service_is_running api; then
  api_was_running=true
  vps_compose stop api >/dev/null
fi

cleanup() {
  local exit_code=$?
  if ! "${backup_complete}"; then
    rm -rf -- "${backup_directory}"
  fi
  if "${api_was_running}"; then
    vps_compose start api >/dev/null || true
  fi
  exit "${exit_code}"
}
trap cleanup EXIT

database_dump="${backup_directory}/database.dump"
uploads_archive="${backup_directory}/uploads.tar.gz"
manifest="${backup_directory}/manifest.txt"

vps_compose exec -T db \
  pg_dump \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --format custom \
  --no-owner \
  --no-privileges >"${database_dump}"
[[ -s "${database_dump}" ]] || vps_fail "pg_dump nevytvořil platný výstup."
vps_compose exec -T db pg_restore --list <"${database_dump}" >/dev/null

tar \
  --create \
  --gzip \
  --file "${uploads_archive}" \
  --directory "${VPS_PROJECT_ROOT}" \
  uploads
[[ -s "${uploads_archive}" ]] || vps_fail "Archiv uploads je prázdný."

{
  printf 'createdAt=%s\n' "${timestamp}"
  printf 'appRelease=%s\n' "${APP_RELEASE}"
  printf 'databaseFormat=postgresql-custom\n'
  printf 'uploadsFormat=tar-gzip\n'
} >"${manifest}"

(
  cd "${backup_directory}"
  sha256sum database.dump uploads.tar.gz manifest.txt >SHA256SUMS
)
chmod -R go-rwx "${backup_directory}"
backup_complete=true

retention="${BACKUP_RETENTION_COUNT:-7}"
mapfile -t expired_backups < <(
  find "${backup_root}" -mindepth 1 -maxdepth 1 -type d -printf '%f\n' |
    sort -r |
    tail -n "+$((retention + 1))"
)
for expired in "${expired_backups[@]}"; do
  [[ "${expired}" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || continue
  rm -rf -- "${backup_root:?}/${expired}"
done

printf 'Záloha byla vytvořena v %s.\n' "${backup_directory}"
