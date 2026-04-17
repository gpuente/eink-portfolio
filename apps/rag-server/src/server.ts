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

2. **\`bookSlot({ startTime, timezone? })\`** — generates a one-click booking link with the day + time already pre-selected. **DO NOT ASK THE USER FOR NAME OR EMAIL** — they'll enter those once on the Calendly page. All you need is: (a) the slot the user picked (must come from a prior checkAvailability call), and (b) optionally their timezone if they mentioned one.

**Booking flow:**
- User asks availability → call \`checkAvailability\`, then offer up to ~5 slots by local time.
- User picks a slot ("the 2pm one works") → call \`bookSlot\` immediately with that \`startTime\`. Don't ask follow-up questions about name/email.
- The tool returns a URL like \`calendly.com/d/xxxx/-/2026-04-30T14:00:00-04:00?month=…\`. Share it with a brief one-line message like: *"Here's your link — one click: [Book Mon Apr 20, 2:00 PM](URL). Name + email on the Calendly page and you're done."*

**Handling the \`bookSlot\` outcome field:**
- \`"ready"\`: Share \`bookingUrl\` with the \`startTimeLocal\` label as above. Keep it to 1–2 sentences.
- \`"error"\`: Something went wrong. Apologize briefly in 1 sentence, share the \`fallbackUrl\` (public scheduling page), and suggest trying another slot or checking availability again.

**Guardrails:**
- Never invent slots. Only propose times that \`checkAvailability\` returned.
- Don't collect name/email in chat — that's an anti-pattern here (Calendly re-asks, annoys the user).
- Don't call \`bookSlot\` on speculative times the user only *mentioned* — wait for them to confirm the slot they want.

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

app.get("/health", (c) => c.json({ ok: true, service: "rag-server" }));

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
        execute: async ({ query, k }) => searchProfile(query, k),
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
        execute: async ({ startDate, endDate, displayTimezone }) => {
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
          const safeStart = start.getTime() < Date.now() ? new Date(Date.now() + 60_000) : start;
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
        },
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
        execute: async ({ kind }) => {
          try {
            return await getGithubInfo(kind);
          } catch (e) {
            return {
              error: e instanceof Error ? e.message : "Unknown error",
              profileUrl: `https://github.com/${env.GITHUB_USERNAME}`,
            };
          }
        },
      }),

      bookSlot: tool({
        description:
          "Generate a one-click booking link for a specific 30-min slot on Guillermo's calendar. The link lands the user on Calendly's page with the day + time already selected — they only fill name/email there, once. Call this AFTER checkAvailability returned the slot AND the user has clearly picked it. Do NOT ask the user for name or email — Calendly handles that on its own page.",
        inputSchema: z.object({
          startTime: z
            .string()
            .describe(
              "ISO 8601 UTC timestamp of the slot — must exactly match one the checkAvailability tool returned.",
            ),
          timezone: z
            .string()
            .optional()
            .describe(
              "Invitee's IANA timezone (e.g. 'America/New_York'). Determines how the preselected time is rendered on the Calendly page. Defaults to 'America/Santiago'.",
            ),
        }),
        execute: async ({ startTime, timezone }) => {
          const tz = timezone ?? env.CALENDLY_DEFAULT_TZ;
          try {
            const result = await bookSlot({ startTime, timezone });
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
        },
      }),
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
