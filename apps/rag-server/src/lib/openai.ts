import { openai } from "@ai-sdk/openai";

/**
 * Chat model — routed through Vercel AI Gateway. Passing the model as a
 * plain string to `streamText({ model })` auto-uses the Gateway provider
 * as long as AI_GATEWAY_API_KEY is set in env (see env.ts).
 *
 * Slug format is `<model-owner>/<model-name>` (not the hosting provider).
 * `meta/llama-3.3-70b` is the Meta-owned model; we pin the actual inference
 * backend to Groq via `chatModelProviderOptions` for LPU-fast TTFT and
 * consistent token throughput (~275 tok/s vs ~25 tok/s on OpenAI-tier
 * shared GPU). The Gateway falls back to other providers that host the
 * same model if Groq is temporarily unavailable — acceptable degraded
 * mode for a portfolio chat.
 *
 * Alternatives to try if Llama 3.3 regresses in ES / tool-calling quality:
 *   - `alibaba/qwen-3-32b` (smaller, faster, better multilingual, but has
 *     a `reasoning` tag — watch for thinking-mode overhead)
 *   - `moonshotai/kimi-k2` (good tool-use, 131k context)
 */
export const chatModel = "moonshotai/kimi-k2" as const;

export const chatModelProviderOptions = {
  gateway: {
    order: ["groq"],
  },
};

/**
 * Embedding model — kept on OpenAI directly. The Gateway does not proxy
 * embedding models (only chat completions), so ingestion + retrieval
 * still talk to OpenAI for `text-embedding-3-small`. This is a narrow
 * surface: embeddings are fast and the P50 shape doesn't suffer the
 * same throttling as chat completions on OpenAI's side.
 *
 * `text-embedding-3-small` produces 1536-dim vectors and is multilingual
 * (works for ES + EN without separate models). If you change this you
 * also need to change the `dimension` in `astra.ts → ensureCollection()`.
 */
export const embeddingModel = openai.embedding("text-embedding-3-small");

/** Vector dimension produced by `embeddingModel`. Keep in sync. */
export const EMBEDDING_DIMENSION = 1536;
