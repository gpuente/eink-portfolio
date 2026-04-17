# CLAUDE.md — RAG server · `apps/rag-server`

Hono-based Node service that powers the chat agent on the portfolio site. RAG over Astra DB, OpenAI for chat + embeddings, AI SDK for orchestration.

> **Monorepo context:** This app lives at `apps/rag-server` inside a pnpm + Turborepo monorepo. See [`../../CLAUDE.md`](../../CLAUDE.md) for the workspace overview. All paths in *this* file are **relative to `apps/rag-server/`** unless explicitly noted.
>
> Strategic background lives in [`../../docs/rag-server.md`](../../docs/rag-server.md) (open questions, hosting decisions, planned web integration).

---

## Quickstart

1. `cp .env.example .env` and fill in `OPENAI_API_KEY` + the four `ASTRA_DB_*` values.
2. Drop reference files into `sources/` (`.md`, `.txt`, `.pdf`).
3. `pnpm rag ingest` (from monorepo root) — chunks, embeds, and pushes everything into the `portfolio_chunks` collection.
4. `pnpm rag dev` — starts the server on `http://localhost:3001`.
5. `curl http://localhost:3001/health` → `{"ok":true,"service":"rag-server"}`.

---

## Architecture

**All source files are TypeScript.** No `.js`. Type-check with `pnpm rag check` before committing.

### File map

```
.env.example                    → committed template (vars listed below)
.env                            → gitignored (your real creds)
sources/                        → drop .md / .txt / .pdf files here; ingestion reads them recursively
src/
  env.ts                        → zod-validated env loader; exits on missing vars
  server.ts                     → Hono app: CORS, GET /health, POST /chat (stream + tool)
  lib/
    openai.ts                   → exports `chatModel`, `embeddingModel`, `EMBEDDING_DIMENSION`
    astra.ts                    → DataAPIClient singleton, `ChunkDoc` type, `getCollection()`, `ensureCollection({ reset })`
    chunk.ts                    → sentence-aware chunker (~600 tokens, ~80 overlap)
    retrieve.ts                 → `searchProfile(query, k)` → top-K hits with similarity
    loaders/
      index.ts                  → dispatch by extension; exports `loadSource()`, `SUPPORTED_EXTENSIONS`
      md.ts / txt.ts / pdf.ts   → per-format loaders (return raw text)
  scripts/
    ingest.ts                   → CLI: walk sources/, chunk, embed, drop & re-create collection, insert
```

### Type contracts

- `ChunkDoc` (in `lib/astra.ts`) is the document stored in Astra — `{ source, type, chunkIndex, text, hash, $vector }`.
- `Hit` (in `lib/retrieve.ts`) is what the chat tool returns to the model: `{ source, type, text, similarity }`.
- All env vars are typed via `env.ts`; if a value is missing the process exits with a friendly listing of the gap.

---

## Key files

| Concern | Path |
|---|---|
| Server entrypoint + system prompt + chat tool | `src/server.ts` |
| Vector search (used by the tool) | `src/lib/retrieve.ts` |
| Embedding ingestion CLI | `src/scripts/ingest.ts` |
| Astra schema + collection helpers | `src/lib/astra.ts` |
| Model selection (chat + embeddings) | `src/lib/openai.ts` |

---

## Scripts

From the monorepo root:
```
pnpm rag dev          → tsx watch — hot reload on file changes
pnpm rag start        → run once (no watch); used in production-ish setups
pnpm rag check        → tsc --noEmit
pnpm rag ingest       → full re-index from sources/ → Astra
pnpm rag ingest:reset → same as ingest (default IS reset). Pass `--no-reset` to append.
pnpm ingest           → turbo: runs ingest in every workspace that has it (currently rag-server only)
```

From inside this folder, drop the `rag` prefix: `pnpm dev`, `pnpm ingest`, etc.

---

## Endpoints

### `GET /health`
Returns `{ ok: true, service: "rag-server" }`. Use for liveness checks.

### `POST /chat`
Vercel AI SDK UI message protocol.

**Request body:**
```json
{ "messages": [ { "id": "...", "role": "user", "parts": [{ "type": "text", "text": "..." }] } ] }
```

**Response:** SSE stream of UI message parts (`toUIMessageStreamResponse()`). The model first calls the `searchProfile` tool, then streams the grounded answer.

**Tool exposed to the model:**

| Tool | Input | Returns |
|---|---|---|
| `searchProfile` | `{ query: string, k?: 1..10 (default 5) }` | `Hit[]` from `retrieve.ts` |

The system prompt forces the model to call `searchProfile` before answering any factual question.

---

## Env vars

| Name | Required | Default | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | yes | — | OpenAI key with access to `gpt-4o-mini` and `text-embedding-3-small` |
| `ASTRA_DB_APPLICATION_TOKEN` | yes | — | From Astra → Tokens. Needs read+write on the keyspace |
| `ASTRA_DB_API_ENDPOINT` | yes | — | Full URL like `https://<id>-<region>.apps.astra.datastax.com` |
| `ASTRA_DB_KEYSPACE` | no | `default_keyspace` | |
| `PORT` | no | `3001` | |
| `CORS_ORIGIN` | no | `http://localhost:4321` | Comma-separated. Use `*` only in dev. |
| `RATE_LIMIT_PER_HOUR` | no | `30` | Per-IP request cap; returns 429 over the limit |
| `MAX_HISTORY_MESSAGES` | no | `10` | Last N messages of the conversation sent to the LLM |
| `MAX_OUTPUT_TOKENS` | no | `500` | Hard cap on tokens generated per assistant response |
| `RETRIEVAL_SIMILARITY_FLOOR` | no | `0.4` | Cosine similarity threshold; weaker hits are dropped |

---

## Guardrails (cost / abuse protection)

The server has 5 layers of defense to prevent token-drain and off-topic abuse. All thresholds are env-configurable:

1. **Strict system prompt** (`src/server.ts → SYSTEM_PROMPT`) — forces the model to refuse any out-of-scope question with a one-sentence canned response (EN or ES). No tool call, no engagement.
2. **Similarity floor in retrieval** (`src/lib/retrieve.ts`) — `searchProfile` filters out chunks below `RETRIEVAL_SIMILARITY_FLOOR`. If nothing passes, the model gets `[]` and says "I don't have info".
3. **History cap** — only the last `MAX_HISTORY_MESSAGES` are sent to the LLM, bounding token usage as conversations grow.
4. **Output token cap** — `streamText({ maxOutputTokens })` caps each response.
5. **Per-IP rate limit** (`src/lib/rateLimit.ts`) — in-memory `Map<IP, count>` with a rolling 1h window. Reads `X-Forwarded-For` (set by Cloudflare/Fly/Railway in prod) with fallback to `"unknown"`. Returns `429` + `X-RateLimit-Remaining` / `X-RateLimit-Reset` headers when exceeded. **Resets on server restart** — for production behind a load balancer, swap to Redis or upstash.

### Cost per request (rough, with defaults)

| Path | Tokens | Cost (gpt-4o-mini) |
|---|---|---|
| Rate-limited | 0 | $0 (rejected before LLM) |
| Off-topic refusal | ~530 | ~$0.0001 (no tool call, no Astra) |
| In-scope, with retrieval | ~1500–2500 | ~$0.0003–0.0005 |

---

## Adding a new chat tool

1. Define a `zod` `inputSchema` for it.
2. In `src/server.ts`, add it to the `tools` map of `streamText({ tools: ... })`:
   ```ts
   myTool: tool({
     description: "What this tool does — the model reads this to decide when to call it.",
     inputSchema: z.object({ ... }),
     execute: async (input) => { /* ... */ },
   }),
   ```
3. If the tool needs a fresh module, drop it under `src/lib/`.
4. The system prompt only mentions `searchProfile` explicitly. If your new tool needs special behavior (e.g. "always call X before Y"), add a rule there.

---

## Re-using existing portfolio data

The web app's curated content lives at `../../data/portfolio.json` and `../../apps/web/src/components/eink/data/*`. These are *not* automatically ingested.

If you want them in the agent's context, two simple options:
- **One-time:** copy a digest into `sources/portfolio-summary.md` and re-run ingest.
- **Sync script (future):** add a `pnpm rag sync-portfolio` script that re-generates `sources/portfolio-summary.md` from those files. Track this if it becomes useful — for now manual copy is simpler.

---

## Git conventions

See [`../../CLAUDE.md`](../../CLAUDE.md): **no `Co-Authored-By: Claude` trailer in commits.**
