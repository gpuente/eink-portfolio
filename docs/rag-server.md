# RAG server — `apps/rag-server`

Status: **scaffolded.** Server, ingestion script, env contract, and monorepo wiring are in place. The chat UI inside `apps/web` is not yet built — that's the next task once the user fills in Astra + OpenAI creds and ingests sources.

## Goal

A Node.js service that powers an in-page **chat agent** embedded in the portfolio (`apps/web`). The agent answers questions about Guillermo Puente — work history, projects, skills, talks, CV — using RAG (retrieval-augmented generation) over a vector database.

Use case: a recruiter, collaborator, or curious visitor lands on the portfolio, opens the chat, and asks something like "What kind of AI work has Guillermo done?" or "Has he worked with Go in production?". The agent answers from grounded context (no hallucinated companies / titles), in a few seconds, in English or Spanish.

## High-level architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│  apps/web               │        │  apps/rag-server         │
│  (Astro + React island) │ HTTP / │  (Hono on Node 22)       │
│                         │  SSE   │                          │
│   <Chat />  ──────────────────►  POST /chat                 │
│   (TBD: @ai-sdk/react   │        │   ├─ streamText          │
│    useChat hook)        │        │   ├─ tool: searchProfile │
│                         │        │   └─ stream UI messages  │
└─────────────────────────┘        └─────┬──────────────────┬─┘
                                         │                  │
                                         ▼                  ▼
                                 ┌──────────────┐    ┌─────────────────┐
                                 │  Astra DB    │    │  OpenAI         │
                                 │  (collection │    │  gpt-4o-mini    │
                                 │  vector 1536)│    │  + embed-3-small│
                                 └──────────────┘    └─────────────────┘
```

## Stack (committed)

| Concern | Choice |
|---|---|
| Runtime | Node ≥ 22.12 |
| Server | Hono + `@hono/node-server` |
| AI orchestration | `ai` (Vercel AI SDK) + `@ai-sdk/openai` |
| Chat model | `gpt-4o-mini` (tool calling, ~$0.15/$0.60 per 1M tokens) |
| Embedding model | `text-embedding-3-small` (1536 dim, multilingual) |
| Vector DB | Astra DB via `@datastax/astra-db-ts` (Collection mode, BYO vectors) |
| Schema validation | `zod` |
| PDF text | `pdf-parse` |
| Dev runner | `tsx watch --env-file=.env` |

## Embedding sources (current behaviour)

The ingest script reads **only** files under `apps/rag-server/sources/` (recursively). Supported extensions: `.md`, `.markdown`, `.txt`, `.pdf`. The user controls what the agent knows by managing this folder.

The existing `data/portfolio.json` and `apps/web/src/components/eink/data/*` are *not* ingested automatically — they live for the website. If the user wants the agent to know that content, they can `cp` it (or a curated digest of it) into `sources/`.

Long-form CV files written specifically for the agent (`docs/cv-en.md`, `docs/cv-es.md`) and a LinkedIn export are good candidates to drop into `sources/` once available.

## Web integration (planned, not yet built)

- New chat UI in `apps/web` — likely a slide-up drawer (e-ink-friendly, doesn't disturb the calm scroll), or a dedicated `/chat` page
- Use `@ai-sdk/react` `useChat({ api: PUBLIC_RAG_SERVER_URL + '/chat' })`
- Bilingual: respects the existing `lang` toggle (the system prompt already instructs the model to mirror the user's language, so no separate endpoint is needed)
- No auth: stateless (or session id stored in `sessionStorage`)
- Loading state: e-ink-styled "thinking" indicator (no spinning circles — maybe a slowly-fading cursor block)

## Open questions (still TBD)

- **Hosting:** Fly.io (Docker, easy SSE) vs Railway (similar) vs a Cloudflare Worker (Hono runs there but `pdf-parse` is Node-only — would need to move ingestion to a separate process or replace with `unpdf`)
- **Conversation history:** keep last N turns in memory only (per session id), no persistence — the client already manages history via the AI SDK's `UIMessage[]`, so the server stays stateless
- **Rate limiting:** IP-based + a hard daily token budget to bound LLM cost. Consider Cloudflare Turnstile in front of the chat
- **Source citations:** the agent should cite where it learned each fact ("From his Evernote work…"). The system prompt asks for this; the UI will surface it as small footnotes next to each answer

## Out of scope (for v1)

- User accounts / auth
- Voice / audio
- Multi-modal (image upload, etc.)
- Long-term memory across sessions
- A dashboard for the user to inspect / curate retrievals
- Incremental ingest (current script does full re-index — fast enough for the data volume here)
