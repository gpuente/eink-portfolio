import { readFile } from "node:fs/promises";

/**
 * Strip YAML frontmatter (--- ... ---) and return the body. The chunker
 * handles paragraph + heading splitting; we just keep the prose intact.
 */
export async function loadMarkdown(path: string): Promise<string> {
  const raw = await readFile(path, "utf8");
  return raw.replace(/^---\n[\s\S]*?\n---\n+/, "");
}
