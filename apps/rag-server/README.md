# @portfolio/rag-server

RAG-backed chat agent for [guillermo-puente.dev](https://gpuente.me). Hono + Vercel AI SDK + Astra DB + OpenAI.

See [`CLAUDE.md`](./CLAUDE.md) for the full architecture and scripts. Quickstart:

```bash
# 1. Set up creds
cp .env.example .env
# fill in OPENAI_API_KEY + ASTRA_DB_* values

# 2. Drop reference files into sources/
echo "..." > sources/cv.md

# 3. Embed + push to Astra
pnpm rag ingest        # from monorepo root
# or, from inside this folder:
pnpm ingest

# 4. Run the server
pnpm rag dev           # http://localhost:3001
curl http://localhost:3001/health
```

## Endpoints

- `GET /health` → `{ ok: true, service: "rag-server" }`
- `POST /chat` → Vercel AI SDK UI message stream. Body: `{ messages: UIMessage[] }`.
