/**
 * Minimal structured JSON logger. Writes to stdout (info/warn) and stderr
 * (error) so Fly's machine runtime picks each line up and forwards it to
 * VictoriaLogs. No dependencies — `console.log` on Node emits to process.stdout
 * as a single line, which is exactly what VictoriaLogs expects.
 *
 * Shape: `{ level, event, ts, ...fields }`.
 *   - `level` — "info" | "warn" | "error" (used for filtering in Grafana).
 *   - `event` — short dotted name, e.g. "rag.pipeline.start".
 *   - `ts` — epoch ms (Date.now()); VictoriaLogs reads it as a number.
 *   - `...fields` — arbitrary extra fields; always include `trace_id` when
 *     the log belongs to a traced RAG pipeline run so the entire request
 *     can be reconstructed with `{trace_id="…"}` in Grafana.
 *
 * A single JSON.stringify errors cheaply surface the field that failed (most
 * often a circular reference). We wrap it so a bad payload never takes the
 * process down — we fall back to a truncated string form of the value.
 */
type Fields = Record<string, unknown>;

function safeStringify(obj: unknown): string {
  try {
    return JSON.stringify(obj);
  } catch {
    // Fall back to a best-effort serialization that drops circular refs and
    // unserializable values. This only runs on the sad path, so we accept
    // the cost of a second pass.
    const seen = new WeakSet();
    return JSON.stringify(obj, (_k, v) => {
      if (typeof v === "object" && v !== null) {
        if (seen.has(v as object)) return "[Circular]";
        seen.add(v as object);
      }
      if (typeof v === "bigint") return v.toString();
      return v;
    });
  }
}

function emit(level: "info" | "warn" | "error", event: string, fields: Fields): void {
  const line = safeStringify({ level, event, ts: Date.now(), ...fields });
  // Emit everything (including errors) to stdout. Fly / VictoriaLogs treats
  // both streams the same, and keeping a single stream lets local bench
  // correlation work with just `server > /tmp/rag-server.log` without
  // worrying about stderr redirection order.
  console.log(line);
}

export const logger = {
  info: (event: string, fields: Fields = {}) => emit("info", event, fields),
  warn: (event: string, fields: Fields = {}) => emit("warn", event, fields),
  error: (event: string, fields: Fields = {}) => emit("error", event, fields),
};
