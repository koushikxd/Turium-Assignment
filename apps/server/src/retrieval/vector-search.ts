import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const hitRow = z.object({ rowid: z.number().int(), distance: z.number() });

// Exact KNN, nearest first. Rank is 1-based, the input RRF needs (task 07).
export function vectorSearch(db: DatabaseSync, embedding: number[], k: number) {
  return db
    .prepare("SELECT rowid, distance FROM chunk_vectors WHERE embedding MATCH ? AND k = ?")
    .all(new Float32Array(embedding), BigInt(k))
    .map((row, index) => ({ chunkId: hitRow.parse(row).rowid, rank: index + 1 }));
}
