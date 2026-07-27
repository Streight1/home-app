#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

fail() {
  printf 'Backup failed: %s\n' "$1" >&2
  exit 1
}

password_file="${POSTGRES_PASSWORD_FILE:-}"
[[ -n "${password_file}" && -r "${password_file}" ]] ||
  fail "PostgreSQL secret file is not readable."
export PGPASSWORD
PGPASSWORD="$(<"${password_file}")"
[[ -n "${PGPASSWORD}" ]] || fail "PostgreSQL secret is empty."

timestamp="$(date -u +'%Y%m%dT%H%M%SZ')"
backup_directory="/backups/${timestamp}"
temporary_directory="${backup_directory}.partial"
retention="${BACKUP_RETENTION_COUNT:-7}"
[[ "${retention}" =~ ^[1-9][0-9]*$ ]] ||
  fail "BACKUP_RETENTION_COUNT must be a positive integer."

cleanup() {
  rm -rf -- "${temporary_directory}"
  unset PGPASSWORD
}
trap cleanup EXIT

install -d -m 0700 "${temporary_directory}"
pg_dump \
  --host "${POSTGRES_HOST:-db}" \
  --port "${POSTGRES_PORT:-5432}" \
  --username "${POSTGRES_USER:?POSTGRES_USER is required}" \
  --dbname "${POSTGRES_DB:?POSTGRES_DB is required}" \
  --format custom \
  --no-owner \
  --no-privileges \
  --file "${temporary_directory}/database.dump"
[[ -s "${temporary_directory}/database.dump" ]] ||
  fail "pg_dump did not create a usable dump."
pg_restore --list "${temporary_directory}/database.dump" >/dev/null

tar --create --gzip --file "${temporary_directory}/uploads.tar.gz" \
  --directory /uploads .
[[ -s "${temporary_directory}/uploads.tar.gz" ]] ||
  fail "uploads archive was not created."

upload_file_count="$(find /uploads -type f | wc -l | tr -d ' ')"
{
  printf 'createdAt=%s\n' "${timestamp}"
  printf 'appImageTag=%s\n' "${APP_IMAGE_TAG:-unknown}"
  printf 'databaseFormat=postgresql-custom\n'
  printf 'uploadsFormat=tar-gzip\n'
  printf 'uploadFileCount=%s\n' "${upload_file_count}"
} >"${temporary_directory}/manifest.txt"

(
  cd "${temporary_directory}"
  sha256sum database.dump uploads.tar.gz manifest.txt >SHA256SUMS
  sha256sum --check --strict SHA256SUMS >/dev/null
)
mv "${temporary_directory}" "${backup_directory}"

mapfile -t expired_backups < <(
  find /backups -mindepth 1 -maxdepth 1 -type d \
    -name '????????T??????Z' -printf '%f\n' |
    sort -r |
    tail -n "+$((retention + 1))"
)
for expired in "${expired_backups[@]}"; do
  [[ "${expired}" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] || continue
  rm -rf -- "/backups/${expired}"
done

printf 'Backup %s completed.\n' "${timestamp}"
