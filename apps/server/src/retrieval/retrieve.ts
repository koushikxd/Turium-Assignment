import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { KEYWORD_K, TOP_K, VECTOR_K } from "./config";
import { keywordSearch, vectorSearch } from "./chunk-index";
import { rrf } from "./rrf";

const chunkRow = z.object({
  chunkId: z.number().int(),
  itemId: z.number().int(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  text: z.string(),
});

export type RetrievedChunk = z.infer<typeof chunkRow> & {
  vectorRank: number | null;
  keywordRank: number | null;
  score: number;
};

// The eval turns keyword search off for its vector-only arm (ARCHITECTURE §10).
type RetrieveOptions = { keyword: boolean; limit: number };

// Best first. No status filter: chunks exist only for ready items (ARCHITECTURE §5.5).
export function retrieve(
  db: DatabaseSync,
  query: { text: string; embedding: number[] },
  options: RetrieveOptions = { keyword: true, limit: TOP_K },
) {
  const rankings = [vectorSearch(db, query.embedding, VECTOR_K)];
  if (options.keyword) rankings.push(keywordSearch(db, query.text, KEYWORD_K));
  const hits = rrf(rankings).slice(0, options.limit);
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

  return hits.flatMap((hit): RetrievedChunk[] => {
    const row = byId.get(hit.chunkId);
    const [vectorRank = null, keywordRank = null] = hit.ranks;
    return row ? [{ ...row, vectorRank, keywordRank, score: hit.score }] : [];
  });
}
