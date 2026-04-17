import { z } from "zod";

const EnvSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, "OPENAI_API_KEY is required"),
  ASTRA_DB_APPLICATION_TOKEN: z.string().min(1, "ASTRA_DB_APPLICATION_TOKEN is required"),
  ASTRA_DB_API_ENDPOINT: z.string().url("ASTRA_DB_API_ENDPOINT must be a valid URL"),
  ASTRA_DB_KEYSPACE: z.string().default("default_keyspace"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:4321"),

  // Guardrails — all optional, sensible defaults
  RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(30),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().default(10),
  MAX_OUTPUT_TOKENS: z.coerce.number().int().positive().default(500),
  RETRIEVAL_SIMILARITY_FLOOR: z.coerce.number().min(0).max(1).default(0.4),

  // GitHub (for the getGithubActivity agent tool).
  // Both optional: if GITHUB_TOKEN is absent we hit the public API (60 req/h per IP).
  GITHUB_USERNAME: z.string().default("gpuente"),
  GITHUB_TOKEN: z.string().optional(),

  // Calendly (for the check-availability + book-slot agent tools)
  CALENDLY_PAT: z.string().min(1, "CALENDLY_PAT is required"),
  CALENDLY_USER_URI: z.string().url("CALENDLY_USER_URI must be a valid URL"),
  CALENDLY_EVENT_TYPE_URI: z.string().url("CALENDLY_EVENT_TYPE_URI must be a valid URL"),
  CALENDLY_SCHEDULING_URL: z.string().url("CALENDLY_SCHEDULING_URL must be a valid URL"),
  // IANA timezone used as the default when the caller/user doesn't supply one.
  // This is Guillermo's timezone; the bookSlot tool accepts a per-request override.
  CALENDLY_DEFAULT_TZ: z.string().default("America/Santiago"),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((i) => `  · ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  console.error(
    `\n[rag-server] env validation failed. Copy .env.example → .env and fill in:\n${issues}\n`,
  );
  process.exit(1);
}

export const env = parsed.data;

/** Comma-separated list of allowed origins for CORS. */
export const corsOrigins = env.CORS_ORIGIN.split(",").map((s) => s.trim()).filter(Boolean);
