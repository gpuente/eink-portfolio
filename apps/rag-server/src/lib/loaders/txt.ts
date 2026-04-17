import { readFile } from "node:fs/promises";

export async function loadText(path: string): Promise<string> {
  return readFile(path, "utf8");
}
