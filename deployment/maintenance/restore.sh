#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

fail() {
  printf 'Restore failed: %s\n' "$1" >&2
  exit 1
}

[[ "${RESTORE_CONFIRM:-}" == "OBNOVIT" ]] ||
  fail "RESTORE_CONFIRM=OBNOVIT is required."
backup_id="${BACKUP_ID:-}"
[[ "${backup_id}" =~ ^[0-9]{8}T[0-9]{6}Z$ ]] ||
  fail "BACKUP_ID must identify one timestamped backup."
backup_directory="/backups/${backup_id}"

for required_file in database.dump uploads.tar.gz manifest.txt SHA256SUMS; do
  [[ -f "${backup_directory}/${required_file}" ]] ||
    fail "selected backup is incomplete."
done
(
  cd "${backup_directory}"
  sha256sum --check --strict SHA256SUMS >/dev/null
) || fail "backup checksums do not match."

if ! tar -tzf "${backup_directory}/uploads.tar.gz" |
  awk '
    BEGIN { valid = 1 }
    /^\// || /(^|\/)\.\.(\/|$)/ { valid = 0 }
    END { exit valid ? 0 : 1 }
  '; then
  fail "uploads archive contains an unsafe path."
fi

password_file="${POSTGRES_PASSWORD_FILE:-}"
[[ -n "${password_file}" && -r "${password_file}" ]] ||
  fail "PostgreSQL secret file is not readable."
export PGPASSWORD
PGPASSWORD="$(<"${password_file}")"
[[ -n "${PGPASSWORD}" ]] || fail "PostgreSQL secret is empty."

host="${POSTGRES_HOST:-db}"
port="${POSTGRES_PORT:-5432}"
user="${POSTGRES_USER:?POSTGRES_USER is required}"
database="${POSTGRES_DB:?POSTGRES_DB is required}"
active_clients="$(
  psql \
    --host "${host}" \
    --port "${port}" \
    --username "${user}" \
    --dbname "${database}" \
    --tuples-only \
    --no-align \
    --command "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid() AND application_name NOT LIKE 'pg_isready%';"
)"
[[ "${active_clients}" == "0" ]] ||
  fail "database still has active clients; stop gateway and API first."

pre_restore_id="$(date -u +'%Y%m%dT%H%M%SZ')-pre-restore"
pre_restore_directory="/backups/${pre_restore_id}"
install -d -m 0700 "${pre_restore_directory}"
pg_dump \
  --host "${host}" \
  --port "${port}" \
  --username "${user}" \
  --dbname "${database}" \
  --format custom \
  --no-owner \
  --no-privileges \
  --file "${pre_restore_directory}/database.dump"
tar --create --gzip --file "${pre_restore_directory}/uploads.tar.gz" \
  --directory /uploads .

pg_restore \
  --host "${host}" \
  --port "${port}" \
  --username "${user}" \
  --dbname "${database}" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  "${backup_directory}/database.dump"

find /uploads -mindepth 1 -maxdepth 1 -exec rm -rf -- {} +
tar \
  --extract \
  --gzip \
  --file "${backup_directory}/uploads.tar.gz" \
  --directory /uploads \
  --no-same-owner \
  --no-same-permissions

expected_count="$(sed -n 's/^uploadFileCount=//p' "${backup_directory}/manifest.txt")"
actual_count="$(find /uploads -type f | wc -l | tr -d ' ')"
[[ -n "${expected_count}" && "${actual_count}" == "${expected_count}" ]] ||
  fail "restored upload count does not match the manifest."

unset PGPASSWORD
printf 'Restore %s completed; a pre-restore safety copy was retained.\n' \
  "${backup_id}"
