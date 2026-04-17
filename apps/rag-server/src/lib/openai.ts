import { openai } from "@ai-sdk/openai";

/**
 * Chat model used by the agent. `gpt-4o-mini` supports tool calling, structured
 * output, and is the best price/perf balance for a profile Q&A use case.
 */
export const chatModel = openai("gpt-4o-mini");

/**
 * Embedding model used by both the ingestion script and the retriever.
 * `text-embedding-3-small` produces 1536-dim vectors, is multilingual
 * (works for ES + EN without separate models), and is very cheap.
 *
 * If you change this, you also need to change the `dimension` in
 * `astra.ts → ensureCollection()` (the vector dimension must match).
 */
export const embeddingModel = openai.embedding("text-embedding-3-small");

/** Vector dimension produced by `embeddingModel`. Keep in sync. */
export const EMBEDDING_DIMENSION = 1536;
