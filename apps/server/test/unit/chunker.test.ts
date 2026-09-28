import { describe, expect, test } from "vitest";

import { chunk } from "../../src/ingestion/chunker";

// 400 target tokens + a merged tail under 100 tokens + 60 overlap tokens, at 4 chars per token.
const MAX_CHUNK_CHARS = 2000;

const sentence = (n: number) => `Sentence ${n} explains topic ${n} in a little more detail.`;
const sentences = (from: number, count: number) =>
  Array.from({ length: count }, (_, i) => sentence(from + i));
const paragraph = (from: number, count: number) => sentences(from, count).join(" ");

// Ten paragraphs of about 350 chars each.
const paragraphs = Array.from({ length: 10 }, (_, p) => paragraph(p * 6, 6));
const prose = paragraphs.join("\n\n");

// Each chunk's position in the source, found in order so repeated text cannot mismatch.
function positions(text: string, chunks: string[]) {
  let from = 0;
  return chunks.map((piece) => {
    const at = text.indexOf(piece, from);
    expect(at, `chunk not found in source: ${piece.slice(0, 40)}`).toBeGreaterThanOrEqual(0);
    from = at + 1;
    return at;
  });
}

describe("chunk", () => {
  test("empty or whitespace-only input gives no chunks", () => {
    expect(chunk("")).toEqual([]);
    expect(chunk("  \n\n\t ")).toEqual([]);
  });

  test("a short note is one chunk equal to the trimmed text", () => {
    expect(chunk("  Buy milk.\nCall Sam.  \n")).toEqual(["Buy milk.\nCall Sam."]);
  });

  test("paragraphs that fit are never cut mid-paragraph", () => {
    const chunks = chunk(prose);
    expect(chunks.length).toBeGreaterThan(1);
    for (const text of paragraphs) {
      expect(chunks.some((piece) => piece.includes(text))).toBe(true);
    }
  });

  test("one long paragraph splits at sentence ends", () => {
    const chunks = chunk(paragraph(0, 80));
    expect(chunks.length).toBeGreaterThan(1);
    for (const piece of chunks) expect(piece).toMatch(/\.$/);
  });

  test("one huge unbroken token is hard-cut", () => {
    const text = "x".repeat(5000);
    const chunks = chunk(text);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("").length).toBeGreaterThanOrEqual(text.length);
  });

  test("every chunk stays within the size bound", () => {
    const text = [prose, paragraph(100, 80), "y".repeat(5000), prose].join("\n\n");
    for (const piece of chunk(text)) expect(piece.length).toBeLessThan(MAX_CHUNK_CHARS);
  });

  test("no sentence of the input is lost", () => {
    const text = [prose, paragraph(100, 80)].join("\n\n");
    const chunks = chunk(text);
    for (const line of [...sentences(0, 60), ...sentences(100, 80)]) {
      expect(
        chunks.some((piece) => piece.includes(line)),
        line,
      ).toBe(true);
    }
  });

  test("consecutive chunks overlap with real source text", () => {
    const chunks = chunk(prose);
    positions(prose, chunks);
    for (let i = 1; i < chunks.length; i++) {
      const head = chunks[i]?.slice(0, 40) ?? "";
      expect(chunks[i - 1]).toContain(head);
    }
  });

  test("the overlap never starts mid-word", () => {
    const text = paragraph(0, 80);
    const chunks = chunk(text);
    for (const at of positions(text, chunks).slice(1)) {
      expect(text[at - 1]).toMatch(/\s/);
    }
  });

  test("a small tail merges into the previous chunk", () => {
    // About 1,520 chars: one full body plus a tail well under the minimum.
    const text = paragraph(0, 28);
    expect(text.length).toBeGreaterThan(1360);
    expect(chunk(text)).toEqual([text]);
  });

  test("CRLF input chunks the same as LF input", () => {
    expect(chunk(prose.replaceAll("\n", "\r\n"))).toEqual(chunk(prose));
  });

  test("runs of blank lines produce no empty chunks", () => {
    const text = paragraphs.join("\n\n\n\n\n\n");
    const chunks = chunk(text);
    for (const piece of chunks) expect(piece.trim()).not.toBe("");
    expect(chunks.every((piece) => piece === piece.trim())).toBe(true);
  });

  test("output is deterministic", () => {
    expect(chunk(prose)).toEqual(chunk(prose));
  });
});
