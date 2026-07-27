# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.18.0
ARG PNPM_VERSION=11.12.0

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN WEB_PORT=5173 \
  VITE_API_URL=/api/v1 \
  VITE_GOOGLE_CLIENT_ID=runtime-config-required.apps.googleusercontent.com \
  VITE_MAX_UPLOAD_BYTES=26214400 \
  VITE_FINANCE_IMPORT_MAX_FILE_BYTES=20971520 \
  CSRF_COOKIE_NAME=homeapp_csrf \
  pnpm --filter @life-admin/web build

FROM caddy:2.11.4-alpine AS gateway
COPY deployment/Caddyfile /etc/caddy/Caddyfile
COPY --chmod=755 deployment/gateway/entrypoint.sh /usr/local/bin/homeapp-gateway-entrypoint
COPY --from=build /workspace/apps/web/dist /srv
ENTRYPOINT ["/usr/local/bin/homeapp-gateway-entrypoint"]
