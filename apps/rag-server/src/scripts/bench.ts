/**
 * bench.ts — portfolio RAG server performance benchmark.
 *
 * Runs a fixture of representative queries against /chat, measures client
 * and server latency (correlating via `X-Trace-Id`), checks tool routing
 * accuracy, asserts budget, and compares against the previous run for the
 * same base URL so env comparisons never get mixed up.
 *
 * Usage:
 *   pnpm rag bench [options]
 *
 * Options:
 *   --target local|prod                 (shortcut for base-url)
 *   --base-url <url>                    (arbitrary URL; overrides --target)
 *   --concurrency <n>                   default 3
 *   --rounds <n>                        each query runs N times (default 3)
 *   --warmup <n>                        discarded requests first (default 2)
 *   --model-override <slug>             optional Gateway slug to A/B test
 *   --max-p50 <ms>                      budget for total P50 (exit 1 if over)
 *   --max-p95 <ms>                      budget for total P95 (exit 1 if over)
 *   --log-file <path>                   override local log file path
 *   --no-correlate                      skip server-side log correlation
 *   --no-save                           don't write bench-results/
 *   --no-compare                        skip comparison with previous run
 *   --format markdown|json|csv|all      default markdown (plus always JSON on save)
 *   --help
 *
 * Zero external dependencies — node:util parseArgs, node:crypto, fs/promises,
 * child_process.spawn. All the LLM-specific metrics are computed from the
 * server's own structured logs (rag.pipeline.end, rag.llm.step, rag.tool,
 * llm.routing).
 */

import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

// ──────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────

type QueryFixture = {
  id: string;
  text: string;
  category: string;
  expected_tool: string | null;
  language: "en" | "es";
};

type RequestResult = {
  query_id: string;
  round: number;
  started_at: number; // wall-clock ms (for log window narrowing)
  ttfb_ms: number;
  total_ms: number;
  bytes: number;
  trace_id?: string;
  success: boolean;
  http_status?: number;
  error?: string;
  // Enriched from server-side logs by correlating trace_id.
  server?: ServerTrace;
  tool_match?: boolean; // true = expected matched, false = mismatch, undefined = no expected
};

type ServerTrace = {
  ttft_ms: number | null;
  llm_ms: number;
  total_ms: number;
  output_tokens: number;
  input_tokens: number;
  cached_input_tokens: number;
  steps: number;
  finish_reason: string;
  tools_called: string[];
  step0_tokens_per_sec: number | null;
  step1_tokens_per_sec: number | null;
  final_provider: string | null;
  pipeline_status: "success" | "error";
};

type Stats = {
  n: number;
  min: number;
  max: number;
  mean: number;
  p50: number;
  p95: number;
  p99: number;
};

type BenchReport = {
  run_id: string;
  timestamp: string; // ISO
  target: string; // "local" / "prod" / "custom"
  base_url: string; // canonical URL actually used
  base_url_key: string; // filesystem-safe slug derived from base_url
  model_override: string | null;
  concurrency: number;
  rounds: number;
  warmup: number;
  total_requests: number;
  successful: number;
  errors: number;
  duration_ms: number; // wall-clock duration of the bench itself
  client: {
    ttfb_ms: Stats;
    total_ms: Stats;
    bytes: Stats;
  };
  server: {
    available: boolean;
    correlated: number; // how many traces we actually matched
    ttft_ms?: Stats;
    llm_ms?: Stats;
    output_tokens?: Stats;
    step0_tokens_per_sec?: Stats;
    step1_tokens_per_sec?: Stats;
    provider_distribution: Record<string, number>;
    cache_hits: number;
    cache_total: number;
  };
  tool_routing: {
    expected: number;
    matched: number;
    mismatches: Array<{ query_id: string; expected: string | null; got: string[] }>;
  };
  per_category: Record<string, { n: number; total_ms_p50: number; total_ms_p95: number }>;
  per_query: Array<{
    query_id: string;
    text: string;
    category: string;
    runs: RequestResult[];
    mean_total_ms: number;
    mean_output_tokens: number | null;
  }>;
  budget: {
    max_p50_ms: number | null;
    max_p95_ms: number | null;
    passed: boolean;
    reasons: string[];
  };
};

// ──────────────────────────────────────────────────────────────
// Argument parsing
// ──────────────────────────────────────────────────────────────

const HELP = `
pnpm rag bench — portfolio RAG server performance benchmark

  --target local|prod                shortcut: local=http://localhost:3001,
                                               prod=https://portfolio-rag-server.fly.dev
  --base-url <url>                   overrides --target with any URL
  --concurrency <n>                  parallel requests in flight (default: 3)
  --rounds <n>                       each query runs N times (default: 3)
  --warmup <n>                       discarded warmup reqs before main phase (default: 2)
  --model-override <gateway-slug>    A/B test a different chat model (e.g. alibaba/qwen-3-32b)
  --max-p50 <ms>                     fail run (exit 1) if total P50 exceeds ms
  --max-p95 <ms>                     fail run (exit 1) if total P95 exceeds ms
  --log-file <path>                  local log file path (default: /tmp/rag-server.log)
  --no-correlate                     skip server-side log correlation (client-only report)
  --no-save                          don't write the run to bench-results/
  --no-compare                       skip comparison with previous run
  --format markdown|json|csv|all     output format (default: markdown; JSON saved always if --save)
  -h, --help                         show this help
`.trim();

const args = parseArgs({
  options: {
    target: { type: "string", default: "local" },
    "base-url": { type: "string" },
    concurrency: { type: "string", default: "3" },
    rounds: { type: "string", default: "3" },
    warmup: { type: "string", default: "2" },
    "model-override": { type: "string" },
    "max-p50": { type: "string" },
    "max-p95": { type: "string" },
    "log-file": { type: "string" },
    "no-correlate": { type: "boolean", default: false },
    "no-save": { type: "boolean", default: false },
    "no-compare": { type: "boolean", default: false },
    format: { type: "string", default: "markdown" },
    help: { type: "boolean", short: "h", default: false },
  },
  allowPositionals: false,
  strict: true,
}).values;

if (args.help) {
  console.log(HELP);
  process.exit(0);
}

function resolveBaseUrl(): { url: string; target: string } {
  const raw = args["base-url"];
  if (raw) return { url: raw.replace(/\/$/, ""), target: "custom" };
  const t = args.target ?? "local";
  if (t === "local") return { url: "http://localhost:3001", target: "local" };
  if (t === "prod") return { url: "https://portfolio-rag-server.fly.dev", target: "prod" };
  // If someone passes --target with a URL, accept that too.
  if (t.startsWith("http")) return { url: t.replace(/\/$/, ""), target: "custom" };
  console.error(`Unknown --target: ${t}. Use local | prod | <url>, or use --base-url.`);
  process.exit(2);
}

const { url: BASE_URL, target: TARGET } = resolveBaseUrl();
const CONCURRENCY = Math.max(1, parseInt(args.concurrency ?? "3", 10));
const ROUNDS = Math.max(1, parseInt(args.rounds ?? "3", 10));
const WARMUP = Math.max(0, parseInt(args.warmup ?? "2", 10));
const MODEL_OVERRIDE = args["model-override"] ?? null;
const MAX_P50 = args["max-p50"] ? parseInt(args["max-p50"], 10) : null;
const MAX_P95 = args["max-p95"] ? parseInt(args["max-p95"], 10) : null;
const DEFAULT_LOG_FILE = "/tmp/rag-server.log";
const LOG_FILE = args["log-file"] ?? DEFAULT_LOG_FILE;
const CORRELATE = !args["no-correlate"];
const SAVE = !args["no-save"];
const COMPARE = !args["no-compare"];
const FORMAT = String(args.format ?? "markdown").toLowerCase() as
  | "markdown"
  | "json"
  | "csv"
  | "all";

// ──────────────────────────────────────────────────────────────
// Constants + paths
// ──────────────────────────────────────────────────────────────

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// bench-results/ lives at the rag-server app root. scripts/ is two levels deep.
const APP_ROOT = join(__dirname, "..", "..");
const RESULTS_DIR = join(APP_ROOT, "bench-results");
const FIXTURE_PATH = join(__dirname, "bench-queries.json");

// Base URL slug is used both to namespace saved results and to keep comparisons
// from mixing local/prod/custom URLs.
function urlKey(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/[^a-zA-Z0-9._-]/g, "_");
}
const BASE_URL_KEY = urlKey(BASE_URL);

// ──────────────────────────────────────────────────────────────
// Stats helpers
// ──────────────────────────────────────────────────────────────

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]!;
}

function stats(values: number[]): Stats {
  if (values.length === 0) {
    return { n: 0, min: 0, max: 0, mean: 0, p50: 0, p95: 0, p99: 0 };
  }
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  return {
    n: values.length,
    min: Math.min(...values),
    max: Math.max(...values),
    mean: Math.round(mean),
    p50: Math.round(percentile(values, 50)),
    p95: Math.round(percentile(values, 95)),
    p99: Math.round(percentile(values, 99)),
  };
}

// ──────────────────────────────────────────────────────────────
// HTTP runner
// ──────────────────────────────────────────────────────────────

async function runOne(
  query: QueryFixture,
  round: number,
  isWarmup: boolean,
): Promise<RequestResult> {
  const body = JSON.stringify({
    messages: [
      {
        id: `bench-${query.id}-${round}-${Date.now()}`,
        role: "user",
        parts: [{ type: "text", text: query.text }],
      },
    ],
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Gateway CORS allows anywhere; sending Origin keeps behaviour consistent
    // with how the real client calls the server.
    Origin: "http://localhost:4321",
  };
  if (MODEL_OVERRIDE) headers["X-LLM-Model"] = MODEL_OVERRIDE;

  const started_at = Date.now();
  const start = performance.now();
  let ttfb_ms = 0;
  let bytes = 0;
  let trace_id: string | undefined;

  try {
    const res = await fetch(`${BASE_URL}/chat`, { method: "POST", headers, body });
    ttfb_ms = Math.round(performance.now() - start);
    trace_id = res.headers.get("x-trace-id") ?? undefined;
    if (!res.ok || !res.body) {
      const text = await res.text().catch(() => "");
      return {
        query_id: query.id,
        round,
        started_at,
        ttfb_ms,
        total_ms: ttfb_ms,
        bytes: 0,
        trace_id,
        success: false,
        http_status: res.status,
        error: `HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }
    const reader = res.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) bytes += value.byteLength;
    }
    const total_ms = Math.round(performance.now() - start);
    return {
      query_id: query.id,
      round,
      started_at,
      ttfb_ms,
      total_ms,
      bytes,
      trace_id,
      success: !isWarmup, // warmup results are tagged success=false so they're filtered
      http_status: res.status,
    };
  } catch (e) {
    return {
      query_id: query.id,
      round,
      started_at,
      ttfb_ms,
      total_ms: Math.round(performance.now() - start),
      bytes,
      trace_id,
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

async function runAllConcurrent(
  queries: QueryFixture[],
  rounds: number,
  concurrency: number,
): Promise<RequestResult[]> {
  const work: { query: QueryFixture; round: number }[] = [];
  for (let r = 0; r < rounds; r++) {
    for (const q of queries) work.push({ query: q, round: r });
  }
  const results: RequestResult[] = [];
  // Simple batched concurrency — within each batch we Promise.all; between
  // batches we sequence. This is not the tightest possible scheduling but
  // plenty for ~60-90 requests and keeps the code trivial.
  for (let i = 0; i < work.length; i += concurrency) {
    const batch = work.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((w) => runOne(w.query, w.round, false)),
    );
    results.push(...batchResults);
  }
  return results;
}

async function runWarmup(queries: QueryFixture[], count: number): Promise<void> {
  if (count <= 0 || queries.length === 0) return;
  for (let i = 0; i < count; i++) {
    const q = queries[i % queries.length]!;
    await runOne(q, -1, true);
  }
}

// ──────────────────────────────────────────────────────────────
// Log correlation
// ──────────────────────────────────────────────────────────────

type ParsedLogLine = { event: string; trace_id?: string; [k: string]: unknown };

function parseJsonLines(content: string): ParsedLogLine[] {
  const out: ParsedLogLine[] = [];
  for (const line of content.split("\n")) {
    // Fly logs prefix each line with metadata before the JSON body; the
    // server itself writes pure JSON per line. Either way we scan for the
    // first `{` and try to parse from there.
    const idx = line.indexOf("{");
    if (idx === -1) continue;
    const body = line.slice(idx);
    try {
      const obj = JSON.parse(body) as ParsedLogLine;
      if (typeof obj.event === "string") out.push(obj);
    } catch {
      // Not JSON; skip.
    }
  }
  return out;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Read logs and correlate with expected trace_ids. Server-side log flush
 * is async — `onFinish` logs typically land 200-2000ms after the SSE stream
 * closes on the client. Retry a handful of times until either all traces
 * match or we give up.
 */
async function waitForTraces(
  traceIds: Set<string>,
  logSource: () => Promise<ParsedLogLine[]>,
  maxWaitMs = 8000,
  pollMs = 500,
): Promise<Map<string, ServerTrace>> {
  const deadline = Date.now() + maxWaitMs;
  let best = new Map<string, ServerTrace>();
  while (Date.now() < deadline) {
    const lines = await logSource();
    const traced = correlate(traceIds, lines);
    if (traced.size > best.size) best = traced;
    if (traced.size >= traceIds.size) return traced;
    await sleep(pollMs);
  }
  return best; // best-effort
}

async function fetchLocalLogs(logFile: string): Promise<ParsedLogLine[]> {
  try {
    const content = await readFile(logFile, "utf-8");
    return parseJsonLines(content);
  } catch (e) {
    process.stderr.write(
      `⚠️  Could not read local log file ${logFile}: ${e instanceof Error ? e.message : e}\n` +
        `   Run the server with:  pnpm --filter @portfolio/rag-server start > ${logFile}\n` +
        `   Or pass --no-correlate to skip server-side metrics.\n\n`,
    );
    return [];
  }
}

async function fetchFlyLogs(appName: string): Promise<ParsedLogLine[]> {
  return new Promise((resolve) => {
    const child = spawn("fly", ["logs", "-a", appName, "--no-tail"], {
      stdio: ["ignore", "pipe", "pipe"],
    });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (c) => chunks.push(Buffer.from(c)));
    child.on("close", () => {
      resolve(parseJsonLines(Buffer.concat(chunks).toString("utf-8")));
    });
    child.on("error", (err) => {
      process.stderr.write(
        `⚠️  fly logs failed: ${err.message}\n` +
          `   Install flyctl or pass --no-correlate to skip server-side metrics.\n\n`,
      );
      resolve([]);
    });
  });
}

/** Group log lines by trace_id and distill the fields we care about. */
function correlate(
  traceIds: Set<string>,
  lines: ParsedLogLine[],
): Map<string, ServerTrace> {
  // Group events per trace_id first.
  const perTrace = new Map<string, ParsedLogLine[]>();
  for (const l of lines) {
    const tid = l.trace_id;
    if (typeof tid !== "string" || !traceIds.has(tid)) continue;
    const arr = perTrace.get(tid) ?? [];
    arr.push(l);
    perTrace.set(tid, arr);
  }

  const out = new Map<string, ServerTrace>();
  for (const [tid, events] of perTrace) {
    const end = events.find((e) => e.event === "rag.pipeline.end");
    const steps = events.filter((e) => e.event === "rag.llm.step");
    const tools = events.filter((e) => e.event === "rag.tool" && e.status === "success");
    const routing = events.find((e) => e.event === "llm.routing");

    if (!end) continue; // Can't build a trace without the terminal event.

    const stepByIdx = new Map<number, ParsedLogLine>();
    for (const s of steps) {
      if (typeof s.step_index === "number") stepByIdx.set(s.step_index, s);
    }

    const finalProvider =
      (routing?.provider_metadata as
        | { gateway?: { routing?: { finalProvider?: string } } }
        | undefined)?.gateway?.routing?.finalProvider ?? null;

    const asNumber = (v: unknown, fallback = 0): number =>
      typeof v === "number" ? v : fallback;
    const asNullableNumber = (v: unknown): number | null =>
      typeof v === "number" ? v : null;

    out.set(tid, {
      ttft_ms: asNullableNumber(end.ttft_ms),
      llm_ms: asNumber(end.llm_ms),
      total_ms: asNumber(end.total_ms),
      output_tokens: asNumber(end.output_tokens),
      input_tokens: asNumber(end.input_tokens),
      cached_input_tokens: asNumber(end.cached_input_tokens),
      steps: asNumber(end.steps),
      finish_reason: String(end.finish_reason ?? ""),
      tools_called: tools.map((t) => String(t.tool)).filter(Boolean),
      step0_tokens_per_sec: asNullableNumber(stepByIdx.get(0)?.tokens_per_sec),
      step1_tokens_per_sec: asNullableNumber(stepByIdx.get(1)?.tokens_per_sec),
      final_provider: finalProvider,
      pipeline_status: end.status === "error" ? "error" : "success",
    });
  }
  return out;
}

// ──────────────────────────────────────────────────────────────
// Report construction
// ──────────────────────────────────────────────────────────────

type FixtureFile = { queries: QueryFixture[] };

function buildReport(
  fixture: QueryFixture[],
  results: RequestResult[],
  benchDurationMs: number,
): BenchReport {
  const successful = results.filter((r) => r.success);
  const clientTtfb = successful.map((r) => r.ttfb_ms);
  const clientTotal = successful.map((r) => r.total_ms);
  const clientBytes = successful.map((r) => r.bytes);

  const withServer = successful.filter((r) => r.server);
  const serverTtft = withServer
    .map((r) => r.server!.ttft_ms)
    .filter((x): x is number => x !== null);
  const serverLlm = withServer.map((r) => r.server!.llm_ms);
  const serverOut = withServer.map((r) => r.server!.output_tokens);
  const step0Rate = withServer
    .map((r) => r.server!.step0_tokens_per_sec)
    .filter((x): x is number => x !== null && x > 0);
  const step1Rate = withServer
    .map((r) => r.server!.step1_tokens_per_sec)
    .filter((x): x is number => x !== null && x > 0);

  const providerDist: Record<string, number> = {};
  let cacheHits = 0;
  for (const r of withServer) {
    const p = r.server?.final_provider ?? "unknown";
    providerDist[p] = (providerDist[p] ?? 0) + 1;
    if ((r.server?.cached_input_tokens ?? 0) > 0) cacheHits++;
  }

  // Tool-routing accuracy: for each run we know the expected_tool from the
  // fixture and the tools_called from the server trace.
  const fixtureById = new Map(fixture.map((q) => [q.id, q]));
  let toolExpectedCount = 0;
  let toolMatchedCount = 0;
  const mismatches: BenchReport["tool_routing"]["mismatches"] = [];
  for (const r of withServer) {
    const q = fixtureById.get(r.query_id);
    if (!q) continue;
    toolExpectedCount++;
    const expected = q.expected_tool;
    const got = r.server!.tools_called;
    const matched =
      expected === null
        ? got.length === 0
        : got.length > 0 && got.every((t) => t === expected);
    r.tool_match = matched;
    if (matched) toolMatchedCount++;
    else mismatches.push({ query_id: q.id, expected, got });
  }

  // Per-category stats.
  const perCategory: Record<
    string,
    { n: number; total_ms_p50: number; total_ms_p95: number }
  > = {};
  for (const q of fixture) {
    const runs = successful.filter((r) => r.query_id === q.id);
    if (runs.length === 0) continue;
    const cur = perCategory[q.category] ?? { n: 0, total_ms_p50: 0, total_ms_p95: 0 };
    const all = [...(cur.n ? [cur.total_ms_p50, cur.total_ms_p95] : []), ...runs.map((r) => r.total_ms)];
    perCategory[q.category] = {
      n: cur.n + runs.length,
      total_ms_p50: Math.round(percentile(all, 50)),
      total_ms_p95: Math.round(percentile(all, 95)),
    };
  }

  // Per-query breakdown.
  const perQuery = fixture
    .map((q) => {
      const runs = results.filter((r) => r.query_id === q.id);
      const ok = runs.filter((r) => r.success);
      const meanTotal =
        ok.length > 0
          ? Math.round(ok.reduce((s, r) => s + r.total_ms, 0) / ok.length)
          : 0;
      const tokenSamples = ok
        .map((r) => r.server?.output_tokens)
        .filter((x): x is number => typeof x === "number");
      const meanTokens =
        tokenSamples.length > 0
          ? Math.round(tokenSamples.reduce((s, v) => s + v, 0) / tokenSamples.length)
          : null;
      return {
        query_id: q.id,
        text: q.text,
        category: q.category,
        runs,
        mean_total_ms: meanTotal,
        mean_output_tokens: meanTokens,
      };
    })
    .filter((q) => q.runs.length > 0);

  // Budget check.
  const totalStats = stats(clientTotal);
  const budgetReasons: string[] = [];
  if (MAX_P50 !== null && totalStats.p50 > MAX_P50) {
    budgetReasons.push(`total_ms P50 ${totalStats.p50}ms > ${MAX_P50}ms`);
  }
  if (MAX_P95 !== null && totalStats.p95 > MAX_P95) {
    budgetReasons.push(`total_ms P95 ${totalStats.p95}ms > ${MAX_P95}ms`);
  }

  return {
    run_id: randomUUID(),
    timestamp: new Date().toISOString(),
    target: TARGET,
    base_url: BASE_URL,
    base_url_key: BASE_URL_KEY,
    model_override: MODEL_OVERRIDE,
    concurrency: CONCURRENCY,
    rounds: ROUNDS,
    warmup: WARMUP,
    total_requests: results.length,
    successful: successful.length,
    errors: results.length - successful.length,
    duration_ms: benchDurationMs,
    client: {
      ttfb_ms: stats(clientTtfb),
      total_ms: totalStats,
      bytes: stats(clientBytes),
    },
    server: {
      available: withServer.length > 0,
      correlated: withServer.length,
      ttft_ms: serverTtft.length > 0 ? stats(serverTtft) : undefined,
      llm_ms: serverLlm.length > 0 ? stats(serverLlm) : undefined,
      output_tokens: serverOut.length > 0 ? stats(serverOut) : undefined,
      step0_tokens_per_sec: step0Rate.length > 0 ? stats(step0Rate) : undefined,
      step1_tokens_per_sec: step1Rate.length > 0 ? stats(step1Rate) : undefined,
      provider_distribution: providerDist,
      cache_hits: cacheHits,
      cache_total: withServer.length,
    },
    tool_routing: {
      expected: toolExpectedCount,
      matched: toolMatchedCount,
      mismatches,
    },
    per_category: perCategory,
    per_query: perQuery,
    budget: {
      max_p50_ms: MAX_P50,
      max_p95_ms: MAX_P95,
      passed: budgetReasons.length === 0,
      reasons: budgetReasons,
    },
  };
}

// ──────────────────────────────────────────────────────────────
// Formatters
// ──────────────────────────────────────────────────────────────

function fmtMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  return `${ms}ms`;
}

function fmtBytes(b: number): string {
  if (b >= 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  if (b >= 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${b} B`;
}

function renderMarkdown(r: BenchReport, compare: BenchReport | null): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push(" RAG Server Benchmark");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push(` Target:         ${r.target} (${r.base_url})`);
  lines.push(` Run at:         ${r.timestamp}`);
  lines.push(
    ` Queries:        ${r.per_query.length} × ${r.rounds} rounds (+ ${r.warmup} warmup)`,
  );
  lines.push(` Concurrency:    ${r.concurrency}`);
  lines.push(
    ` Total reqs:     ${r.total_requests}  (✓ ${r.successful}  ✗ ${r.errors})`,
  );
  lines.push(` Wall time:      ${fmtMs(r.duration_ms)}`);
  lines.push(` Model override: ${r.model_override ?? "(default)"}`);
  lines.push("");

  lines.push("─── Client-side ──────────────────────────────────────────────");
  lines.push("                 p50      p95      p99      min      max");
  const c = r.client;
  lines.push(
    ` TTFB         ${pad(fmtMs(c.ttfb_ms.p50))} ${pad(fmtMs(c.ttfb_ms.p95))} ${pad(fmtMs(c.ttfb_ms.p99))} ${pad(fmtMs(c.ttfb_ms.min))} ${pad(fmtMs(c.ttfb_ms.max))}`,
  );
  lines.push(
    ` Total        ${pad(fmtMs(c.total_ms.p50))} ${pad(fmtMs(c.total_ms.p95))} ${pad(fmtMs(c.total_ms.p99))} ${pad(fmtMs(c.total_ms.min))} ${pad(fmtMs(c.total_ms.max))}`,
  );
  lines.push(
    ` Bytes        ${pad(fmtBytes(c.bytes.p50))} ${pad(fmtBytes(c.bytes.p95))} ${pad(fmtBytes(c.bytes.p99))} ${pad(fmtBytes(c.bytes.min))} ${pad(fmtBytes(c.bytes.max))}`,
  );
  lines.push("");

  if (r.server.available) {
    lines.push(
      `─── Server-side (${r.server.correlated}/${r.successful} correlated via trace_id) ────`,
    );
    lines.push("                 p50      p95      p99      min      max");
    const s = r.server;
    if (s.ttft_ms) {
      lines.push(
        ` TTFT         ${pad(fmtMs(s.ttft_ms.p50))} ${pad(fmtMs(s.ttft_ms.p95))} ${pad(fmtMs(s.ttft_ms.p99))} ${pad(fmtMs(s.ttft_ms.min))} ${pad(fmtMs(s.ttft_ms.max))}`,
      );
    }
    if (s.llm_ms) {
      lines.push(
        ` llm_ms       ${pad(fmtMs(s.llm_ms.p50))} ${pad(fmtMs(s.llm_ms.p95))} ${pad(fmtMs(s.llm_ms.p99))} ${pad(fmtMs(s.llm_ms.min))} ${pad(fmtMs(s.llm_ms.max))}`,
      );
    }
    if (s.output_tokens) {
      lines.push(
        ` Output toks  ${pad(String(s.output_tokens.p50))} ${pad(String(s.output_tokens.p95))} ${pad(String(s.output_tokens.p99))} ${pad(String(s.output_tokens.min))} ${pad(String(s.output_tokens.max))}`,
      );
    }
    if (s.step0_tokens_per_sec) {
      lines.push(
        ` step_0 tok/s ${pad(String(s.step0_tokens_per_sec.p50))} ${pad(String(s.step0_tokens_per_sec.p95))} ${pad(String(s.step0_tokens_per_sec.p99))} ${pad(String(s.step0_tokens_per_sec.min))} ${pad(String(s.step0_tokens_per_sec.max))}`,
      );
    }
    if (s.step1_tokens_per_sec) {
      lines.push(
        ` step_1 tok/s ${pad(String(s.step1_tokens_per_sec.p50))} ${pad(String(s.step1_tokens_per_sec.p95))} ${pad(String(s.step1_tokens_per_sec.p99))} ${pad(String(s.step1_tokens_per_sec.min))} ${pad(String(s.step1_tokens_per_sec.max))}`,
      );
    }
    lines.push("");
    const total = s.cache_total || 1;
    lines.push(
      ` Cache hits:     ${s.cache_hits}/${s.cache_total}  (${Math.round((s.cache_hits / total) * 100)}%)`,
    );
    const provLine = Object.entries(s.provider_distribution)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => `${k} ${v}/${s.correlated}`)
      .join("  ·  ");
    lines.push(` Provider:       ${provLine || "(none)"}`);
    lines.push("");
  } else {
    lines.push("─── Server-side ─────────────────────────────────────────────");
    lines.push(" (no traces correlated — logs unavailable or --no-correlate used)");
    lines.push("");
  }

  // Tool-routing accuracy.
  const tr = r.tool_routing;
  if (tr.expected > 0) {
    lines.push("─── Tool routing accuracy ────────────────────────────────────");
    const pct = Math.round((tr.matched / tr.expected) * 100);
    lines.push(` Matched:  ${tr.matched}/${tr.expected}  (${pct}%)`);
    if (tr.mismatches.length > 0) {
      lines.push(" Mismatches:");
      for (const m of tr.mismatches.slice(0, 8)) {
        const got = m.got.length > 0 ? m.got.join(", ") : "(no tool)";
        lines.push(`   · ${m.query_id}: expected ${m.expected ?? "(no tool)"}, got ${got}`);
      }
      if (tr.mismatches.length > 8) {
        lines.push(`   · … (${tr.mismatches.length - 8} more)`);
      }
    }
    lines.push("");
  }

  // Per-category.
  const cats = Object.entries(r.per_category);
  if (cats.length > 0) {
    lines.push("─── Per-category ────────────────────────────────────────────");
    lines.push(" category       n     total p50   total p95");
    for (const [cat, s] of cats) {
      lines.push(
        ` ${cat.padEnd(14)} ${String(s.n).padEnd(5)} ${fmtMs(s.total_ms_p50).padEnd(11)} ${fmtMs(s.total_ms_p95)}`,
      );
    }
    lines.push("");
  }

  // Comparison.
  if (compare) {
    lines.push("─── Comparison with last run ─────────────────────────────────");
    lines.push(` Previous: ${compare.timestamp}  (same base_url)`);
    lines.push("");
    lines.push(comparisonLine("Total p50", compare.client.total_ms.p50, r.client.total_ms.p50, "ms"));
    lines.push(comparisonLine("Total p95", compare.client.total_ms.p95, r.client.total_ms.p95, "ms"));
    lines.push(comparisonLine("TTFB p50", compare.client.ttfb_ms.p50, r.client.ttfb_ms.p50, "ms"));
    if (r.server.available && compare.server.available) {
      if (r.server.ttft_ms && compare.server.ttft_ms) {
        lines.push(
          comparisonLine("TTFT p50", compare.server.ttft_ms.p50, r.server.ttft_ms.p50, "ms"),
        );
      }
      if (r.server.step1_tokens_per_sec && compare.server.step1_tokens_per_sec) {
        lines.push(
          comparisonLine(
            "step_1 tok/s p50",
            compare.server.step1_tokens_per_sec.p50,
            r.server.step1_tokens_per_sec.p50,
            "tok/s",
            true,
          ),
        );
      }
    }
    lines.push("");
  }

  // Budget.
  if (r.budget.max_p50_ms !== null || r.budget.max_p95_ms !== null) {
    lines.push("─── Budget check ────────────────────────────────────────────");
    if (r.budget.max_p50_ms !== null) {
      const ok = r.client.total_ms.p50 <= r.budget.max_p50_ms;
      lines.push(
        ` Max P50 total: ${r.budget.max_p50_ms}ms   Actual: ${r.client.total_ms.p50}ms   ${ok ? "✓ PASS" : "✗ FAIL"}`,
      );
    }
    if (r.budget.max_p95_ms !== null) {
      const ok = r.client.total_ms.p95 <= r.budget.max_p95_ms;
      lines.push(
        ` Max P95 total: ${r.budget.max_p95_ms}ms   Actual: ${r.client.total_ms.p95}ms   ${ok ? "✓ PASS" : "✗ FAIL"}`,
      );
    }
    lines.push("");
  }

  return lines.join("\n");
}

function pad(s: string, n = 8): string {
  return s.padEnd(n);
}

function comparisonLine(
  label: string,
  prior: number,
  now: number,
  unit: string,
  higherIsBetter = false,
): string {
  const delta = now - prior;
  const pct = prior === 0 ? 0 : Math.round((delta / prior) * 100);
  const arrow = delta === 0 ? "—" : delta > 0 ? "▲" : "▼";
  const improved = higherIsBetter ? delta > 0 : delta < 0;
  const mark = delta === 0 ? " " : improved ? "✓" : "✗";
  const fmt = (v: number) => (unit === "ms" ? fmtMs(v) : `${v} ${unit}`);
  return ` ${label.padEnd(18)} ${fmt(prior).padEnd(8)} → ${fmt(now).padEnd(8)}  ${arrow} ${pct > 0 ? "+" : ""}${pct}%  ${mark}`;
}

function renderCsv(r: BenchReport): string {
  const header = [
    "query_id",
    "text",
    "category",
    "round",
    "success",
    "ttfb_ms",
    "total_ms",
    "bytes",
    "trace_id",
    "server_ttft_ms",
    "server_llm_ms",
    "server_output_tokens",
    "server_step1_tok_per_sec",
    "server_final_provider",
    "tools_called",
    "tool_match",
    "error",
  ];
  const rows = [header.join(",")];
  for (const q of r.per_query) {
    for (const run of q.runs) {
      const s = run.server;
      rows.push(
        [
          q.query_id,
          JSON.stringify(q.text),
          q.category,
          String(run.round),
          String(run.success),
          String(run.ttfb_ms),
          String(run.total_ms),
          String(run.bytes),
          run.trace_id ?? "",
          s?.ttft_ms ?? "",
          s?.llm_ms ?? "",
          s?.output_tokens ?? "",
          s?.step1_tokens_per_sec ?? "",
          s?.final_provider ?? "",
          JSON.stringify(s?.tools_called.join("|") ?? ""),
          run.tool_match === undefined ? "" : String(run.tool_match),
          JSON.stringify(run.error ?? ""),
        ].join(","),
      );
    }
  }
  return rows.join("\n");
}

// ──────────────────────────────────────────────────────────────
// Persistence
// ──────────────────────────────────────────────────────────────

async function findLastReport(baseUrlKey: string): Promise<BenchReport | null> {
  const dir = join(RESULTS_DIR, baseUrlKey);
  let entries: string[] = [];
  try {
    entries = await readdir(dir);
  } catch {
    return null;
  }
  const jsonFiles = entries.filter((e) => e.endsWith(".json")).sort().reverse();
  if (jsonFiles.length === 0) return null;
  try {
    const content = await readFile(join(dir, jsonFiles[0]!), "utf-8");
    return JSON.parse(content) as BenchReport;
  } catch {
    return null;
  }
}

async function saveReport(r: BenchReport): Promise<string> {
  const dir = join(RESULTS_DIR, r.base_url_key);
  await mkdir(dir, { recursive: true });
  const fname = r.timestamp.replace(/[:.]/g, "-") + ".json";
  const path = join(dir, fname);
  await writeFile(path, JSON.stringify(r, null, 2), "utf-8");
  return path;
}

// ──────────────────────────────────────────────────────────────
// Main
// ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // Load fixture.
  const fixtureRaw = await readFile(FIXTURE_PATH, "utf-8");
  const fixture = (JSON.parse(fixtureRaw) as FixtureFile).queries;

  process.stdout.write(
    `\nRunning bench against ${BASE_URL}  (target=${TARGET}, ${fixture.length} queries × ${ROUNDS} rounds, concurrency=${CONCURRENCY})\n`,
  );
  if (MODEL_OVERRIDE) process.stdout.write(`Model override: ${MODEL_OVERRIDE}\n`);

  // Quick health probe before firing the full bench.
  try {
    const probe = await fetch(`${BASE_URL}/health`);
    if (!probe.ok) throw new Error(`HTTP ${probe.status}`);
  } catch (e) {
    console.error(`✗ /health probe failed: ${e instanceof Error ? e.message : e}`);
    console.error(`  Is the server running at ${BASE_URL} ?`);
    process.exit(2);
  }

  const t0 = performance.now();
  if (WARMUP > 0) {
    process.stdout.write(`Warmup (${WARMUP} reqs)… `);
    await runWarmup(fixture, WARMUP);
    process.stdout.write("done\n");
  }
  process.stdout.write(`Running ${fixture.length * ROUNDS} requests… `);
  const results = await runAllConcurrent(fixture, ROUNDS, CONCURRENCY);
  process.stdout.write("done\n");
  const benchDuration = Math.round(performance.now() - t0);

  // Log correlation.
  if (CORRELATE) {
    const traceIds = new Set(
      results.map((r) => r.trace_id).filter((x): x is string => !!x),
    );
    if (traceIds.size > 0) {
      process.stdout.write(`Correlating ${traceIds.size} trace ids with logs… `);
      const logSource =
        TARGET === "prod"
          ? () => fetchFlyLogs("portfolio-rag-server")
          : () => fetchLocalLogs(LOG_FILE);
      // Server-side pipeline.end logs flush ~200-2000ms after the SSE stream
      // closes on the client side. Retry until we've matched all ids or we
      // time out.
      const traced = await waitForTraces(traceIds, logSource);
      for (const r of results) {
        if (r.trace_id) {
          const t = traced.get(r.trace_id);
          if (t) r.server = t;
        }
      }
      process.stdout.write(`matched ${traced.size}/${traceIds.size}\n`);
    }
  }

  const report = buildReport(fixture, results, benchDuration);

  // Comparison (before save so the comparison file is the PREVIOUS one).
  let prev: BenchReport | null = null;
  if (COMPARE) prev = await findLastReport(BASE_URL_KEY);

  // Save.
  if (SAVE) {
    const saved = await saveReport(report);
    report.budget.reasons.push(`saved: ${saved}`);
  }

  // Output.
  if (FORMAT === "markdown" || FORMAT === "all") {
    process.stdout.write(renderMarkdown(report, prev));
  }
  if (FORMAT === "json" || FORMAT === "all") {
    process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  }
  if (FORMAT === "csv" || FORMAT === "all") {
    process.stdout.write(renderCsv(report) + "\n");
  }

  // Exit code.
  if (!report.budget.passed) {
    console.error(`\n✗ Budget failed:\n  · ${report.budget.reasons.filter((r) => !r.startsWith("saved:")).join("\n  · ")}`);
    process.exit(1);
  }
  if (report.errors > 0) {
    console.error(`\n✗ ${report.errors} request(s) failed`);
    process.exit(1);
  }
  process.exit(0);
}

main().catch((err) => {
  console.error("Bench failed:", err);
  process.exit(2);
});
