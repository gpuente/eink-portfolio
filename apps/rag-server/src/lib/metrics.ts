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
