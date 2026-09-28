import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import * as sqliteVec from "sqlite-vec";
import { z } from "zod";

import { migrate } from "./migrate";

// Must match the float[N] of chunk_vectors in the first migration.
export const EMBEDDING_DIMENSIONS = 1536;

export function openDatabase(path: string, embeddingModel: string) {
  mkdirSync(dirname(path), { recursive: true });
  const db = new DatabaseSync(path, { allowExtension: true });
  try {
    sqliteVec.load(db);
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    db.exec("PRAGMA busy_timeout = 5000");
    migrate(db);
    lockEmbeddingModel(db, embeddingModel);
    return db;
  } catch (error) {
    db.close();
    throw error;
  }
}

const metaValue = z.object({ value: z.string() });

// Vectors from different models are not comparable, so the first start records
// the model and every later start must match it.
function lockEmbeddingModel(db: DatabaseSync, embeddingModel: string) {
  const expected = {
    embedding_model: embeddingModel,
    embedding_dimensions: String(EMBEDDING_DIMENSIONS),
  };
  const insert = db.prepare(
    "INSERT INTO meta (key, value) VALUES (?, ?) ON CONFLICT (key) DO NOTHING",
  );
  const select = db.prepare("SELECT value FROM meta WHERE key = ?");
  for (const [key, value] of Object.entries(expected)) {
    insert.run(key, value);
    const { value: stored } = metaValue.parse(select.get(key));
    if (stored === value) continue;
    const label = key === "embedding_model" ? "Embedding model" : "Embedding dimensions";
    throw new Error(`${label} mismatch: database has ${stored}, config has ${value}`);
  }
}
