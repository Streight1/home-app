#!/bin/sh

set -eu

fail() {
  printf 'Gateway runtime configuration is invalid: %s\n' "$1" >&2
  exit 1
}

has_control_character() {
  printf '%s' "$1" | LC_ALL=C grep -q '[[:cntrl:]]'
}

json_escape() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g'
}

api_url="${API_URL:-}"
google_client_id="${GOOGLE_CLIENT_ID:-}"
app_env_label="${APP_ENV_LABEL:-}"
max_upload_bytes="${MAX_UPLOAD_BYTES:-}"
finance_import_max_file_bytes="${FINANCE_IMPORT_MAX_FILE_BYTES:-}"
csrf_cookie_name="${CSRF_COOKIE_NAME:-}"

case "${api_url}" in
  /*) ;;
  *) fail 'API_URL must be a same-origin path.' ;;
esac
case "${api_url}" in
  //*|*'?'*|*'#'*) fail 'API_URL contains an unsupported component.' ;;
esac
printf '%s' "${google_client_id}" |
  grep -Eq '^[A-Za-z0-9._-]+\.apps\.googleusercontent\.com$' ||
  fail 'GOOGLE_CLIENT_ID has an unexpected format.'
printf '%s' "${csrf_cookie_name}" | grep -Eq '^[A-Za-z0-9_-]+$' ||
  fail 'CSRF_COOKIE_NAME has an unexpected format.'
printf '%s' "${max_upload_bytes}" | grep -Eq '^[1-9][0-9]*$' ||
  fail 'MAX_UPLOAD_BYTES must be a positive integer.'
printf '%s' "${finance_import_max_file_bytes}" |
  grep -Eq '^[1-9][0-9]*$' ||
  fail 'FINANCE_IMPORT_MAX_FILE_BYTES must be a positive integer.'
[ "${#app_env_label}" -le 32 ] ||
  fail 'APP_ENV_LABEL is longer than 32 characters.'
for public_value in \
  "${api_url}" \
  "${google_client_id}" \
  "${app_env_label}" \
  "${csrf_cookie_name}"; do
  if has_control_character "${public_value}"; then
    fail 'a public value contains a control character.'
  fi
done

runtime_directory=/run/homeapp
install -d -m 0755 "${runtime_directory}"
runtime_file="${runtime_directory}/runtime-config.js"
temporary_file="${runtime_file}.tmp"

cat >"${temporary_file}" <<EOF
window.__HOMEAPP_CONFIG__ = Object.freeze({
  API_URL: "$(json_escape "${api_url}")",
  GOOGLE_CLIENT_ID: "$(json_escape "${google_client_id}")",
  APP_ENV_LABEL: "$(json_escape "${app_env_label}")",
  MAX_UPLOAD_BYTES: ${max_upload_bytes},
  FINANCE_IMPORT_MAX_FILE_BYTES: ${finance_import_max_file_bytes},
  CSRF_COOKIE_NAME: "$(json_escape "${csrf_cookie_name}")"
});
EOF
chmod 0444 "${temporary_file}"
mv "${temporary_file}" "${runtime_file}"

exec caddy run --config /etc/caddy/Caddyfile --adapter caddyfile
