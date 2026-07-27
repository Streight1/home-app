# syntax=docker/dockerfile:1.7

ARG NODE_VERSION=24.18.0
ARG PNPM_VERSION=11.12.0

FROM node:${NODE_VERSION}-bookworm-slim AS pnpm-base
ARG PNPM_VERSION
ENV PNPM_HOME=/pnpm
ENV PATH=${PNPM_HOME}:${PATH}
RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/*
WORKDIR /workspace

FROM pnpm-base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM dependencies AS build
COPY tsconfig.base.json ./
COPY apps/api apps/api
RUN DATABASE_URL=postgresql://prisma-build:prisma-build@127.0.0.1:5432/prisma-build \
  pnpm --filter @life-admin/api db:generate \
  && pnpm --filter @life-admin/api build

FROM pnpm-base AS production-dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile --prod --filter @life-admin/api...

FROM node:${NODE_VERSION}-bookworm-slim AS api
ENV NODE_ENV=production
ENV HOME=/tmp
WORKDIR /app
RUN apt-get update \
  && apt-get install --yes --no-install-recommends ca-certificates openssl \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --gid 10001 homeapp \
  && useradd --uid 10001 --gid homeapp --no-create-home --shell /usr/sbin/nologin homeapp
COPY --from=production-dependencies /workspace/node_modules ./node_modules
COPY --from=production-dependencies /workspace/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /workspace/apps/api/dist ./apps/api/dist
COPY --from=build /workspace/apps/api/package.json ./apps/api/package.json
COPY --from=build /workspace/apps/api/prisma ./apps/api/prisma
COPY --from=build /workspace/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY deployment/api ./bin
USER homeapp
CMD ["node", "apps/api/dist/main.js"]

FROM dependencies AS migrate
ENV NODE_ENV=production
ENV HOME=/tmp
WORKDIR /workspace/apps/api
COPY apps/api/prisma ./prisma
COPY apps/api/prisma.config.ts ./
COPY apps/api/package.json ./
USER node
CMD ["./node_modules/.bin/prisma", "migrate", "deploy"]
