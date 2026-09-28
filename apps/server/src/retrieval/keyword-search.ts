import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { ftsQuery } from "./fts-query";

const hitRow = z.object({ rowid: z.number().int() });

// bm25() is lower for better matches.
export function keywordSearch(db: DatabaseSync, text: string, k: number) {
  const match = ftsQuery(text);
  if (match === null) return [];
  return db
    .prepare(
      "SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts) LIMIT ?",
    )
    .all(match, k)
    .map((row, index) => ({ chunkId: hitRow.parse(row).rowid, rank: index + 1 }));
}
