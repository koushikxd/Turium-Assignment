import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { ftsQuery } from "./fts-query";

// The only module that touches chunk_vectors and chunks_fts.

// Runs inside the caller's transaction, after the item flipped to ready.
export function writeChunks(
  db: DatabaseSync,
  itemId: number,
  texts: string[],
  embeddings: number[][],
) {
  const insertChunk = db.prepare("INSERT INTO chunks (item_id, ordinal, text) VALUES (?, ?, ?)");
  const insertVector = db.prepare("INSERT INTO chunk_vectors (rowid, embedding) VALUES (?, ?)");
  const insertFts = db.prepare("INSERT INTO chunks_fts (rowid, body) VALUES (?, ?)");
  for (const [ordinal, text] of texts.entries()) {
    // vec0 rejects a rowid bound as a JS number (ARCHITECTURE §4).
    const chunkId = BigInt(insertChunk.run(itemId, ordinal, text).lastInsertRowid);
    insertVector.run(chunkId, new Float32Array(embeddings[ordinal] ?? []));
    insertFts.run(chunkId, text);
  }
}

// Virtual tables ignore foreign keys, so their rows go first, by chunk id.
// The cascade then removes the chunks with the item. Runs inside the caller's
// transaction, before the item delete.
export function deleteChunks(db: DatabaseSync, itemId: number) {
  const chunkIds = "SELECT id FROM chunks WHERE item_id = ?";
  db.prepare(`DELETE FROM chunk_vectors WHERE rowid IN (${chunkIds})`).run(itemId);
  db.prepare(`DELETE FROM chunks_fts WHERE rowid IN (${chunkIds})`).run(itemId);
}

const vectorHitRow = z.object({ rowid: z.number().int(), distance: z.number() });

// Exact KNN, nearest first. Rank is 1-based, the input RRF needs (ARCHITECTURE §6).
export function vectorSearch(db: DatabaseSync, embedding: number[], k: number) {
  return db
    .prepare("SELECT rowid, distance FROM chunk_vectors WHERE embedding MATCH ? AND k = ?")
    .all(new Float32Array(embedding), BigInt(k))
    .map((row, index) => ({ chunkId: vectorHitRow.parse(row).rowid, rank: index + 1 }));
}

const keywordHitRow = z.object({ rowid: z.number().int() });

// bm25() is lower for better matches.
export function keywordSearch(db: DatabaseSync, text: string, k: number) {
  const match = ftsQuery(text);
  if (match === null) return [];
  return db
    .prepare(
      "SELECT rowid FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY bm25(chunks_fts) LIMIT ?",
    )
    .all(match, k)
    .map((row, index) => ({ chunkId: keywordHitRow.parse(row).rowid, rank: index + 1 }));
}
