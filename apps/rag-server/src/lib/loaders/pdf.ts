import { readFile } from "node:fs/promises";
import pdf from "pdf-parse";

export async function loadPdf(path: string): Promise<string> {
  const buf = await readFile(path);
  const result = await pdf(buf);
  return result.text;
}
