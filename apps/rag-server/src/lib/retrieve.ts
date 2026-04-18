import { embed } from "ai";
import { vector } from "@datastax/astra-db-ts";
import { embeddingModel } from "./openai.ts";
import { getCollection } from "./astra.ts";
import { env } from "../env.ts";
import { logger } from "./logger.ts";
import { ragStepDuration } from "./metrics.ts";

export type Hit = {
  source: string;
  type: "pdf" | "md" | "txt";
  text: string;
  similarity: number;
};

/**
 * Embed a query and run an ANN search over the `portfolio_chunks` collection.
 * Hits below `RETRIEVAL_SIMILARITY_FLOOR` are dropped — this prevents the
 * agent from being fed weak/unrelated context for off-topic questions
 * (which the system prompt should already refuse, but this is a second line).
 *
 * Observability: instruments three sub-steps of the RAG pipeline —
 *   - `embedding`     OpenAI call to vectorise the query
 *   - `astra_search`  ANN scan + iteration on the Astra collection
 *   - `build_prompt`  filter-by-similarity + shape into `Hit[]`
 *
 * Each step emits a Prometheus histogram sample and a structured log line
 * tagged with `traceId` (when provided) so the entire request can be
 * reconstructed in Grafana with `{trace_id="…"}`.
 */
export async function searchProfile(
  query: string,
  k = 5,
  traceId?: string,
): Promise<Hit[]> {
  // ── 1. Embedding ──────────────────────────────────────────────────────
  const embedTimer = ragStepDuration.startTimer({ step: "embedding" });
  const embedStart = performance.now();
  const { embedding } = await embed({ model: embeddingModel, value: query });
  embedTimer();
  logger.info("rag.step", {
    trace_id: traceId,
    step: "embedding",
    duration_ms: Math.round(performance.now() - embedStart),
    dimension: embedding.length,
  });

  // ── 2. Astra ANN search ──────────────────────────────────────────────
  const searchTimer = ragStepDuration.startTimer({ step: "astra_search" });
  const searchStart = performance.now();
  const collection = getCollection();
  const cursor = collection
    .find({})
    .sort({ $vector: vector(embedding) })
    .includeSimilarity(true)
    .limit(Math.min(Math.max(k, 1), 10));

  // Materialise all docs before timing stops so we measure the full ANN
  // + network round-trip (iteration is where Astra streams results).
  const rawDocs: Array<{ source: string; type: "pdf" | "md" | "txt"; text: string; $similarity?: number }> = [];
  for await (const doc of cursor) {
    rawDocs.push(doc);
  }
  searchTimer();
  logger.info("rag.step", {
    trace_id: traceId,
    step: "astra_search",
    duration_ms: Math.round(performance.now() - searchStart),
    results_count: rawDocs.length,
    k_requested: k,
  });

  // ── 3. Build prompt-ready hits (similarity floor + shape) ───────────
  const buildTimer = ragStepDuration.startTimer({ step: "build_prompt" });
  const buildStart = performance.now();
  const hits: Hit[] = [];
  for (const doc of rawDocs) {
    const similarity = doc.$similarity ?? 0;
    if (similarity < env.RETRIEVAL_SIMILARITY_FLOOR) continue;
    hits.push({
      source: doc.source,
      type: doc.type,
      text: doc.text,
      similarity,
    });
  }
  buildTimer();
  logger.info("rag.step", {
    trace_id: traceId,
    step: "build_prompt",
    duration_ms: Math.round(performance.now() - buildStart),
    kept: hits.length,
    dropped: rawDocs.length - hits.length,
    floor: env.RETRIEVAL_SIMILARITY_FLOOR,
  });

  return hits;
}
