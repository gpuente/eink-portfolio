# CLAUDE.md — Portfolio monorepo

This is a **pnpm + Turborepo** monorepo for Guillermo Puente's portfolio.

## Structure

```
.
├── apps/
│   └── web/                 # Astro 6 + React 19 e-ink portfolio (the public site)
├── packages/                # (empty for now — shared libraries land here later)
├── data/                    # raw portfolio source data (résumé JSON, original assets)
├── docs/
│   └── rag-server.md        # plan for the future RAG server app (apps/rag-server)
├── pnpm-workspace.yaml
├── turbo.json
├── package.json             # root: minimal, just turbo + script forwarders
└── ...
```

**Per-app docs live alongside their code.** Read those *first* when working inside an app:

- [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md) — the e-ink Astro site (current production work)

## Apps

| Path | Name | Status | Purpose |
|---|---|---|---|
| `apps/web` | `@portfolio/web` | shipped | Astro static site with the e-ink portfolio + `/gallery` page |
| `apps/rag-server` | `@portfolio/rag-server` | scaffolded (chat UI in web pending) | Hono service with `/chat` (OpenAI gpt-4o-mini + tool calling) backed by Astra DB vector search. Ingestion script reads `apps/rag-server/sources/`. See [`docs/rag-server.md`](docs/rag-server.md) and [`apps/rag-server/CLAUDE.md`](apps/rag-server/CLAUDE.md) |

## Workspace + scripts

Package manager: **pnpm** (with workspaces). Build orchestrator: **Turborepo**.

```
pnpm install                           # install everything across workspaces
pnpm dev                               # turbo: run dev in every app
pnpm build                             # turbo: build every app (caches outputs)
pnpm preview                           # turbo: build then preview
pnpm check                             # turbo: typecheck every app
pnpm ingest                            # turbo: run ingest in every app that has it (rag-server only for now)

pnpm web <command>                     # forward to apps/web   (e.g. `pnpm web add zod`)
pnpm rag <command>                     # forward to apps/rag-server (e.g. `pnpm rag dev`, `pnpm rag ingest`)

pnpm --filter @portfolio/web dev       # explicit single-app form
pnpm --filter @portfolio/rag-server dev
```

Turbo's task graph is in `turbo.json`. `build` depends on upstream `^build` (so future shared packages get built before the apps that consume them). `dev` and `preview` are `persistent` (turbo keeps them running) and uncached.

## Adding a new app

1. Create `apps/<name>/package.json` with `"name": "@portfolio/<name>"` and `private: true`.
2. Make sure its scripts match the turbo task names in `turbo.json` (`build`, `dev`, `check`, etc.) — turbo will pick them up automatically because of the `apps/*` glob in `pnpm-workspace.yaml`.
3. Run `pnpm install` from the root once.
4. Add a `CLAUDE.md` inside the new app for app-specific docs.

## Git conventions

- **Never include a `Co-Authored-By: Claude ...` trailer (or any AI co-author footer) in commit messages.** Plain subject + body only.
