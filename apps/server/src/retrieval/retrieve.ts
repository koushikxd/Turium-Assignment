import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { TOP_K, VECTOR_K } from "./config";
import { vectorSearch } from "./vector-search";

const chunkRow = z.object({
  chunkId: z.number().int(),
  itemId: z.number().int(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  text: z.string(),
});

export type RetrievedChunk = z.infer<typeof chunkRow> & { vectorRank: number };

// Best first. `text` is the query itself, unused until keyword search joins in task 07.
// No status filter: chunks exist only for ready items (ARCHITECTURE §5.5).
export function retrieve(db: DatabaseSync, query: { text: string; embedding: number[] }) {
  const hits = vectorSearch(db, query.embedding, VECTOR_K).slice(0, TOP_K);
  if (hits.length === 0) return [];

  const rows = db
    .prepare(
      `SELECT c.id AS chunkId, c.item_id AS itemId, i.title, i.url, c.text
       FROM chunks c JOIN items i ON i.id = c.item_id
       WHERE c.id IN (${hits.map(() => "?").join(", ")})`,
    )
    .all(...hits.map((hit) => hit.chunkId))
    .map((row) => chunkRow.parse(row));
  const byId = new Map(rows.map((row) => [row.chunkId, row]));

  return hits.flatMap((hit) => {
    const row = byId.get(hit.chunkId);
    return row ? [{ ...row, vectorRank: hit.rank }] : [];
  });
}
