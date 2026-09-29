import type { ItemFailureCode } from "@turium-assignment/contracts";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { immediate, NOW } from "../db/sql";
import { writeChunks } from "../retrieval/chunk-index";

const claimedRow = z.discriminatedUnion("type", [
  z.object({
    id: z.number().int(),
    type: z.literal("note"),
    title: z.string().nullable(),
    content: z.string(),
  }),
  z.object({ id: z.number().int(), type: z.literal("url"), url: z.string() }),
]);
export type ClaimedItem = z.infer<typeof claimedRow>;

export function claimNextItem(db: DatabaseSync) {
  const row = db
    .prepare(
      `UPDATE items SET status = 'processing', updated_at = ${NOW}
       WHERE id = (SELECT id FROM items WHERE status = 'pending' ORDER BY id LIMIT 1)
       RETURNING id, type, title, content, url`,
    )
    .get();
  return row ? claimedRow.parse(row) : undefined;
}

export function requeueProcessing(db: DatabaseSync) {
  db.prepare(
    `UPDATE items SET status = 'pending', updated_at = ${NOW} WHERE status = 'processing'`,
  ).run();
}

type Extraction = { title: string | null; content: string; truncated: boolean };

// A no-op when the item was deleted while processing, like markFailed.
export function saveExtraction(db: DatabaseSync, id: number, extraction: Extraction) {
  db.prepare(
    `UPDATE items SET title = ?, content = ?, truncated = ?, updated_at = ${NOW}
     WHERE id = ? AND status = 'processing'`,
  ).run(extraction.title, extraction.content, extraction.truncated ? 1 : 0, id);
}

// Returns false when the item was deleted while processing.
export function markFailed(db: DatabaseSync, id: number, code: ItemFailureCode, message: string) {
  const result = db
    .prepare(
      `UPDATE items SET status = 'failed', error_code = ?, error_message = ?, updated_at = ${NOW}
       WHERE id = ? AND status = 'processing'`,
    )
    .run(code, message, id);
  return result.changes > 0;
}

// The conditional ready update runs first: if the item was deleted while
// processing, it changes nothing and no chunk is written (inserting first would
// fail the chunks foreign key). Readers see all of it or none of it either way.
export function commitChunks(
  db: DatabaseSync,
  itemId: number,
  title: string | null,
  texts: string[],
  embeddings: number[][],
) {
  return immediate(db, () => {
    const ready = db
      .prepare(
        `UPDATE items SET status = 'ready', updated_at = ${NOW}
         WHERE id = ? AND status = 'processing'`,
      )
      .run(itemId);
    if (ready.changes === 0) return false;

    writeChunks(db, itemId, title, texts, embeddings);
    return true;
  });
}
