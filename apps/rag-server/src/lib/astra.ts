import { DataAPIClient, type VectorDoc } from "@datastax/astra-db-ts";
import { env } from "../env.ts";
import { EMBEDDING_DIMENSION } from "./openai.ts";

export const COLLECTION_NAME = "portfolio_chunks";

/** A single embedded chunk stored in Astra. */
export interface ChunkDoc extends VectorDoc {
  /** Original filename (relative to sources/). */
  source: string;
  /** Source file extension (drives display + filtering). */
  type: "pdf" | "md" | "txt";
  /** Order within the source file. */
  chunkIndex: number;
  /** Original text — sent back to the LLM as retrieved context. */
  text: string;
  /** SHA-256 of `text`. Used for de-dup if we ever switch to incremental ingest. */
  hash: string;
}

const client = new DataAPIClient();
const db = client.db(env.ASTRA_DB_API_ENDPOINT, {
  token: env.ASTRA_DB_APPLICATION_TOKEN,
  keyspace: env.ASTRA_DB_KEYSPACE,
});

/**
 * Returns the typed `portfolio_chunks` collection handle. Does NOT create it —
 * call `ensureCollection({ reset: true })` from the ingestion script first.
 */
export function getCollection() {
  return db.collection<ChunkDoc>(COLLECTION_NAME);
}

/**
 * Drops (if `reset`) and re-creates the collection with the right vector
 * dimension. Called by the ingestion script before insertMany.
 */
export async function ensureCollection({ reset = false }: { reset?: boolean } = {}) {
  if (reset) {
    try {
      await db.dropCollection(COLLECTION_NAME);
    } catch {
      // ignore — collection may not exist yet
    }
  }

  return db.createCollection<ChunkDoc>(COLLECTION_NAME, {
    vector: { dimension: EMBEDDING_DIMENSION, metric: "cosine" },
  });
}
