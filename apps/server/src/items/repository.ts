import { item, itemFailureCode, itemStatus } from "@turium-assignment/contracts";
import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { immediate, NOW } from "../db/sql";
import { deleteChunks } from "../retrieval/chunk-index";

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

function getItem(db: DatabaseSync, id: number) {
  return itemRow.parse(db.prepare(`SELECT ${ITEM_COLUMNS} FROM items WHERE id = ?`).get(id));
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

export function deleteItem(db: DatabaseSync, id: number) {
  return immediate(db, () => {
    deleteChunks(db, id);
    return db.prepare("DELETE FROM items WHERE id = ?").run(id).changes > 0;
  });
}

export function hasReadyItems(db: DatabaseSync) {
  const row = db
    .prepare("SELECT EXISTS(SELECT 1 FROM items WHERE status = 'ready') AS found")
    .get();
  return z.object({ found: z.number().int() }).parse(row).found === 1;
}
