import { extname } from "node:path";
import { loadMarkdown } from "./md.ts";
import { loadText } from "./txt.ts";
import { loadPdf } from "./pdf.ts";

export type SourceType = "md" | "txt" | "pdf";

export type LoadedSource = {
  type: SourceType;
  text: string;
};

/** Returns null for unsupported extensions; the ingest script skips those. */
export async function loadSource(path: string): Promise<LoadedSource | null> {
  const ext = extname(path).toLowerCase();
  switch (ext) {
    case ".md":
    case ".markdown":
      return { type: "md", text: await loadMarkdown(path) };
    case ".txt":
      return { type: "txt", text: await loadText(path) };
    case ".pdf":
      return { type: "pdf", text: await loadPdf(path) };
    default:
      return null;
  }
}

export const SUPPORTED_EXTENSIONS = [".md", ".markdown", ".txt", ".pdf"] as const;
