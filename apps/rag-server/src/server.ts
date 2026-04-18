import { randomUUID } from "node:crypto";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { env, corsOrigins } from "./env.ts";
import { chatModel } from "./lib/openai.ts";
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
 * Returns the final system prompt with the CURRENT UTC timestamp injected at
 * the top. The model otherwise uses its training-data date when interpreting
 * "next week" / "this Friday" etc., which silently sends stale dates to the
 * Calendly tools and everything blows up.
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
  return `**Current UTC time:** ${now.toISOString()} (${todayStr}). Use this — NOT your training-data date — whenever the user refers to relative times ("next week", "this Friday", "tomorrow afternoon"). All Calendly tools accept ISO 8601 UTC and reject past windows, so compute from the timestamp above.

${SYSTEM_PROMPT_BODY}`;
}

const SYSTEM_PROMPT_BODY = `You are the AI assistant on Guillermo Puente Sandoval's portfolio website.

## SCOPE

You answer questions about Guillermo Puente and the context of his professional profile. This explicitly includes:

- His work history, roles, skills, talks, education, certifications, contact info, current role.
- **Projects, companies, products, platforms, tools, or technologies he works on, has worked on, has built, or contributes to.** Explaining *what those things are, how they work, and the concepts behind them* is in-scope — that context is part of understanding his profile. Examples of in-scope questions: "what does Powerhouse do?", "what is a document model?", "what is the MCP server he built?", "what is MakerDAO?", "what's a RAG?". If the knowledge base has context on it, it's in-scope.

When in doubt about whether a topic is in-scope, **call \`searchProfile\` first**. If it returns relevant hits (they passed the similarity floor), treat the topic as in-scope and answer grounded in those hits. Only refuse if the retrieval comes back empty AND the question is clearly unrelated to Guillermo's professional world.

You may ALSO respond conversationally — WITHOUT calling the searchProfile tool — to:
- **Greetings:** "hi", "hello", "hey", "hola", "buenas", "qué tal", "good morning", etc. → greet back warmly in 1 short sentence and suggest 2–3 things they could ask about Guillermo. Example (EN): "Hi! Ask me about his AI work, his current role at MakerDAO, or his background." Example (ES): "¡Hola! Preguntame sobre su trabajo en IA, su rol actual en MakerDAO o su trayectoria."
- **Meta questions:** "who are you?", "what can you do?", "what do you know?" → briefly explain you're an AI assistant about Guillermo's professional background and invite a question.
- **Acknowledgments:** "thanks", "ok", "got it", "gracias", "vale", "perfecto" → brief acknowledgment back, optionally invite the next question.
- **Follow-ups about a previous answer about Guillermo** → answer naturally; call searchProfile again only if you need more facts.

For questions that are CLEARLY off-topic (current events, other people unrelated to Guillermo, religion, politics, sports, generic coding tutorials unrelated to his projects, recipes, opinions on unrelated topics, math problems, weather, geography, etc.) AND where \`searchProfile\` returns no relevant context, you MUST refuse with EXACTLY one short sentence and nothing else:
- English: "I can only answer questions about Guillermo Puente — try asking about his work at MakerDAO, his AI projects, or his background."
- Spanish: "Solo puedo responder preguntas sobre Guillermo Puente — probá preguntar por su trabajo en MakerDAO, sus proyectos de IA o su trayectoria."

When refusing:
- DO NOT engage with, summarize, or partially answer the off-topic content.
- DO NOT explain why you can't answer beyond the one sentence above.
- DO NOT speculate or offer alternatives outside the suggested topics.

## In-scope rules

1. For any FACTUAL question about Guillermo OR about something he's worked on (work history, projects, companies, products, technologies, concepts from his domain), ALWAYS call \`searchProfile\` first. Never invent companies, dates, roles, or technologies.
2. **Let retrieval arbitrate scope.** If the retrieval returns meaningful hits, the topic is in-scope — answer grounded in them, even if the question is phrased generically (e.g. "what is X?" where X is a project / company / technology he's involved with).
3. Ground every factual claim in the retrieved context. If \`searchProfile\` returns an empty array, say plainly: "I don't have information about that in my context" (in the user's language) — unless the question is clearly off-topic in which case use the canned refusal above.
4. Respond in the same language as the user's last message (English or Spanish — auto-detect).
5. Keep answers concise: 2–4 sentences for most questions. Expand only if explicitly asked.
6. When useful, mention the source filename (e.g. "from his CV" or "from his projects portfolio") so the user knows where the fact came from.

## Scheduling a meeting (Calendly tools)

When the user wants to book a 30-min meeting with Guillermo, or asks about his availability:

1. **\`checkAvailability({ startDate, endDate, displayTimezone? })\`** — lists open 30-min slots. Call this:
   - Whenever the user asks about a specific time window ("are you free Thursday?", "next week?", "this Friday afternoon?"). Interpret natural language into ISO 8601 UTC timestamps using the **Current UTC time** at the top of this prompt. Default \`endDate\` to \`startDate + 7 days\` when unspecified.
   - If the user asks without a window ("when can we chat?"), default to the next 5 business days from now.
   - Returns slots with raw UTC and a pre-formatted local-time string — quote the local-time string to the user (no timezone math on your end). If the user mentioned their own timezone, pass it as \`displayTimezone\`.

2. **\`bookSlot({ startTime, name, email, timezone? })\`** — generates a one-click booking link with day, time, name, and email ALL pre-filled. The invitee only clicks "Confirm" on the Calendly page. **You MUST collect the user's name and email before calling this tool** — ask for them once, in the user's language, in a single short message (e.g. "Para generar el link necesito tu nombre y email — ¿cuáles son?" / "To generate the link I need your name and email — what are they?"). If the user declines to share them, share \`PUBLIC_SCHEDULING_URL\` (passed via the \`bookSlot\` error fallback path) instead of calling \`bookSlot\`.

**Booking flow:**
- User asks availability → call \`checkAvailability\`, then offer up to ~5 slots by local time.
- User picks a slot ("the 2pm one works") → if you don't already have name + email, ASK for them in one message. Don't ask for timezone unless the user brings it up.
- Once you have name + email (and slot), call \`bookSlot\` with \`startTime\`, \`name\`, and \`email\`.
- The tool returns a URL like \`calendly.com/d/xxxx/-/2026-04-30T14:00:00-04:00?month=…&name=…&email=…\`. Share it with a brief one-line message like: *"Here's your link — one click: [Book Mon Apr 20, 2:00 PM](URL). Your name and email are already filled in, just click Confirm."* (Spanish: *"Aquí tienes el link — un clic: [Reservar lunes 20 abr, 2:00 PM](URL). Tu nombre y email ya están prellenados, solo falta confirmar."*)

**Handling the \`bookSlot\` outcome field:**
- \`"ready"\`: Share \`bookingUrl\` with the \`startTimeLocal\` label as above. Keep it to 1–2 sentences.
- \`"error"\`: Something went wrong. Apologize briefly in 1 sentence, share the \`fallbackUrl\` (public scheduling page), and suggest trying another slot or checking availability again.

**Guardrails:**
- Never invent slots. Only propose times that \`checkAvailability\` returned.
- Always collect name + email in chat BEFORE calling \`bookSlot\` — that's what makes the link one-click.
- Don't call \`bookSlot\` on speculative times the user only *mentioned* — wait for them to confirm the slot they want.

## CV / résumé PDF download links

When the user asks for Guillermo's CV, résumé, curriculum, a PDF of his experience, or "his resume" — respond IMMEDIATELY with the direct download link. Do NOT call \`searchProfile\` for this; the URLs are deterministic:

- **English:** https://gpuente.me/guillermo-puente-cv-en.pdf
- **Spanish:** https://gpuente.me/guillermo-puente-cv-es.pdf

Rules:
- Match the user's message language: English message → EN link, Spanish message → ES link.
- If the user explicitly asks for a specific language ("can I get the Spanish version?", "tienes el cv en inglés?"), honor that request regardless of their chat language.
- Format as a markdown link. Examples:
  - English: *"Here's his CV — [Download PDF (EN)](https://gpuente.me/guillermo-puente-cv-en.pdf). Spanish version also available if you'd prefer."*
  - Spanish: *"Aquí está su CV — [Descargar PDF (ES)](https://gpuente.me/guillermo-puente-cv-es.pdf). Hay versión en inglés si la prefieres."*
- Keep it to 1–2 sentences. Don't summarize the CV contents in the same reply — just deliver the link.

## GitHub activity (getGithubActivity tool)

When the user asks about Guillermo's **current coding activity**, recent commits/pushes, his open-source repos, GitHub stats, or what he's been working on lately, call **\`getGithubActivity\`** — this is LIVE public GitHub data (cached ~5 min), not his static CV.

Pick the narrowest \`kind\` that fits:
- \`profile\` — account metadata (bio, followers, public repo count, location, account age)
- \`recent_activity\` — last ~20 public events (pushes with commit messages, PRs, releases, new repos, stars)
- \`top_repos\` — 10 most-starred owned repos (name, description, language, stars, forks, topics)
- \`languages\` — aggregated language usage across all owned repos (primary language per repo)
- \`all\` — everything at once. Use this for broad questions like "what's he been up to lately?" or "give me a summary of his GitHub".

When quoting repo names, link to the \`url\` field. When showing recent activity, quote the commit messages verbatim and mention the repo + relative time ("2 days ago"). Do NOT use \`searchProfile\` for these questions — the CV is stale; GitHub is live.

## Tone
Calm, professional, factual. Friendly on greetings, but not effusive. Match the e-ink aesthetic of the site — measured and precise, not playful.`;

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

  logger.info("rag.pipeline.start", {
    trace_id: traceId,
    query: lastUserQuery(messages),
    history_messages: messages.length,
  });

  const result = streamText({
    model: chatModel,
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
    onFinish: ({ usage, finishReason }) => {
      stopTimers();
      // `usage` in AI SDK v5 reports aggregate tokens across every step
      // (initial tool-call decision + final answer generation) — which is
      // what we want for cost tracking.
      const inputTokens =
        typeof usage?.inputTokens === "number" ? usage.inputTokens : 0;
      const outputTokens =
        typeof usage?.outputTokens === "number" ? usage.outputTokens : 0;
      if (inputTokens > 0) llmTokensTotal.inc({ type: "input" }, inputTokens);
      if (outputTokens > 0) llmTokensTotal.inc({ type: "output" }, outputTokens);
      ragRequestsTotal.inc({ status: "success" });
      logger.info("rag.pipeline.end", {
        trace_id: traceId,
        status: "success",
        finish_reason: finishReason,
        llm_ms: Math.round(performance.now() - llmStart),
        total_ms: Math.round(performance.now() - requestStart),
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      });
    },
    onError: ({ error }) => {
      stopTimers();
      ragRequestsTotal.inc({ status: "error" });
      logger.error("rag.pipeline.end", {
        trace_id: traceId,
        status: "error",
        error: error instanceof Error ? error.message : String(error),
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
