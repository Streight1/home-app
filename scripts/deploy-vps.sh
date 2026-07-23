#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/vps-common.sh
source "${SCRIPT_DIR}/vps-common.sh"

pull_base_images=false
skip_backup=false
dry_run=false

while (($# > 0)); do
  case "$1" in
    --build) pull_base_images=true ;;
    --no-backup) skip_backup=true ;;
    --dry-run) dry_run=true ;;
    *) vps_fail "Neznámý argument $1. Použijte --build, --no-backup nebo --dry-run." ;;
  esac
  shift
done

vps_load_environment

if "${dry_run}"; then
  "${SCRIPT_DIR}/vps-preflight.sh" --dry-run
  if "${skip_backup}"; then
    printf 'DRY-RUN: záloha byla explicitně přeskočena pomocí --no-backup.\n'
  else
    "${SCRIPT_DIR}/backup-vps.sh" --dry-run
  fi
  if "${pull_base_images}"; then
    vps_print_command docker compose -f compose.prod.yaml build --pull
  else
    vps_print_command docker compose -f compose.prod.yaml build
  fi
  vps_print_command docker compose -f compose.prod.yaml up -d db
  vps_print_command docker compose -f compose.prod.yaml run --rm migrate
  vps_print_command docker compose -f compose.prod.yaml up -d api gateway
  exit 0
fi

"${SCRIPT_DIR}/vps-preflight.sh"

if "${skip_backup}"; then
  printf 'Upozornění: záloha byla explicitně přeskočena pomocí --no-backup.\n'
else
  "${SCRIPT_DIR}/backup-vps.sh"
fi

if "${pull_base_images}"; then
  vps_compose build --pull
else
  vps_compose build
fi

vps_compose up -d db
vps_wait_for_health db 60

if ! vps_compose run --rm migrate; then
  vps_fail "Migrace selhala. Nová API verze nebyla spuštěna."
fi

vps_compose up -d api
vps_wait_for_health api 60
vps_compose up -d gateway

curl \
  --fail \
  --silent \
  --show-error \
  --max-time 30 \
  "${WEB_ORIGIN}/" >/dev/null ||
  vps_fail "Veřejný HTTPS health check gateway selhal."

vps_compose ps
printf 'Deploy verze %s byl dokončen.\n' "${APP_RELEASE}"
