# syntax=docker/dockerfile:1.7
#
# Two-stage Docker build for @portfolio/rag-server.
#
# The build context is the monorepo ROOT (not apps/rag-server/) because
# pnpm needs access to pnpm-lock.yaml + pnpm-workspace.yaml. fly.toml sets
# `dockerfile = "apps/rag-server/Dockerfile"`, so running `fly deploy -c
# apps/rag-server/fly.toml` from the repo root wires this up correctly.

# ── deps ─────────────────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app

# Activate pnpm (version pinned via root package.json `packageManager` field).
RUN corepack enable

# Copy only what `pnpm install` needs — changing source code should not bust
# this layer.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/rag-server/package.json ./apps/rag-server/

# Install rag-server deps only. devDeps are kept because the runtime executes
# TypeScript directly via `tsx` (no compile step) — keeping the image simple.
RUN pnpm install --filter @portfolio/rag-server --frozen-lockfile

# ── runner ───────────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app
RUN corepack enable

# Bring over the fully-populated workspace from `deps` (node_modules +
# manifests). Source is copied last so code-only changes re-use the deps
# layer.
COPY --from=deps /app ./
COPY apps/rag-server ./apps/rag-server

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

WORKDIR /app/apps/rag-server
USER node

# Run the server without --env-file: fly.io injects secrets as real env vars.
CMD ["pnpm", "exec", "tsx", "src/server.ts"]
