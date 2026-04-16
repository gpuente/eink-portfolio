# RAG server — future app at `apps/rag-server`

Status: **planned, not yet scaffolded.** This file captures intent, planned architecture, and open questions so the next iteration starts with shared context.

## Goal

Build a Node.js service that powers an in-page **chat agent** embedded in the portfolio (`apps/web`). The agent answers questions about Guillermo Puente — work history, projects, skills, talks, CV — using RAG (retrieval-augmented generation) over a vector database.

Use case: a recruiter, collaborator, or curious visitor lands on the portfolio, opens the chat, and asks something like "What kind of AI work has Guillermo done?" or "Has he worked with Go in production?". The agent answers from grounded context (no hallucinated companies / titles), in a few seconds, in English or Spanish.

## High-level architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  apps/web               │        │  apps/rag-server         │
│  (Astro + React island) │ HTTP / │  (Node service)          │
│                         │  SSE   │                          │
│   <Chat />  ──────────────────►  POST /chat                 │
│                         │        │   ├─ retrieve top-K      │
│                         │        │   ├─ build prompt        │
│                         │        │   └─ stream LLM tokens   │
└─────────────────────────┘        └─────┬──────────────────┬─┘
                                         │                  │
                                         ▼                  ▼
                                 ┌──────────────┐    ┌─────────────────┐
                                 │  Vector DB   │    │  LLM provider   │
                                 │  Astra DB    │    │  Anthropic /    │
                                 │  (DataStax)  │    │  OpenAI         │
                                 └──────────────┘    └─────────────────┘
```

## Tech direction (TBD — pin later)

- **Runtime:** Node 22+ (matches monorepo `engines.node`)
- **Server framework:** Hono (small, first-class SSE, TS-native) — alternative: Fastify
- **LLM SDK:** Anthropic SDK (Claude). Use **prompt caching** for the system prompt + retrieved context to keep latency and cost down across follow-up turns
- **Vector DB:** **Astra DB (DataStax)** — managed, serverless, includes a built-in embedding model so we don't have to host an embedder
- **Schema:** one collection per content type (profile chunks, project chunks, work chunks, talk chunks) with metadata (`source`, `lang`, `last_updated`) for filtered retrieval
- **Streaming:** SSE from server → web

## Embedding sources

The server will ingest these from the monorepo root:

- `data/portfolio.json` — résumé / projects / experience / certifications (already curated, machine-readable)
- `apps/web/src/components/eink/data/*` — bilingual rewritten content (the source of what the public site shows)
- A new `docs/cv-en.md` and `docs/cv-es.md` (TBD) — long-form CV in both languages, written specifically for the agent's grounding (with anecdotes, metrics, and context that doesn't fit on the visual portfolio)
- LinkedIn export, when available, into `docs/`

Ingestion is a one-shot script: `pnpm --filter @portfolio/rag-server ingest`. Re-runnable, idempotent, prints diff (chunks added / updated / removed).

## Web integration

- New chat UI in `apps/web` — likely a slide-up drawer (e-ink-friendly, doesn't disturb the calm scroll), or a dedicated `/chat` page
- The web app reads the server URL from `PUBLIC_RAG_SERVER_URL` (Astro env)
- Bilingual: respects the existing `lang` toggle (the agent answers in EN or ES according to the same state)
- No auth: a stateless conversation (or session id stored in `sessionStorage`) is enough for a public Q&A
- Loading state: an e-ink-styled "thinking" indicator (no spinning circles — maybe a slowly-fading cursor block)

## Open questions

- **Hosting:** Fly.io (Docker, easy SSE) vs Railway (similar) vs a Cloudflare Worker (cold-start fast but Anthropic SDK + Astra SDK compatibility TBC)
- **Conversation history:** keep last N turns in memory only (per session id), no persistence
- **Rate limiting:** IP-based + a hard daily token budget to bound LLM cost. Consider Cloudflare Turnstile in front of the chat
- **Spanish language:** does the embedding model handle ES well, or do we need separate ES chunks vs translating queries to EN before retrieval?
- **Source citations:** the agent should cite where it learned each fact ("From his Evernote work…"). UI: small footnote-style references below each answer

## Out of scope (for v1)

- User accounts / auth
- Voice / audio
- Multi-modal (image upload, etc.)
- Long-term memory across sessions
- A dashboard for the user to inspect / curate retrievals
