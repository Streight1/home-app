# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.18.0
ARG PNPM_VERSION=11.12.0

FROM node:${NODE_VERSION}-bookworm-slim AS build
ARG PNPM_VERSION
ARG WEB_PORT=5173
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_MAX_UPLOAD_BYTES=26214400
ARG VITE_FINANCE_IMPORT_MAX_FILE_BYTES=20971520
ARG VITE_APP_ENV_LABEL
ARG CSRF_COOKIE_NAME=homeapp_csrf
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
ENV WEB_PORT=${WEB_PORT}
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}
ENV VITE_MAX_UPLOAD_BYTES=${VITE_MAX_UPLOAD_BYTES}
ENV VITE_FINANCE_IMPORT_MAX_FILE_BYTES=${VITE_FINANCE_IMPORT_MAX_FILE_BYTES}
ENV VITE_APP_ENV_LABEL=${VITE_APP_ENV_LABEL}
ENV CSRF_COOKIE_NAME=${CSRF_COOKIE_NAME}
WORKDIR /workspace
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
RUN pnpm --filter @life-admin/web build

FROM caddy:2.11.4-alpine AS gateway
COPY deployment/Caddyfile /etc/caddy/Caddyfile
COPY --from=build /workspace/apps/web/dist /srv
