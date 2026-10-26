# syntax=docker/dockerfile:1

# Builds the app into a standalone Next.js server for Dokploy. Build from the repo root:
#   docker build -t baprint .

ARG NODE_IMAGE=node:26.12.1-alpine3.24

FROM ${NODE_IMAGE} AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# Node 25+ no longer bundles corepack. It installs the pnpm pinned by "packageManager".
FROM base AS pnpm
ENV COREPACK_ENABLE_DOWNLOAD_PROMPT=0
RUN npm install --global corepack@0.36.0 && corepack enable
COPY package.json ./
RUN corepack install && pnpm --version

# Fetching from the lockfile alone keeps this layer cached until a dependency changes.
FROM pnpm AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
  pnpm fetch --store-dir /pnpm-store

FROM deps AS builder
COPY . .
# No dependency needs a build script.
RUN --mount=type=cache,id=pnpm-store,target=/pnpm-store \
  pnpm install --frozen-lockfile --prefer-offline --ignore-scripts --store-dir /pnpm-store \
  && pnpm build

FROM base AS runner
ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  PORT=3000

# Files stay root-owned and read-only; the server only writes to its .next/cache.
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN mkdir -p .next/cache && chown node:node .next/cache

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --spider http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
