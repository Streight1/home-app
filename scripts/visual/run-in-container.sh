#!/usr/bin/env bash
set -euo pipefail

mode="${1:-check}"
shift || true

case "$mode" in
  check | update) ;;
  *)
    printf 'Použití: %s check|update [--allow-dirty]\n' "$0" >&2
    exit 2
    ;;
esac

allow_dirty=false
for argument in "$@"; do
  case "$argument" in
    --allow-dirty) allow_dirty=true ;;
    *)
      printf 'Neznámý argument: %s\n' "$argument" >&2
      exit 2
      ;;
  esac
done

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
metadata_file="$repo_root/apps/web/e2e/visual-baseline.json"
container_image="$(
  node --input-type=module -e \
    "import metadata from '${metadata_file}' with { type: 'json' }; process.stdout.write(metadata.containerImage)"
)"
pnpm_version="$(
  node --input-type=module -e \
    "import packageJson from '${repo_root}/package.json' with { type: 'json' }; process.stdout.write(packageJson.packageManager.slice('pnpm@'.length))"
)"

if [[ "$mode" == "update" ]]; then
  changes="$(git -C "$repo_root" status --porcelain --untracked-files=all)"
  if [[ -n "$changes" && "$allow_dirty" != true ]]; then
    printf '%s\n' \
      'Aktualizace baseline vyžaduje čistý Git working tree.' \
      'Po vědomé kontrole rozpracovaných změn použijte explicitní --allow-dirty.' >&2
    exit 1
  fi
fi

if [[ "${HOMEAPP_VISUAL_CANONICAL:-false}" == "true" ]]; then
  node scripts/visual/verify-visual-environment.mjs --runtime
  if [[ "$mode" == "update" ]]; then
    corepack pnpm@"$pnpm_version" --filter @life-admin/web exec playwright test \
      e2e/visual.spec.ts --update-snapshots
  else
    corepack pnpm@"$pnpm_version" --filter @life-admin/web test:visual:canonical
  fi
  exit 0
fi

printf 'Visual %s: %s\n' "$mode" "$container_image"

docker run --rm --init --ipc=host \
  --workdir /workspace \
  --env CI=true \
  --env HOMEAPP_HOST_UID="$(id -u)" \
  --env HOMEAPP_HOST_GID="$(id -g)" \
  --env HOME=/tmp/homeapp-visual \
  --env COREPACK_HOME=/tmp/homeapp-corepack \
  --env LANG=C.UTF-8 \
  --env LC_ALL=C.UTF-8 \
  --env TZ=Europe/Prague \
  --env HOMEAPP_VISUAL_CANONICAL=true \
  --env HOMEAPP_VISUAL_CONTAINER_IMAGE="$container_image" \
  --env HOMEAPP_PLAYWRIGHT_SUITE=visual \
  --volume "$repo_root:/workspace" \
  --volume /dev/null:/workspace/.env:ro \
  --mount type=volume,source=homeapp_visual_root_modules_v1_61_1,destination=/workspace/node_modules \
  --mount type=volume,source=homeapp_visual_api_modules_v1_61_1,destination=/workspace/apps/api/node_modules \
  --mount type=volume,source=homeapp_visual_web_modules_v1_61_1,destination=/workspace/apps/web/node_modules \
  --mount type=volume,source=homeapp_visual_pnpm_store_v11,destination=/tmp/homeapp-pnpm-store \
  --mount type=volume,source=homeapp_visual_corepack_v11,destination=/tmp/homeapp-corepack \
  "$container_image" \
  bash -lc "
    set -euo pipefail
    restore_ownership() {
      for path in \
        apps/web/e2e/visual.spec.ts-snapshots \
        apps/web/playwright-report \
        apps/web/test-results
      do
        if [[ -e \"\$path\" ]]; then
          chown -R \"\$HOMEAPP_HOST_UID:\$HOMEAPP_HOST_GID\" \"\$path\"
        fi
      done
    }
    trap restore_ownership EXIT
    mkdir -p \"\$HOME\" \"\$COREPACK_HOME\" /tmp/homeapp-pnpm-store
    corepack enable
    git config --global --add safe.directory /workspace
    corepack pnpm@${pnpm_version} install --frozen-lockfile \
      --store-dir /tmp/homeapp-pnpm-store
    corepack pnpm@${pnpm_version} visual:container:${mode}
  "

if [[ "$mode" == "update" ]]; then
  git -C "$repo_root" status --short \
    -- apps/web/e2e/visual.spec.ts-snapshots apps/web/e2e/visual-baseline.json
fi
