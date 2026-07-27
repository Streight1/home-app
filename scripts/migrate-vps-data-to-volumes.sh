#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd -- "${SCRIPT_DIR}/.." && pwd)"
DEPLOYMENT_ROOT="${PROJECT_ROOT}/deployment"
DEPLOYMENT_ENV="${DEPLOYMENT_ROOT}/.env"
DEPLOYMENT_COMPOSE="${DEPLOYMENT_ROOT}/compose.yaml"

# shellcheck source=scripts/vps-common.sh
source "${SCRIPT_DIR}/vps-common.sh"

mode="${1:-}"
[[ "${mode}" == "--dry-run" || "${mode}" == "--execute" ]] ||
  vps_fail "Použití: scripts/migrate-vps-data-to-volumes.sh --dry-run|--execute"
[[ "$#" -eq 1 ]] ||
  vps_fail "Použití: scripts/migrate-vps-data-to-volumes.sh --dry-run|--execute"

[[ -f "${DEPLOYMENT_ENV}" ]] ||
  vps_fail "Chybí ${DEPLOYMENT_ENV}; nejprve připravte nové deployment nastavení."
for secret in postgres_password internal_health_token mapy_api_key; do
  [[ -f "${DEPLOYMENT_ROOT}/secrets/${secret}" ]] ||
    vps_fail "Chybí deployment secret ${secret}."
done

deployment_value() {
  local key="$1"
  local fallback="$2"
  local value
  value="$(
    sed -n "s/^${key}=//p" "${DEPLOYMENT_ENV}" | tail -n 1
  )"
  printf '%s' "${value:-${fallback}}"
}

POSTGRES_VOLUME_NAME="$(
  deployment_value POSTGRES_VOLUME_NAME homeapp_postgres_data
)"
UPLOADS_VOLUME_NAME="$(
  deployment_value UPLOADS_VOLUME_NAME homeapp_uploads_data
)"

deployment_compose() {
  docker compose \
    --env-file "${DEPLOYMENT_ENV}" \
    -f "${DEPLOYMENT_COMPOSE}" \
    "$@"
}

print_deployment_command() {
  printf 'DRY-RUN: docker compose --env-file deployment/.env -f deployment/compose.yaml'
  printf ' %q' "$@"
  printf '\n'
}

vps_load_environment
vps_service_is_running db ||
  vps_fail "Původní PostgreSQL neběží; nejprve ověřte legacy stack."
[[ -d "${PROJECT_ROOT}/uploads" ]] ||
  vps_fail "Původní bind mount uploads neexistuje."

if [[ "${mode}" == "--dry-run" ]]; then
  printf 'DRY-RUN: ověřit, že cílové named volumes jsou nové a prázdné.\n'
  vps_print_command "${SCRIPT_DIR}/backup-vps.sh"
  print_deployment_command up -d volumes-init db
  printf 'DRY-RUN: obnovit pg_dump do nového PostgreSQL volume.\n'
  printf 'DRY-RUN: obnovit uploads archiv do nového uploads volume.\n'
  printf 'DRY-RUN: porovnat počet a SHA-256 manifest všech upload souborů.\n'
  print_deployment_command run --rm migrate
  vps_print_command docker compose -f compose.prod.yaml stop gateway api db
  print_deployment_command up -d
  printf 'DRY-RUN: původní bind mount data zůstanou beze změny.\n'
  exit 0
fi

for volume in "${POSTGRES_VOLUME_NAME}" "${UPLOADS_VOLUME_NAME}"; do
  if docker volume inspect "${volume}" >/dev/null 2>&1; then
    vps_fail "Cílový volume ${volume} již existuje; migrace jej nepřepíše."
  fi
done

printf 'Migrace vytvoří nové named volumes a ponechá původní bind mounty.\n'
printf 'Pro pokračování napište MIGROVAT: '
read -r confirmation
[[ "${confirmation}" == "MIGROVAT" ]] ||
  vps_fail "Migrace byla zrušena."

before_backup="$(
  find "${PROJECT_ROOT}/backups" -mindepth 1 -maxdepth 1 -type d \
    -name '????????T??????Z' -printf '%f\n' 2>/dev/null |
    sort -r |
    head -n 1
)"
"${SCRIPT_DIR}/backup-vps.sh"
backup_id="$(
  find "${PROJECT_ROOT}/backups" -mindepth 1 -maxdepth 1 -type d \
    -name '????????T??????Z' -printf '%f\n' |
    sort -r |
    head -n 1
)"
[[ -n "${backup_id}" && "${backup_id}" != "${before_backup}" ]] ||
  vps_fail "Nepodařilo se jednoznačně vytvořit novou bezpečnostní zálohu."
backup_directory="${PROJECT_ROOT}/backups/${backup_id}"
(
  cd "${backup_directory}"
  sha256sum --check --strict SHA256SUMS >/dev/null
) || vps_fail "Kontrolní součty nové zálohy nesouhlasí."
vps_compose exec -T db pg_restore --list \
  <"${backup_directory}/database.dump" >/dev/null

deployment_compose up -d volumes-init db
for _ in {1..60}; do
  database_id="$(deployment_compose ps -q db)"
  database_status="$(
    docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
      "${database_id}" 2>/dev/null || true
  )"
  [[ "${database_status}" == "healthy" ]] && break
  [[ "${database_status}" != "unhealthy" ]] ||
    vps_fail "Nová databáze je unhealthy."
  sleep 2
done
[[ "${database_status:-}" == "healthy" ]] ||
  vps_fail "Nová databáze nebyla včas připravená."

deployment_compose exec -T db \
  sh -ec '
    export PGPASSWORD="$(cat /run/secrets/postgres_password)"
    exec pg_restore \
      --username "$POSTGRES_USER" \
      --dbname "$POSTGRES_DB" \
      --clean \
      --if-exists \
      --no-owner \
      --no-privileges \
      --exit-on-error
  ' <"${backup_directory}/database.dump"

docker run --rm \
  --volume "${UPLOADS_VOLUME_NAME}:/target" \
  --volume "${backup_directory}:/backup:ro" \
  alpine:3.22.2 \
  sh -ec '
    mkdir -p /restore
    tar -xzf /backup/uploads.tar.gz -C /restore
    test -d /restore/uploads
    cp -a /restore/uploads/. /target/
  '
deployment_compose up volumes-init

upload_manifest() {
  docker run --rm \
    --volume "$1:/data:ro" \
    alpine:3.22.2 \
    sh -ec '
      cd /data
      find . -type f -print | LC_ALL=C sort |
        while IFS= read -r file; do sha256sum "$file"; done
    '
}
source_manifest="$(upload_manifest "${PROJECT_ROOT}/uploads")"
target_manifest="$(upload_manifest "${UPLOADS_VOLUME_NAME}")"
[[ "$(printf '%s' "${source_manifest}" | sha256sum)" == \
  "$(printf '%s' "${target_manifest}" | sha256sum)" ]] ||
  vps_fail "SHA-256 manifest obnovených uploads se liší od zdroje."
source_count="$(printf '%s\n' "${source_manifest}" | sed '/^$/d' | wc -l)"
target_count="$(printf '%s\n' "${target_manifest}" | sed '/^$/d' | wc -l)"
[[ "${source_count}" == "${target_count}" ]] ||
  vps_fail "Počet obnovených upload souborů nesouhlasí."

deployment_compose run --rm migrate

cutover_started=false
cutover_complete=false
recover_legacy() {
  local exit_code=$?
  if "${cutover_started}" && ! "${cutover_complete}"; then
    deployment_compose stop gateway api >/dev/null 2>&1 || true
    vps_compose start db api gateway >/dev/null 2>&1 || true
    printf 'Nový stack selhal; původní stack byl znovu spuštěn.\n' >&2
  fi
  exit "${exit_code}"
}
trap recover_legacy EXIT

cutover_started=true
vps_compose stop gateway api db
deployment_compose up -d

for service in db api gateway; do
  for _ in {1..60}; do
    service_id="$(deployment_compose ps -q "${service}")"
    status="$(
      docker inspect --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' \
        "${service_id}" 2>/dev/null || true
    )"
    [[ "${status}" == "healthy" || "${status}" == "running" ]] && break
    [[ "${status}" != "unhealthy" && "${status}" != "exited" ]] ||
      vps_fail "Nová služba ${service} skončila ve stavu ${status}."
    sleep 2
  done
  [[ "${status:-}" == "healthy" || "${status:-}" == "running" ]] ||
    vps_fail "Nová služba ${service} nebyla včas připravená."
done

cutover_complete=true
deployment_compose ps
printf 'Migrace do named volumes byla dokončena. Původní bind mounty nebyly smazány.\n'
