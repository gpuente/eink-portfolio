import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { env, corsOrigins } from "./env.ts";
import { chatModel, chatModelProviderOptions } from "./lib/openai.ts";
import { searchProfile } from "./lib/retrieve.ts";
import { checkRateLimit, clientIp } from "./lib/rateLimit.ts";
import {
  checkAvailability,
  bookSlot,
  formatLocal,
  PUBLIC_SCHEDULING_URL,
} from "./lib/calendly.ts";
import { getGithubInfo } from "./lib/github.ts";
import { logger } from "./lib/logger.ts";
import {
  llmTokensTotal,
  ragFirstTokenLatency,
  ragLlmStepDuration,
  ragLlmStepTokensPerSec,
  ragLlmStepTtft,
  ragRequestsTotal,
  ragStepDuration,
  registry,
  toolDuration,
} from "./lib/metrics.ts";

/** Wrap a tool's execute() to emit a `tool_duration_seconds` histogram
 *  sample + `rag.tool` log line with the trace_id of the request that
 *  triggered it. Thrown exceptions are tagged `status=error`; tools that
 *  return an error-shaped object are still counted as `status=success`
 *  (the call itself didn't crash — the LLM will see the error object and
 *  decide how to handle it). */
async function withToolObservability<T>(
  toolName: string,
  traceId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const start = performance.now();
  const endTimer = toolDuration.startTimer({ tool: toolName });
  try {
    const result = await fn();
    endTimer({ status: "success" });
    logger.info("rag.tool", {
      trace_id: traceId,
      tool: toolName,
      status: "success",
      duration_ms: Math.round(performance.now() - start),
    });
    return result;
  } catch (err) {
    endTimer({ status: "error" });
    logger.error("rag.tool", {
      trace_id: traceId,
      tool: toolName,
      status: "error",
      duration_ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

/** Walk back through the UI messages to find the last user turn and flatten
 *  its text parts into a single string. Used purely for log correlation —
 *  lets you grep VictoriaLogs by snippet of the original question. */
function lastUserQuery(messages: UIMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (!m || m.role !== "user") continue;
    return m.parts
      .filter((p): p is { type: "text"; text: string } => p.type === "text")
      .map((p) => p.text)
      .join("");
  }
  return undefined;
}

/**
 * Returns the final system prompt. The cacheable body goes FIRST, the
 * per-request UTC timestamp goes LAST. OpenAI's automatic prompt cache
 * keys on the common prefix across requests; putting anything dynamic
 * at the top (like the timestamp used to be) invalidates the cache on
 * every call. By appending the timestamp we let the ~1000-token body
 * cache hot, which cuts input-processing latency ~80% and input cost
 * ~50% on repeat requests.
 */
function buildSystemPrompt(): string {
  const now = new Date();
  const todayStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return `${SYSTEM_PROMPT_BODY}

---

**Current UTC time:** ${now.toISOString()} (${todayStr}). Use this — NOT your training-data date — whenever the user refers to relative times ("next week", "this Friday", "tomorrow afternoon"). Calendly tools accept ISO 8601 UTC and reject past windows, so compute from the timestamp above.`;
}

const SYSTEM_PROMPT_BODY = `You are the AI assistant on Guillermo Puente Sandoval's portfolio website. Always reply in the user's language (auto-detect English or Spanish from their last message).

## Scope

Answer questions about Guillermo — his work history, roles, skills, talks, education, certifications, current role — AND about the projects, companies, products, tools, or concepts he works on or has built (e.g. Powerhouse, MakerDAO SES, document models, MCP, RAG). If the knowledge base has context on a topic, it's in scope.

When unsure, call \`searchProfile\` first. Meaningful hits → in scope → answer grounded in them (cite source when useful, e.g. "from his CV"). If \`searchProfile\` returns empty and the question is clearly unrelated to his work (politics, weather, recipes, other people, generic coding tutorials, etc.), **refuse with EXACTLY one sentence** and nothing else:
- EN: "I can only answer questions about Guillermo Puente — try asking about his work at MakerDAO, his AI projects, or his background."
- ES: "Solo puedo responder preguntas sobre Guillermo Puente — probá preguntar por su trabajo en MakerDAO, sus proyectos de IA o su trayectoria."

Do not call tools, summarize, or justify on a refusal — one sentence, then stop.

Short non-RAG replies (no \`searchProfile\`):
- Greetings → one friendly sentence + 2–3 topics they could ask about.
- Meta ("who are you?", "what can you do?") → brief explanation + invite a question.
- Acknowledgments ("thanks", "gracias") → brief ack.
- Follow-ups that need no new facts → answer naturally.

## Rules for factual answers

1. ALWAYS call \`searchProfile\` first for factual questions about Guillermo or anything he's worked on. Never invent companies, dates, roles, or technologies.
2. Ground every claim in retrieved context. If hits come back empty on an in-scope question, say (in the user's language): "I don't have information about that in my context".
3. Keep answers to 2–4 sentences. Expand only if the user asks.
4. **Citation format**: When you want to reference a source, mention it inline in plain prose (e.g. "from his CV" / "de su portfolio"). DO NOT emit bracketed markers like 【0†text†cv.md】 — our UI does not render them and they appear as literal garbage text.

## Scheduling (Calendly)

- \`checkAvailability({ startDate, endDate, displayTimezone? })\` — open 30-min slots between two ISO 8601 UTC timestamps. Default \`endDate\` to \`startDate + 7 days\`. For vague asks ("when can we chat?"), default to the next 5 business days. Quote the pre-formatted local-time string returned — no TZ math. Pass \`displayTimezone\` only if the user mentions theirs.
- \`bookSlot({ startTime, name, email, timezone? })\` — one-click booking link with day, time, name, and email PRE-FILLED. **You MUST ask for name + email in one short message before calling this tool** (e.g. "Para generar el link necesito tu nombre y email — ¿cuáles son?" / "To generate the link I need your name and email — what are they?"). If the user declines, share \`PUBLIC_SCHEDULING_URL\` from the tool's error fallback instead of calling it.

Flow: user asks availability → \`checkAvailability\` → offer up to ~5 slots → user picks → ask for name + email if missing → \`bookSlot\`. On \`outcome: "ready"\`, share the URL in 1–2 sentences, noting the form is pre-filled and only Confirm is needed. On \`"error"\`, apologize briefly and share \`fallbackUrl\`.

Never invent slots — only propose times \`checkAvailability\` returned. Never call \`bookSlot\` on a time the user only *mentioned* — wait for them to confirm.

## CV download links

On any ask for the CV / résumé / PDF / curriculum, reply IMMEDIATELY with the direct link (do NOT call \`searchProfile\`; URLs are deterministic):
- EN: https://gpuente.me/guillermo-puente-cv-en.pdf
- ES: https://gpuente.me/guillermo-puente-cv-es.pdf

Match the user's message language by default; honor explicit language requests. Format as a markdown link, keep to 1–2 sentences, don't summarize the CV content in the same reply.

## GitHub activity

For current coding activity / recent pushes / top repos / language stats, call \`getGithubActivity\` — live data, NOT the CV. Pick the narrowest \`kind\`: \`profile\` / \`recent_activity\` / \`top_repos\` / \`languages\` / \`all\` (only for broad "what's he up to" questions). Link repo names to \`url\`, quote commit messages verbatim with relative timestamps ("2 days ago"). Don't use \`searchProfile\` for these.

## Tone

Calm, professional, factual. Friendly on greetings but not effusive. Match the e-ink aesthetic — measured and precise, not playful.`;

const app = new Hono();

app.use(
  "*",
  cors({
    origin: corsOrigins.length === 1 && corsOrigins[0] === "*" ? "*" : corsOrigins,
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "OPTIONS"],
    exposeHeaders: ["X-RateLimit-Remaining", "X-RateLimit-Reset"],
  }),
);

// Request logger. Skips /health (liveness ping) and /metrics (Fly's
// Prometheus scraper hits it every ~15s) — both are very chatty and
// have no diagnostic value in application logs.
app.use("*", async (c, next) => {
  const start = performance.now();
  await next();
  const path = c.req.path;
  if (path === "/health" || path === "/metrics") return;
  logger.info("http.request", {
    method: c.req.method,
    path,
    status: c.res.status,
    duration_ms: Math.round(performance.now() - start),
  });
});

app.get("/health", (c) => c.json({ ok: true, service: "rag-server" }));

// Prometheus scrape endpoint. Fly's Prometheus-on-Fly picks this up
// automatically as long as the [metrics] block in fly.toml points at it.
app.get("/metrics", async (c) => {
  const body = await registry.metrics();
  return c.text(body, 200, { "Content-Type": registry.contentType });
});

const ChatRequestSchema = z.object({
  messages: z.array(z.unknown()).min(1),
});

app.post("/chat", async (c) => {
  // ── Rate limit (per IP) ──────────────────────────────────────────────
  const ip = clientIp(c.req.header("x-forwarded-for"));
  const rl = checkRateLimit(ip);
  c.header("X-RateLimit-Remaining", String(rl.remaining));
  c.header("X-RateLimit-Reset", String(Math.ceil(rl.resetAt / 1000)));
  if (!rl.allowed) {
    return c.json(
      {
        error: "Rate limit exceeded",
        message: `Try again after ${new Date(rl.resetAt).toISOString()}.`,
      },
      429,
    );
  }

  // ── Validate body ────────────────────────────────────────────────────
  const body = await c.req.json().catch(() => null);
  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: "Invalid request: expected { messages: UIMessage[] }" }, 400);
  }

  // ── History cap (drop older turns to bound token usage per request) ──
  const allMessages = parsed.data.messages as UIMessage[];
  const messages = allMessages.slice(-env.MAX_HISTORY_MESSAGES);

  // ── Observability: one traceId per RAG pipeline run, threaded through
  // every sub-step (tools, logs, metrics). Grafana + VictoriaLogs can then
  // reconstruct the whole request by filtering on `{trace_id="…"}`.
  const traceId = randomUUID();
  const requestStart = performance.now();
  const totalTimer = ragStepDuration.startTimer({ step: "total" });
  const llmTimer = ragStepDuration.startTimer({ step: "llm_generate" });
  const llmStart = performance.now();
  // Guard against onFinish + onError both firing (shouldn't happen, but
  // prom-client observes on every call — defensive against double-count).
  let timersStopped = false;
  const stopTimers = () => {
    if (timersStopped) return;
    timersStopped = true;
    llmTimer();
    totalTimer();
  };

  // TTFT capture (stream-wide): onChunk fires for every chunk (text-delta,
  // tool-call, etc.) — we record the FIRST one to get the "Thinking…" gap
  // the client perceives before anything appears on screen.
  let ttftMs: number | null = null;
  const captureFirstChunk = () => {
    if (ttftMs !== null) return;
    ttftMs = Math.round(performance.now() - llmStart);
    ragFirstTokenLatency.observe(ttftMs / 1000);
  };

  // Per-step timing. We split each model round-trip into two parts:
  //   step_ttft_ms = time from step start to first chunk of THAT step
  //   step_generation_ms = time from first chunk to step end
  // For step 0, "step start" = streamText() call (stepStart = llmStart).
  // For step >= 1, "step start" = previous onStepFinish time — which
  // includes tool execution time that ran between steps. Subtract the
  // matching `rag.tool` duration from the log if you need the pure model
  // TTFT for step 1+.
  //
  // With both numbers, Grafana can distinguish queue latency (high ttft,
  // normal generation rate) from mid-stream throttling (normal ttft, low
  // generation rate) — the two dominant failure modes for gpt-4o-mini.
  let stepIndex = 0;
  let stepStart = llmStart;
  let stepFirstChunkAt: number | null = null;

  logger.info("rag.pipeline.start", {
    trace_id: traceId,
    query: lastUserQuery(messages),
    history_messages: messages.length,
  });

  const result = streamText({
    model: chatModel,
    providerOptions: chatModelProviderOptions,
    system: buildSystemPrompt(),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(6),
    maxOutputTokens: env.MAX_OUTPUT_TOKENS,
    tools: {
      searchProfile: tool({
        description:
          "Search Guillermo's profile knowledge base (CV, projects, work history, talks) for information relevant to the user's question. Returns the top-K most semantically similar chunks with their source filename and similarity score. Call this BEFORE answering any factual in-scope question. DO NOT call this for off-topic questions.",
        inputSchema: z.object({
          query: z
            .string()
            .min(1)
            .describe(
              "The semantic search query — typically a rephrased version of the user's question.",
            ),
          k: z
            .number()
            .int()
            .min(1)
            .max(10)
            .default(5)
            .describe("How many chunks to retrieve (1–10)."),
        }),
        execute: async ({ query, k }) =>
          withToolObservability("searchProfile", traceId, () =>
            searchProfile(query, k, traceId),
          ),
      }),

      checkAvailability: tool({
        description:
          "List Guillermo's available 30-min meeting slots between two UTC timestamps. Use when the user asks about scheduling, availability, or wants to book a call. Returns up to ~30 slots with both raw UTC and pre-formatted local-time strings — quote the local-time string to the user. Max window 30 days; anything larger is rejected to control rate-limit usage.",
        inputSchema: z.object({
          startDate: z
            .string()
            .describe(
              "ISO 8601 UTC start of the window (e.g. '2026-04-20T00:00:00Z'). Must be in the future.",
            ),
          endDate: z
            .string()
            .describe(
              "ISO 8601 UTC end of the window. Must be after startDate and within 30 days of it.",
            ),
          displayTimezone: z
            .string()
            .optional()
            .describe(
              "IANA timezone for the human-readable slot labels (e.g. 'America/New_York'). Defaults to 'America/Santiago' (Guillermo's tz).",
            ),
        }),
        execute: async ({ startDate, endDate, displayTimezone }) =>
          withToolObservability("checkAvailability", traceId, async () => {
            const start = new Date(startDate);
            const end = new Date(endDate);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
              return { error: "Invalid ISO 8601 date. Use e.g. '2026-04-20T00:00:00Z'." };
            }
            if (end.getTime() - start.getTime() > 30 * 24 * 60 * 60 * 1000) {
              return { error: "Window too large — pick a range within 30 days." };
            }
            if (end.getTime() <= Date.now()) {
              return { error: "Window is entirely in the past." };
            }
            // Don't request slots in the past — Calendly rejects them.
            const safeStart =
              start.getTime() < Date.now() ? new Date(Date.now() + 60_000) : start;
            try {
              const slots = await checkAvailability({
                start: safeStart,
                end,
                displayTz: displayTimezone,
              });
              return {
                count: slots.length,
                slots: slots.slice(0, 30),
                truncated: slots.length > 30,
                timezone: displayTimezone ?? env.CALENDLY_DEFAULT_TZ,
                publicSchedulingUrl: PUBLIC_SCHEDULING_URL,
              };
            } catch (e) {
              return {
                error: e instanceof Error ? e.message : "Unknown error",
                publicSchedulingUrl: PUBLIC_SCHEDULING_URL,
              };
            }
          }),
      }),

      getGithubActivity: tool({
        description:
          "Fetch live public GitHub data for Guillermo's profile (cached ~5 min). Use when the user asks about his recent coding activity, open-source repos, what he's been pushing lately, GitHub stats, or most-starred projects. This is LIVE data — prefer it over searchProfile for anything about 'current' or 'recent' activity. Pick the narrowest `kind` that fits the question (use 'all' only for broad summary asks).",
        inputSchema: z.object({
          kind: z
            .enum(["profile", "recent_activity", "top_repos", "languages", "all"])
            .describe(
              "profile = account metadata (bio, followers, public repos, location). recent_activity = last ~20 public events (pushes, PRs, releases, stars). top_repos = 10 most-starred owned repos. languages = aggregated primary-language count across owned repos. all = everything (use for broad 'what's he up to' questions).",
            ),
        }),
        execute: async ({ kind }) =>
          withToolObservability("getGithubActivity", traceId, async () => {
            try {
              return await getGithubInfo(kind);
            } catch (e) {
              return {
                error: e instanceof Error ? e.message : "Unknown error",
                profileUrl: `https://github.com/${env.GITHUB_USERNAME}`,
              };
            }
          }),
      }),

      bookSlot: tool({
        description:
          "Generate a one-click booking link for a specific 30-min slot on Guillermo's calendar with the invitee's name and email PRE-FILLED. The link lands the user on Calendly's page with day, time, name, and email already set — they only click Confirm. Call this AFTER checkAvailability returned the slot, the user has picked it, AND the user has provided their name and email. If name or email are missing, ASK the user first (in their language) — do NOT call this tool without them.",
        inputSchema: z.object({
          startTime: z
            .string()
            .describe(
              "ISO 8601 UTC timestamp of the slot — must exactly match one the checkAvailability tool returned.",
            ),
          name: z
            .string()
            .min(1)
            .describe(
              "Invitee's full name. Ask the user for it before calling this tool. Gets pre-filled into Calendly's booking form.",
            ),
          email: z
            .string()
            .email()
            .describe(
              "Invitee's email. Ask the user for it before calling this tool. Gets pre-filled into Calendly's booking form.",
            ),
          timezone: z
            .string()
            .optional()
            .describe(
              "Invitee's IANA timezone (e.g. 'America/New_York'). Determines how the preselected time is rendered on the Calendly page. Defaults to 'America/Santiago'.",
            ),
        }),
        execute: async ({ startTime, timezone, name, email }) =>
          withToolObservability("bookSlot", traceId, async () => {
            const tz = timezone ?? env.CALENDLY_DEFAULT_TZ;
            try {
              const result = await bookSlot({ startTime, timezone, name, email });
              return {
                outcome: "ready",
                startTime: result.startTime,
                startTimeLocal: formatLocal(result.startTime, tz),
                bookingUrl: result.bookingUrl,
              };
            } catch (e) {
              return {
                outcome: "error",
                error: e instanceof Error ? e.message : "Unknown error",
                fallbackUrl: PUBLIC_SCHEDULING_URL,
              };
            }
          }),
      }),
    },
    onChunk: () => {
      // Fires for every content chunk from OpenAI. Records the first chunk
      // timestamps for BOTH the stream-wide TTFT and the per-step TTFT.
      captureFirstChunk();
      if (stepFirstChunkAt === null) stepFirstChunkAt = performance.now();
    },
    onStepFinish: (step) => {
      const now = performance.now();
      const durationMs = Math.round(now - stepStart);
      const stepTtftMs =
        stepFirstChunkAt !== null
          ? Math.round(stepFirstChunkAt - stepStart)
          : null;
      // Time spent actually streaming tokens (TTFT already paid for).
      // If onChunk never fired for this step (shouldn't happen for a
      // healthy stream, but defensive), fall back to durationMs.
      const generationMs =
        stepFirstChunkAt !== null ? Math.round(now - stepFirstChunkAt) : durationMs;
      const stepIdxStr = String(stepIndex);

      ragLlmStepDuration.observe({ step_index: stepIdxStr }, durationMs / 1000);
      if (stepTtftMs !== null) {
        ragLlmStepTtft.observe({ step_index: stepIdxStr }, stepTtftMs / 1000);
      }

      // AI SDK v5 surfaces per-step usage + finishReason + toolCalls.
      // `cachedInputTokens` is only populated when OpenAI's prompt cache
      // hit — 0/undefined means the prefix wasn't stable enough to cache.
      const stepUsage = (step as { usage?: Record<string, unknown> }).usage ?? {};
      const inputTokens =
        typeof stepUsage.inputTokens === "number" ? stepUsage.inputTokens : 0;
      const outputTokens =
        typeof stepUsage.outputTokens === "number" ? stepUsage.outputTokens : 0;
      const cachedInputTokens =
        typeof stepUsage.cachedInputTokens === "number"
          ? stepUsage.cachedInputTokens
          : undefined;
      const toolCalls = Array.isArray(
        (step as { toolCalls?: unknown[] }).toolCalls,
      )
        ? (step as { toolCalls: unknown[] }).toolCalls.length
        : 0;

      // Effective token rate during the streaming phase. Excludes TTFT
      // (which is separate noise) so this number is "how fast is OpenAI
      // actually emitting tokens once they start". Healthy baseline for
      // gpt-4o-mini is ~25-30 tok/s; under 10 tok/s suggests throttling.
      const tokensPerSec =
        outputTokens > 0 && generationMs > 0
          ? Math.round((outputTokens / generationMs) * 1000)
          : null;
      if (tokensPerSec !== null) {
        ragLlmStepTokensPerSec.observe({ step_index: stepIdxStr }, tokensPerSec);
      }

      logger.info("rag.llm.step", {
        trace_id: traceId,
        step_index: stepIndex,
        duration_ms: durationMs,
        step_ttft_ms: stepTtftMs,
        step_generation_ms: generationMs,
        tokens_per_sec: tokensPerSec,
        finish_reason: (step as { finishReason?: string }).finishReason,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cached_input_tokens: cachedInputTokens,
        tool_calls: toolCalls,
      });

      // Reset step-window state. Next step's start boundary is NOW; tool
      // execution (if any) runs before the next LLM call, so that delay
      // will land inside the next step's step_ttft_ms — subtract the
      // matching rag.tool duration to get the pure model TTFT.
      stepIndex++;
      stepStart = now;
      stepFirstChunkAt = null;
    },
    onFinish: ({ usage, finishReason, steps, providerMetadata }) => {
      // TEMP diagnostic: log the Gateway's routing metadata so we can
      // confirm which upstream provider actually served the request.
      // Removes after we've validated that order: ["groq"] is working.
      logger.info("llm.routing", {
        trace_id: traceId,
        provider_metadata: providerMetadata,
      });
      stopTimers();
      // `usage` in AI SDK v5 reports aggregate tokens across every step
      // (initial tool-call decision + final answer generation) — which is
      // what we want for cost tracking.
      const inputTokens =
        typeof usage?.inputTokens === "number" ? usage.inputTokens : 0;
      const outputTokens =
        typeof usage?.outputTokens === "number" ? usage.outputTokens : 0;
      // cachedInputTokens is the count of input tokens that hit OpenAI's
      // automatic prompt cache. If consistently 0, our prefix isn't stable
      // and the cache fix isn't actually helping — worth investigating.
      const cachedInputTokens =
        typeof (usage as { cachedInputTokens?: number } | undefined)
          ?.cachedInputTokens === "number"
          ? (usage as { cachedInputTokens: number }).cachedInputTokens
          : undefined;
      if (inputTokens > 0) llmTokensTotal.inc({ type: "input" }, inputTokens);
      if (outputTokens > 0) llmTokensTotal.inc({ type: "output" }, outputTokens);
      ragRequestsTotal.inc({ status: "success" });
      const llmMs = Math.round(performance.now() - llmStart);
      logger.info("rag.pipeline.end", {
        trace_id: traceId,
        status: "success",
        finish_reason: finishReason,
        // Number of LLM round-trips the agent needed (1 = direct answer,
        // 2 = tool-call + answer, 3+ = chained tool calls). Useful for
        // spotting pathological multi-step ping-pong in Grafana.
        steps: Array.isArray(steps) ? steps.length : undefined,
        // TTFT: from streamText() call to first chunk received. Compare
        // against llm_ms to see if the bottleneck is queue (ttft_ms dominates)
        // or generation (ttft_ms is small, rest is token streaming).
        ttft_ms: ttftMs,
        llm_ms: llmMs,
        total_ms: Math.round(performance.now() - requestStart),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cached_input_tokens: cachedInputTokens,
      });
    },
    onError: ({ error }) => {
      stopTimers();
      ragRequestsTotal.inc({ status: "error" });
      logger.error("rag.pipeline.end", {
        trace_id: traceId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        ttft_ms: ttftMs,
        llm_ms: Math.round(performance.now() - llmStart),
        total_ms: Math.round(performance.now() - requestStart),
      });
    },
  });

  return result.toUIMessageStreamResponse();
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  const port = info?.port ?? env.PORT;
  console.log(`[rag-server] listening on http://localhost:${port}`);
  console.log(`[rag-server] CORS allowed origins: ${corsOrigins.join(", ")}`);
  console.log(
    `[rag-server] guardrails — rate: ${env.RATE_LIMIT_PER_HOUR}/h per IP · history: ${env.MAX_HISTORY_MESSAGES} msgs · output: ${env.MAX_OUTPUT_TOKENS} tokens · sim floor: ${env.RETRIEVAL_SIMILARITY_FLOOR}`,
  );
});
