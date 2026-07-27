#!/usr/bin/env bash

set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "${root}"

artifact_dir="${root}/artifacts/containers"
mkdir -p "${artifact_dir}"

run_token="${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-1}-${RANDOM}"
safe_token="$(printf '%s' "${run_token}" | tr '[:upper:]_' '[:lower:]-' | tr -cd 'a-z0-9-')"
project="homeapp-ci-${safe_token}"
failure_project="${project}-migration-failure"
volume_prefix="${project}-"
gateway_port="${CI_GATEWAY_PORT:-$((18080 + RANDOM % 1000))}"
temporary_root="$(mktemp -d "${TMPDIR:-/tmp}/homeapp-container-ci.XXXXXX")"
secret_dir="${temporary_root}/secrets"
env_file="${temporary_root}/compose.env"
mkdir -p "${secret_dir}"

postgres_password="ci-postgres-${safe_token}-7Jp9mQ2x"
health_token="ci-health-${safe_token}-d3f6e9a2c5b8f1d4"
mapy_key="ci-disabled-${safe_token}"

printf '%s\n' "${postgres_password}" >"${secret_dir}/postgres_password"
printf '%s\n' "${health_token}" >"${secret_dir}/internal_health_token"
printf '%s\n' "${mapy_key}" >"${secret_dir}/mapy_api_key"
chmod 0600 "${secret_dir}"/*

cat >"${env_file}" <<EOF
APP_IMAGE_TAG=ci
APP_PULL_POLICY=never
APP_DOMAIN=:80
WEB_ORIGIN=https://127.0.0.1:${gateway_port}
ACME_EMAIL=ci@example.invalid
APP_ENV_LABEL=CI
GATEWAY_MAX_REQUEST_BODY=30MB
APP_RUNTIME_UID=10001
APP_RUNTIME_GID=10001
POSTGRES_DB=homeapp_ci
POSTGRES_USER=homeapp_ci
GOOGLE_CLIENT_ID=000000000000-ci.apps.googleusercontent.com
GOOGLE_ALLOWED_EMAILS=ci-owner@example.invalid
SINGLE_HOUSEHOLD_MODE=true
SINGLE_HOUSEHOLD_OWNER_EMAIL=ci-owner@example.invalid
SINGLE_HOUSEHOLD_NAME=CI household
SESSION_COOKIE_NAME=homeapp_ci_session
CSRF_COOKIE_NAME=homeapp_ci_csrf
SESSION_TTL_DAYS=1
MAX_UPLOAD_BYTES=26214400
FINANCE_IMPORT_MAX_FILE_BYTES=20971520
FINANCE_IMPORT_MAX_ROWS=1000
FINANCE_IMPORT_SESSION_TTL_HOURS=1
MAPY_API_ENABLED=false
MAPY_API_TIMEOUT_MS=1000
MAPY_SUGGEST_MIN_QUERY_LENGTH=3
MAPY_SUGGEST_MAX_RESULTS=4
MAPY_DEFAULT_LANGUAGE=cs
HOMEAPP_SECRETS_DIR=${secret_dir}
CI_GATEWAY_PORT=${gateway_port}
POSTGRES_VOLUME_NAME=${volume_prefix}postgres
UPLOADS_VOLUME_NAME=${volume_prefix}uploads
CADDY_DATA_VOLUME_NAME=${volume_prefix}caddy-data
CADDY_CONFIG_VOLUME_NAME=${volume_prefix}caddy-config
BACKUPS_VOLUME_NAME=${volume_prefix}backups
RUNTIME_SECRETS_VOLUME_NAME=${volume_prefix}runtime-secrets
EOF
chmod 0600 "${env_file}"

failure_volume_prefix="${failure_project}-"
failure_env="${temporary_root}/failure.env"
sed "s/${volume_prefix}/${failure_volume_prefix}/g" "${env_file}" >"${failure_env}"

compose_files=(
  --env-file "${env_file}"
  -f deployment/compose.yaml
  -f deployment/compose.ci.yaml
)
compose=(docker compose "${compose_files[@]}" --project-name "${project}")
failure_compose=(
  docker compose
  --env-file "${failure_env}"
  -f deployment/compose.yaml
  -f deployment/compose.ci.yaml
  -f deployment/compose.ci.migration-failure.yaml
  --project-name "${failure_project}"
)

sanitize() {
  sed \
    -e "s/${postgres_password}/[REDACTED_POSTGRES_PASSWORD]/g" \
    -e "s/${health_token}/[REDACTED_HEALTH_TOKEN]/g" \
    -e "s/${mapy_key}/[REDACTED_PROVIDER_KEY]/g" \
    -e "s#${secret_dir}#[REDACTED_SECRET_DIRECTORY]#g"
}

capture_diagnostics() {
  local label="$1"
  local -n command_ref="$2"
  set +e
  "${command_ref[@]}" ps --all >"${artifact_dir}/${label}-ps.txt" 2>&1
  "${command_ref[@]}" logs --no-color --timestamps 2>&1 |
    sanitize >"${artifact_dir}/${label}-logs.txt"
  set -e
}

cleanup() {
  local status=$?
  trap - EXIT
  capture_diagnostics "stack" compose
  capture_diagnostics "migration-failure" failure_compose
  set +e
  "${compose[@]}" down --volumes --remove-orphans --timeout 10
  "${failure_compose[@]}" down --volumes --remove-orphans --timeout 10
  rm -rf "${temporary_root}"
  set -e
  exit "${status}"
}
trap cleanup EXIT

assert_http_status() {
  local expected="$1"
  local path="$2"
  local actual
  actual="$(curl --silent --output /dev/null --write-out '%{http_code}' \
    --max-time 10 "http://127.0.0.1:${gateway_port}${path}")"
  if [[ "${actual}" != "${expected}" ]]; then
    printf 'Expected HTTP %s for %s, received %s.\n' \
      "${expected}" "${path}" "${actual}" >&2
    return 1
  fi
}

wait_for_gateway() {
  local attempt
  for attempt in $(seq 1 60); do
    if curl --fail --silent --show-error --max-time 3 \
      "http://127.0.0.1:${gateway_port}/runtime-config.js" >/dev/null; then
      return 0
    fi
    sleep 2
  done
  printf 'Gateway did not become ready in time.\n' >&2
  return 1
}

printf 'Building production images for linux/amd64...\n'
docker build --platform linux/amd64 --target api \
  --tag homeapp-api:ci --file apps/api/Dockerfile .
docker build --platform linux/amd64 --target gateway \
  --tag homeapp-web:ci --file apps/web/Dockerfile .

api_user="$(docker image inspect homeapp-api:ci --format '{{.Config.User}}')"
if [[ -z "${api_user}" || "${api_user}" == "0" || "${api_user}" == "root" ]]; then
  printf 'API image must declare a non-root user.\n' >&2
  exit 1
fi

for image in homeapp-api:ci homeapp-web:ci; do
  docker run --rm --entrypoint /bin/sh "${image}" -ec \
    'test -z "$(find / -xdev \( -name .env -o -name .git -o -path "*/uploads/*" \) -print 2>/dev/null | head -n 1)"'
done
docker run --rm --entrypoint /bin/sh homeapp-api:ci -ec \
  'test ! -e /app/node_modules/@playwright && test ! -e /app/apps/api/test'
docker run --rm --entrypoint /bin/sh homeapp-web:ci -ec \
  '! grep -R -E "DATABASE_URL|POSTGRES_PASSWORD|MAPY_API_KEY|INTERNAL_HEALTH_TOKEN" /srv /etc/caddy 2>/dev/null'

config_json="${temporary_root}/compose-config.json"
"${compose[@]}" config --format json >"${config_json}"
node scripts/ci/check-compose-model.mjs "${config_json}" "${volume_prefix}"

printf 'Starting isolated stack from empty named volumes...\n'
"${compose[@]}" up --detach --wait --wait-timeout 300
wait_for_gateway

for service in volumes-init migrate; do
  container_id="$("${compose[@]}" ps --all --quiet "${service}")"
  exit_code="$(docker inspect "${container_id}" --format '{{.State.ExitCode}}')"
  if [[ "${exit_code}" != "0" ]]; then
    printf '%s did not finish successfully.\n' "${service}" >&2
    exit 1
  fi
done

assert_http_status 200 /
assert_http_status 200 /login
assert_http_status 200 /app
assert_http_status 401 /api/v1/auth/me
assert_http_status 404 /uploads/not-public.txt
assert_http_status 404 /internal/health/ready

runtime_config="${temporary_root}/runtime-config.js"
curl --fail --silent --show-error --max-time 10 \
  "http://127.0.0.1:${gateway_port}/runtime-config.js" >"${runtime_config}"
grep -F 'API_URL: "/api/v1"' "${runtime_config}" >/dev/null
grep -F 'GOOGLE_CLIENT_ID: "000000000000-ci.apps.googleusercontent.com"' \
  "${runtime_config}" >/dev/null
if grep -E 'DATABASE_URL|POSTGRES_PASSWORD|MAPY_API_KEY|INTERNAL_HEALTH_TOKEN' \
  "${runtime_config}" >/dev/null; then
  printf 'Public runtime config contains a forbidden secret field.\n' >&2
  exit 1
fi

"${compose[@]}" exec -T db /bin/sh -ec \
  'export PGPASSWORD="$(cat /run/secrets/postgres_password)"; exec psql -v ON_ERROR_STOP=1 --username homeapp_ci --dbname homeapp_ci --command "$1"' \
  -- \
  'CREATE TABLE IF NOT EXISTS ci_persistence_marker (id integer PRIMARY KEY); INSERT INTO ci_persistence_marker (id) VALUES (1) ON CONFLICT DO NOTHING;' \
  >/dev/null
"${compose[@]}" exec -T api /bin/sh -ec \
  'printf "container-ci\n" > /app/uploads/ci-persistence-marker.txt'

printf 'Repeating compose up and verifying migrations and persistence...\n'
"${compose[@]}" down --timeout 20
"${compose[@]}" up --detach --wait --wait-timeout 300
wait_for_gateway
marker_count="$("${compose[@]}" exec -T db /bin/sh -ec \
  'export PGPASSWORD="$(cat /run/secrets/postgres_password)"; exec psql --tuples-only --no-align --username homeapp_ci --dbname homeapp_ci --command "$1"' \
  -- 'SELECT count(*) FROM ci_persistence_marker WHERE id = 1;')"
if [[ "${marker_count}" != "1" ]]; then
  printf 'Database marker did not survive a stack restart.\n' >&2
  exit 1
fi
"${compose[@]}" exec -T api test -f /app/uploads/ci-persistence-marker.txt
assert_http_status 200 /app
assert_http_status 404 /uploads/ci-persistence-marker.txt

printf 'Verifying that a failed migration blocks API startup...\n'
set +e
failure_command_raw="${temporary_root}/migration-failure-command.txt"
"${failure_compose[@]}" up --detach --wait --wait-timeout 180 api \
  >"${failure_command_raw}" 2>&1
failure_status=$?
set -e
sanitize <"${failure_command_raw}" \
  >"${artifact_dir}/migration-failure-command.txt"
if [[ "${failure_status}" -eq 0 ]]; then
  printf 'Migration failure simulation unexpectedly succeeded.\n' >&2
  exit 1
fi
failure_migrate_id="$("${failure_compose[@]}" ps --all --quiet migrate)"
failure_exit_code="$(docker inspect "${failure_migrate_id}" --format '{{.State.ExitCode}}')"
if [[ "${failure_exit_code}" -eq 0 ]]; then
  printf 'Migration failure container unexpectedly exited with code 0.\n' >&2
  exit 1
fi
if "${failure_compose[@]}" ps --status running --services | grep -Eq '^api$'; then
  printf 'API started even though migration failed.\n' >&2
  exit 1
fi

cat >"${artifact_dir}/validation-summary.txt" <<EOF
Container validation passed.
- production API and gateway images built for linux/amd64
- isolated Compose model verified
- empty-volume migration and application startup passed
- SPA, runtime config, authentication boundary and private paths passed
- repeated startup preserved database and private uploads markers
- simulated migration failure blocked API startup
- production volumes and secrets were not used
EOF

printf 'Container validation passed.\n'
