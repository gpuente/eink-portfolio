import { embed } from "ai";
import { vector } from "@datastax/astra-db-ts";
import { embeddingModel } from "./openai.ts";
import { getCollection } from "./astra.ts";
import { env } from "../env.ts";

export type Hit = {
  source: string;
  type: "pdf" | "md" | "txt";
  text: string;
  similarity: number;
};

/**
 * Embed a query and run an ANN search over the `portfolio_chunks` collection.
 * Hits below `RETRIEVAL_SIMILARITY_FLOOR` are dropped — this prevents the
 * agent from being fed weak/unrelated context for off-topic questions
 * (which the system prompt should already refuse, but this is a second line).
 */
export async function searchProfile(query: string, k = 5): Promise<Hit[]> {
  const { embedding } = await embed({ model: embeddingModel, value: query });
  const collection = getCollection();

  const cursor = collection
    .find({})
    .sort({ $vector: vector(embedding) })
    .includeSimilarity(true)
    .limit(Math.min(Math.max(k, 1), 10));

  const hits: Hit[] = [];
  for await (const doc of cursor) {
    const similarity = doc.$similarity ?? 0;
    if (similarity < env.RETRIEVAL_SIMILARITY_FLOOR) continue;
    hits.push({
      source: doc.source,
      type: doc.type,
      text: doc.text,
      similarity,
    });
  }
  return hits;
}
