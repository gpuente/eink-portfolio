import { Counter, Histogram, Registry, collectDefaultMetrics } from "prom-client";

/**
 * Prometheus registry exposed by GET /metrics. Fly's Prometheus scraper
 * hits this endpoint on the machine's internal IP every ~15s; the
 * `[metrics]` block in fly.toml tells Fly which port + path to hit.
 *
 * Keeping a single app-owned `Registry` (rather than the default global
 * one) avoids stray metrics from dependencies leaking into our scrape
 * and makes it easy to clear between test runs if we ever need to.
 */
export const registry = new Registry();

// Default Node metrics (event-loop lag, heap, CPU, GC, file handles). Cheap
// and very useful in Grafana for spotting GC pauses correlating with latency
// spikes. Scoped to our registry only.
collectDefaultMetrics({ register: registry });

/**
 * Histogram of RAG pipeline step durations, in seconds. Buckets are picked
 * for the expected range of our pipeline:
 *   - 0.05 / 0.1 / 0.25 — fast local work (build_prompt, cached Astra)
 *   - 0.5 / 1 / 2      — typical embedding + ANN query + LLM first-token
 *   - 5 / 10           — long-tail LLM generations / cold starts
 * The `step` label is one of: embedding, astra_search, build_prompt,
 * llm_generate, total. Anything else will show up in Grafana but please
 * keep the cardinality low (Prometheus doesn't love unbounded labels).
 */
export const ragStepDuration = new Histogram({
  name: "rag_step_duration_seconds",
  help: "Duration of each step in the RAG pipeline (embedding, astra_search, build_prompt, llm_generate, total).",
  labelNames: ["step"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

/**
 * Counter of /chat requests that entered the RAG pipeline, tagged with
 * their terminal status. We only bump this for requests that actually
 * reached the model — rate-limited (429) and malformed-body (400) requests
 * are counted via http_requests metrics instead (below, at the HTTP layer).
 */
export const ragRequestsTotal = new Counter({
  name: "rag_requests_total",
  help: "Total /chat requests that ran the RAG pipeline, labelled by terminal status.",
  labelNames: ["status"] as const, // "success" | "error"
  registers: [registry],
});

/**
 * Counter of tokens consumed by the LLM per request, split into input vs
 * output. Populated from streamText's onFinish `usage` field. Useful for:
 *   - cost tracking (multiply by per-token $ for your model)
 *   - catching prompt bloat (sudden input token jumps after a prompt edit)
 */
export const llmTokensTotal = new Counter({
  name: "llm_tokens_total",
  help: "LLM tokens consumed, labelled by type (input | output).",
  labelNames: ["type"] as const, // "input" | "output"
  registers: [registry],
});

/**
 * Per-tool execution time for every chat-agent tool (searchProfile,
 * checkAvailability, bookSlot, getGithubActivity). The `tool` label is the
 * tool name; `status` is "success" or "error" (a thrown exception — tools
 * that return an error-shaped object still count as "success" because the
 * call itself didn't crash, they just produced a handled error result).
 *
 * Complementary to `rag_step_duration_seconds`: that one drills into the
 * RAG pipeline sub-steps (embedding / astra_search / build_prompt); this
 * one gives you a single number per tool call, useful for comparing
 * external-API-heavy tools (bookSlot hits Calendly) vs the RAG path.
 */
export const toolDuration = new Histogram({
  name: "tool_duration_seconds",
  help: "Duration of chat-agent tool executions, labelled by tool name and status.",
  labelNames: ["tool", "status"] as const,
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10],
  registers: [registry],
});

/**
 * Time-to-first-token for the /chat stream — specifically, the gap between
 * calling streamText() and receiving the first content chunk from OpenAI.
 * This is the metric the CLIENT perceives as the "Thinking…" duration: the
 * user waits here until the first tool row or text bubble appears.
 *
 * If this dominates total latency (>80% of llm_ms), the bottleneck is
 * OpenAI's queue / first-token scheduling, NOT our code or the model's
 * generation speed. Migrating to a dedicated-inference provider (Groq,
 * Cerebras) removes that queue entirely.
 *
 * Buckets span 100ms–30s so we can see the whole distribution from
 * cache-warm fast cases to pathological outliers.
 */
export const ragFirstTokenLatency = new Histogram({
  name: "rag_first_token_seconds",
  help: "Time from streamText start to the first chunk from OpenAI — the client-perceived 'Thinking' gap before any tool-call or text appears.",
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30],
  registers: [registry],
});

/**
 * Duration of each individual LLM round-trip within a single /chat call.
 * With `stopWhen: stepCountIs(6)` we can have up to 6 model turns per
 * request (tool-call → answer is 2 turns; chained tool-calls push it
 * higher). Labelling by `step_index` ("0", "1", …) lets Grafana split
 * the turns — often the first turn (tool-call decision) is much slower
 * than subsequent turns because of queue + cache-cold effects.
 *
 * Cardinality is bounded by the stepCountIs cap (≤6), so the label is
 * safe.
 */
export const ragLlmStepDuration = new Histogram({
  name: "rag_llm_step_seconds",
  help: "Duration of each model round-trip inside a streamText call, labelled by step_index (0 = first turn).",
  labelNames: ["step_index"] as const,
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30],
  registers: [registry],
});

/**
 * TTFT of each individual step — the gap from the step's start boundary
 * to the first chunk arriving from OpenAI for that step.
 *
 * For `step_index=0` this is the "pure" TTFT: from streamText() call to
 * first chunk. For `step_index >= 1`, the step's start boundary is the
 * moment the previous step finished, which includes any tool execution
 * time (typically ~200ms for searchProfile) — subtract `tool_duration`
 * from the same trace in logs if you need the pure model TTFT for step 1+.
 *
 * Critical for distinguishing queue latency from generation speed: if
 * step_ttft is high but tokens_per_sec is normal, OpenAI is queuing the
 * request. If step_ttft is low but tokens_per_sec is low, OpenAI is
 * throttling the stream mid-flight.
 */
export const ragLlmStepTtft = new Histogram({
  name: "rag_llm_step_ttft_seconds",
  help: "Time from each step's start boundary to its first chunk from OpenAI. For step_index>=1, includes tool execution time that preceded the step.",
  labelNames: ["step_index"] as const,
  buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30],
  registers: [registry],
});

/**
 * Effective output-token-generation rate per step.
 *
 * Computed as `output_tokens / (step_duration - step_ttft)` — i.e. the
 * token rate DURING generation (excluding the TTFT portion). Labelled by
 * step_index so we can tell if throttling is specific to certain turns.
 *
 * Reference points for gpt-4o-mini:
 *   - ~25-30 tok/s = healthy baseline
 *   - ~10-15 tok/s = borderline (peak-hour compression)
 *   - <5 tok/s = actively throttled (OpenAI tier deprioritization)
 *
 * If Grafana shows P50 ~25 but P95 dipping to <5, we have confirmation
 * that a subset of requests get throttled mid-stream — that's the class
 * of problem a move to dedicated-inference (Groq) solves structurally.
 */
export const ragLlmStepTokensPerSec = new Histogram({
  name: "rag_llm_step_tokens_per_second",
  help: "Effective tokens-per-second generated during the streaming phase of each LLM step (excludes TTFT).",
  labelNames: ["step_index"] as const,
  buckets: [1, 2, 5, 10, 15, 20, 25, 30, 50, 100, 300, 600],
  registers: [registry],
});
