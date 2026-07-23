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
[[ "$#" -eq 1 ]] ||
  vps_fail "Použití: scripts/restore-vps.sh [--dry-run] <cesta-k-záloze>"

backup_directory="$(cd -- "$1" 2>/dev/null && pwd)" ||
  vps_fail "Zadaná cesta k záloze neexistuje."
for required_file in database.dump uploads.tar.gz manifest.txt SHA256SUMS; do
  [[ -f "${backup_directory}/${required_file}" ]] ||
    vps_fail "Záloha neobsahuje ${required_file}."
done

(
  cd "${backup_directory}"
  sha256sum --check --strict SHA256SUMS
) >/dev/null || vps_fail "Kontrolní součty zálohy nesouhlasí."

if ! tar -tzf "${backup_directory}/uploads.tar.gz" |
  awk '
    BEGIN { valid = 1 }
    /^\// || /(^|\/)\.\.(\/|$)/ { valid = 0 }
    !/^uploads(\/|$)/ { valid = 0 }
    END { exit valid ? 0 : 1 }
  '; then
  vps_fail "Archiv uploads obsahuje nepovolenou cestu."
fi

vps_load_environment

if "${dry_run}"; then
  vps_print_command "${SCRIPT_DIR}/backup-vps.sh"
  vps_print_command docker compose -f compose.prod.yaml stop gateway api
  vps_print_command docker compose -f compose.prod.yaml exec -T db pg_restore --clean --if-exists
  vps_print_command tar --extract --gzip --file uploads.tar.gz
  vps_print_command docker compose -f compose.prod.yaml run --rm migrate
  vps_print_command docker compose -f compose.prod.yaml up -d api gateway
  exit 0
fi

printf 'Obnova nahradí databázi a uploads obsahem zálohy %s.\n' \
  "${backup_directory}"
printf 'Pro pokračování napište OBNOVIT: '
read -r confirmation
[[ "${confirmation}" == "OBNOVIT" ]] ||
  vps_fail "Obnova byla zrušena."

"${SCRIPT_DIR}/backup-vps.sh"
vps_compose stop gateway api >/dev/null
vps_compose up -d db
vps_wait_for_health db 60

vps_compose exec -T db \
  pg_restore \
  --username "${POSTGRES_USER}" \
  --dbname "${POSTGRES_DB}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error <"${backup_directory}/database.dump"

restore_workspace="$(mktemp -d "${VPS_PROJECT_ROOT}/.restore-uploads.XXXXXX")"
previous_uploads="${restore_workspace}/previous-uploads"
restore_complete=false
cleanup_restore_workspace() {
  if ! "${restore_complete}" && [[ -d "${previous_uploads}" ]]; then
    rm -rf -- "${VPS_PROJECT_ROOT}/uploads"
    mv "${previous_uploads}" "${VPS_PROJECT_ROOT}/uploads"
  fi
  rm -rf -- "${restore_workspace}"
}
trap cleanup_restore_workspace EXIT

tar \
  --extract \
  --gzip \
  --file "${backup_directory}/uploads.tar.gz" \
  --directory "${restore_workspace}" \
  --no-same-owner \
  --no-same-permissions
[[ -d "${restore_workspace}/uploads" ]] ||
  vps_fail "Záloha neobsahuje kořenový adresář uploads."

mv "${VPS_PROJECT_ROOT}/uploads" "${previous_uploads}"
mv "${restore_workspace}/uploads" "${VPS_PROJECT_ROOT}/uploads"
chown -R "${APP_RUNTIME_UID}:${APP_RUNTIME_GID}" "${VPS_PROJECT_ROOT}/uploads"
chmod -R u=rwX,go= "${VPS_PROJECT_ROOT}/uploads"

vps_compose run --rm migrate
vps_compose up -d api
vps_wait_for_health api 60
vps_compose up -d gateway
curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  "${WEB_ORIGIN}/" >/dev/null ||
  vps_fail "Readiness kontrola po obnově selhala."

rm -rf -- "${previous_uploads}"
restore_complete=true
vps_compose ps
printf 'Obnova byla dokončena; předchozí stav zůstal v nové bezpečnostní záloze.\n'
