import { createHash } from "node:crypto";
import { readdir } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { embedMany } from "ai";
import { vector } from "@datastax/astra-db-ts";
import { embeddingModel } from "../lib/openai.ts";
import { ensureCollection, COLLECTION_NAME, type ChunkDoc } from "../lib/astra.ts";
import { chunkText } from "../lib/chunk.ts";
import { loadSource, SUPPORTED_EXTENSIONS } from "../lib/loaders/index.ts";

const SOURCES_DIR = fileURLToPath(new URL("../../sources/", import.meta.url));
const EMBED_BATCH = 96; // OpenAI embedding API supports up to ~2048 inputs; keep modest for memory + retries

const args = new Set(process.argv.slice(2));
const reset = !args.has("--no-reset"); // default: full re-index

async function listFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue; // skip .gitkeep, .DS_Store, etc
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await listFiles(full)));
    } else if (
      entry.isFile() &&
      SUPPORTED_EXTENSIONS.some((ext) => entry.name.toLowerCase().endsWith(ext))
    ) {
      out.push(full);
    }
  }
  return out;
}

function sha256(s: string): string {
  return createHash("sha256").update(s).digest("hex");
}

async function main(): Promise<void> {
  console.log(`[ingest] sources dir: ${SOURCES_DIR}`);
  console.log(`[ingest] mode: ${reset ? "RESET (drop + recreate)" : "append"}`);

  const files = await listFiles(SOURCES_DIR);
  if (files.length === 0) {
    console.warn(
      `[ingest] no files in sources/ — drop .md, .txt, or .pdf files in ${SOURCES_DIR} and re-run.`,
    );
    return;
  }
  console.log(`[ingest] found ${files.length} file(s)`);

  // 1. Load + chunk every file
  const docs: Omit<ChunkDoc, "$vector">[] = [];
  for (const path of files) {
    const rel = relative(SOURCES_DIR, path);
    const loaded = await loadSource(path);
    if (!loaded) {
      console.warn(`[ingest] skip (unsupported): ${rel}`);
      continue;
    }
    const chunks = chunkText(loaded.text);
    chunks.forEach((text, i) => {
      docs.push({
        source: rel,
        type: loaded.type,
        chunkIndex: i,
        text,
        hash: sha256(text),
      });
    });
    console.log(`[ingest]   ${rel}: ${chunks.length} chunk(s)`);
  }

  if (docs.length === 0) {
    console.warn("[ingest] no chunks produced — sources are empty after parsing.");
    return;
  }
  console.log(`[ingest] total chunks to embed: ${docs.length}`);

  // 2. Embed in batches
  const embeddings: number[][] = [];
  for (let i = 0; i < docs.length; i += EMBED_BATCH) {
    const slice = docs.slice(i, i + EMBED_BATCH);
    const { embeddings: batch } = await embedMany({
      model: embeddingModel,
      values: slice.map((d) => d.text),
    });
    embeddings.push(...batch);
    console.log(`[ingest]   embedded ${Math.min(i + slice.length, docs.length)}/${docs.length}`);
  }

  // 3. Reset + recreate the collection
  const collection = await ensureCollection({ reset });
  console.log(`[ingest] collection ready: ${COLLECTION_NAME}`);

  // 4. Insert
  const rows: ChunkDoc[] = docs.map((d, i) => ({
    ...d,
    $vector: vector(embeddings[i]!),
  }));

  // insertMany has a per-call doc limit (~100); chunk to be safe
  const INSERT_BATCH = 50;
  for (let i = 0; i < rows.length; i += INSERT_BATCH) {
    const slice = rows.slice(i, i + INSERT_BATCH);
    await collection.insertMany(slice);
    console.log(`[ingest]   inserted ${Math.min(i + slice.length, rows.length)}/${rows.length}`);
  }

  const approxTokens = docs.reduce((sum, d) => sum + Math.ceil(d.text.length / 4), 0);
  console.log(
    `[ingest] DONE — files: ${files.length}, chunks: ${docs.length}, ~${approxTokens.toLocaleString()} tokens embedded.`,
  );
}

main().catch((err) => {
  console.error("[ingest] failed:", err);
  process.exit(1);
});
