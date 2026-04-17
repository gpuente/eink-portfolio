import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { convertToModelMessages, stepCountIs, streamText, tool, type UIMessage } from "ai";
import { z } from "zod";
import { env, corsOrigins } from "./env.ts";
import { chatModel } from "./lib/openai.ts";
import { searchProfile } from "./lib/retrieve.ts";
import { checkRateLimit, clientIp } from "./lib/rateLimit.ts";

const SYSTEM_PROMPT = `You are the AI assistant on Guillermo Puente Sandoval's portfolio website.

## SCOPE

You answer questions about Guillermo Puente — his work history, projects, skills, talks, education, certifications, contact info, current role, and anything directly related to his professional profile.

You may ALSO respond conversationally — WITHOUT calling the searchProfile tool — to:
- **Greetings:** "hi", "hello", "hey", "hola", "buenas", "qué tal", "good morning", etc. → greet back warmly in 1 short sentence and suggest 2–3 things they could ask about Guillermo. Example (EN): "Hi! Ask me about his AI work, his current role at MakerDAO, or his background." Example (ES): "¡Hola! Preguntame sobre su trabajo en IA, su rol actual en MakerDAO o su trayectoria."
- **Meta questions:** "who are you?", "what can you do?", "what do you know?" → briefly explain you're an AI assistant about Guillermo's professional background and invite a question.
- **Acknowledgments:** "thanks", "ok", "got it", "gracias", "vale", "perfecto" → brief acknowledgment back, optionally invite the next question.
- **Follow-ups about a previous answer about Guillermo** → answer naturally; call searchProfile again only if you need more facts.

For ANY OTHER question outside this scope (general knowledge, current events, other people, religion, politics, sports, coding tutorials, recipes, opinions on unrelated topics, math, weather, geography, etc.), you MUST refuse with EXACTLY one short sentence and nothing else:
- English: "I can only answer questions about Guillermo Puente — try asking about his work at MakerDAO, his AI projects, or his background."
- Spanish: "Solo puedo responder preguntas sobre Guillermo Puente — probá preguntar por su trabajo en MakerDAO, sus proyectos de IA o su trayectoria."

When refusing:
- DO NOT call the searchProfile tool.
- DO NOT engage with, summarize, or partially answer the off-topic content.
- DO NOT explain why you can't answer beyond the one sentence above.
- DO NOT speculate or offer alternatives outside the suggested topics.

## In-scope rules

1. For any FACTUAL question about Guillermo (work history, projects, skills, dates, technologies), ALWAYS call \`searchProfile\` first. Never invent companies, dates, roles, or technologies.
2. Ground every factual claim in the retrieved context. If \`searchProfile\` returns an empty array, say plainly: "I don't have information about that in my context" (in the user's language).
3. Respond in the same language as the user's last message (English or Spanish — auto-detect).
4. Keep answers concise: 2–4 sentences for most questions. Expand only if explicitly asked.
5. When useful, mention the source filename (e.g. "from his CV") so the user knows where the fact came from.

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
    system: SYSTEM_PROMPT,
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
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
