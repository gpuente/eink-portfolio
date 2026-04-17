/**
 * Sentence-aware text chunker. Splits long text into windows of approximately
 * `maxTokens` tokens with `overlap` tokens of carry-over between adjacent chunks.
 *
 * Uses a 1-token ≈ 4-character heuristic — good enough for English + Spanish.
 * No external dependencies.
 *
 * Algorithm:
 *  1. Normalize whitespace.
 *  2. Split on paragraph + sentence boundaries (preserve them).
 *  3. Greedily pack sentences into a buffer until the next would exceed maxChars.
 *  4. Emit the buffer, then start a new one seeded with the tail (overlap chars).
 */

const TOKEN_TO_CHAR_RATIO = 4;

export type ChunkOptions = {
  maxTokens?: number;
  overlap?: number;
};

export function chunkText(
  raw: string,
  { maxTokens = 600, overlap = 80 }: ChunkOptions = {},
): string[] {
  const text = raw.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) return [];

  const maxChars = maxTokens * TOKEN_TO_CHAR_RATIO;
  const overlapChars = overlap * TOKEN_TO_CHAR_RATIO;

  // Split on paragraph breaks first, then sentence boundaries within each paragraph.
  const paragraphs = text.split(/\n\n+/);
  const segments: string[] = [];
  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;
    // Sentence split: keep the punctuation. Heuristic: . ! ? followed by space + capital.
    const sentences = trimmed.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÑ¿¡(0-9])/u);
    for (const s of sentences) {
      const ss = s.trim();
      if (ss) segments.push(ss);
    }
    // Add a paragraph terminator marker so we can re-introduce double newlines.
    segments.push("\n\n");
  }

  const chunks: string[] = [];
  let buffer = "";

  const flush = () => {
    const out = buffer.trim();
    if (out) chunks.push(out);
    if (overlapChars > 0 && out.length > overlapChars) {
      // seed next buffer with the tail, snapped to the previous whitespace
      const tail = out.slice(-overlapChars);
      const snap = tail.search(/\s\S/);
      buffer = (snap >= 0 ? tail.slice(snap + 1) : tail) + " ";
    } else {
      buffer = "";
    }
  };

  for (const seg of segments) {
    if (seg === "\n\n") {
      // Paragraph boundary — append, but only if buffer is non-empty.
      if (buffer.trim()) buffer += "\n\n";
      continue;
    }
    // If the single segment alone exceeds maxChars, hard-split it.
    if (seg.length > maxChars) {
      if (buffer.trim()) flush();
      for (let i = 0; i < seg.length; i += maxChars - overlapChars) {
        chunks.push(seg.slice(i, i + maxChars).trim());
      }
      buffer = "";
      continue;
    }
    if ((buffer + " " + seg).length > maxChars) {
      flush();
    }
    buffer += (buffer && !buffer.endsWith("\n\n") ? " " : "") + seg;
  }

  if (buffer.trim()) chunks.push(buffer.trim());
  return chunks;
}
