import { item, itemFailureCode, itemStatus } from "@turium-assignment/contracts";
import type { ItemFailureCode } from "@turium-assignment/contracts";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

const ITEM_COLUMNS = `
  id, type, title, url, status, error_code, error_message, truncated,
  substr(content, 1, 200) AS preview,
  (SELECT count(*) FROM chunks WHERE chunks.item_id = items.id) AS chunk_count,
  created_at, updated_at`;

const itemRow = z
  .object({
    id: z.number().int(),
    type: z.enum(["note", "url"]),
    title: z.string().nullable(),
    url: z.string().nullable(),
    status: itemStatus,
    error_code: itemFailureCode.nullable(),
    error_message: z.string().nullable(),
    truncated: z.number().int(),
    preview: z.string().nullable(),
    chunk_count: z.number().int(),
    created_at: z.string(),
    updated_at: z.string(),
  })
  .transform((row) =>
    item.parse({
      id: row.id,
      type: row.type,
      title: row.title,
      url: row.url,
      status: row.status,
      error:
        row.error_code === null || row.error_message === null
          ? null
          : { code: row.error_code, message: row.error_message },
      truncated: row.truncated === 1,
      chunkCount: row.chunk_count,
      preview: row.preview,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }),
  );

const idRow = z.object({ id: z.number().int() });

const claimedRow = z.discriminatedUnion("type", [
  z.object({ id: z.number().int(), type: z.literal("note"), content: z.string() }),
  z.object({ id: z.number().int(), type: z.literal("url"), url: z.string() }),
]);
export type ClaimedItem = z.infer<typeof claimedRow>;

function getItem(db: DatabaseSync, id: number) {
  return itemRow.parse(db.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = ?`).get(id));
}

function immediate<T>(db: DatabaseSync, work: () => T) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

type NewItem = {
  type: "note" | "url";
  title: string | null;
  url: string | null;
  content: string | null;
  dedupKey: string;
};

// The partial unique index on dedup_key rejects a duplicate of any non-failed item.
export function insertItem(db: DatabaseSync, newItem: NewItem) {
  const inserted = db
    .prepare(
      `INSERT INTO items (type, title, url, dedup_key, content, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ${NOW}, ${NOW})
       ON CONFLICT DO NOTHING
       RETURNING id`,
    )
    .get(newItem.type, newItem.title, newItem.url, newItem.dedupKey, newItem.content);
  if (inserted) return { item: getItem(db, idRow.parse(inserted).id) };
  const existing = db
    .prepare("SELECT id FROM items WHERE dedup_key = ? AND status <> 'failed'")
    .get(newItem.dedupKey);
  return { existingItemId: idRow.parse(existing).id };
}

export function listItems(db: DatabaseSync) {
  return db
    .prepare(`SELECT ${ITEM_COLUMNS} FROM items ORDER BY id DESC`)
    .all()
    .map((row) => itemRow.parse(row));
}

// Virtual tables ignore foreign keys, so their rows go first, by chunk id.
// The cascade then removes the chunks with the item.
export function deleteItem(db: DatabaseSync, id: number) {
  return immediate(db, () => {
    const chunkIds = "SELECT id FROM chunks WHERE item_id = ?";
    db.prepare(`DELETE FROM chunk_vectors WHERE rowid IN (${chunkIds})`).run(id);
    db.prepare(`DELETE FROM chunks_fts WHERE rowid IN (${chunkIds})`).run(id);
    return db.prepare("DELETE FROM items WHERE id = ?").run(id).changes > 0;
  });
}

export function claimNextItem(db: DatabaseSync) {
  const row = db
    .prepare(
      `UPDATE items SET status = 'processing', updated_at = ${NOW}
       WHERE id = (SELECT id FROM items WHERE status = 'pending' ORDER BY id LIMIT 1)
       RETURNING id, type, content, url`,
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

    const insertChunk = db.prepare("INSERT INTO chunks (item_id, ordinal, text) VALUES (?, ?, ?)");
    const insertVector = db.prepare("INSERT INTO chunk_vectors (rowid, embedding) VALUES (?, ?)");
    const insertFts = db.prepare("INSERT INTO chunks_fts (rowid, body) VALUES (?, ?)");
    for (const [ordinal, text] of texts.entries()) {
      // vec0 rejects a rowid bound as a JS number (ARCHITECTURE §4).
      const chunkId = BigInt(insertChunk.run(itemId, ordinal, text).lastInsertRowid);
      insertVector.run(chunkId, new Float32Array(embeddings[ordinal] ?? []));
      insertFts.run(chunkId, text);
    }
    return true;
  });
}

export function hasReadyItems(db: DatabaseSync) {
  const row = db
    .prepare("SELECT EXISTS(SELECT 1 FROM items WHERE status = 'ready') AS found")
    .get();
  return z.object({ found: z.number().int() }).parse(row).found === 1;
}
