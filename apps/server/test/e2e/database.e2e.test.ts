import { ingestResponse } from "@turium-assignment/contracts";
import { DatabaseSync } from "node:sqlite";
import * as sqliteVec from "sqlite-vec";

import { describe, expect, test } from "vitest";

import { migrations } from "../../src/db/migrations";
import { keywordSearch } from "../../src/retrieval/chunk-index";
import { postIngest, waitForItem } from "../support/api";
import { embedText } from "../support/models";
import { startApp, tempDatabasePath } from "../support/app";

describe("database", () => {
  test("the first start creates the full schema", async () => {
    const app = await startApp();
    const tables = app.db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name IN ('items', 'chunks', 'chunk_vectors', 'chunks_fts', 'meta') ORDER BY name",
      )
      .all()
      .map((row) => row.name);
    expect(tables).toEqual(["chunk_vectors", "chunks", "chunks_fts", "items", "meta"]);
    expect(app.db.prepare("PRAGMA user_version").get()).toEqual({
      user_version: migrations.length,
    });
    await app.close();
  });

  test("reopening an existing file keeps its data and version", async () => {
    const databasePath = tempDatabasePath();
    const first = await startApp({ databasePath });
    first.db.prepare("INSERT INTO meta (key, value) VALUES ('probe', 'kept')").run();
    await first.close();

    const second = await startApp({ databasePath });
    expect(second.db.prepare("SELECT value FROM meta WHERE key = 'probe'").get()).toEqual({
      value: "kept",
    });
    expect(second.db.prepare("PRAGMA user_version").get()).toEqual({
      user_version: migrations.length,
    });
    await second.close();
  });

  test("a different embedding model refuses to start and names both models", async () => {
    const databasePath = tempDatabasePath();
    await (await startApp({ databasePath })).close();

    await expect(
      startApp({ databasePath, embeddingModelId: "text-embedding-3-large" }),
    ).rejects.toThrow(
      "Embedding model mismatch: database has text-embedding-3-small, config has text-embedding-3-large",
    );
  });

  test("a database newer than the known migrations refuses to start", async () => {
    const databasePath = tempDatabasePath();
    await (await startApp({ databasePath })).close();
    const future = new DatabaseSync(databasePath);
    future.exec(`PRAGMA user_version = ${migrations.length + 1}`);
    future.close();

    await expect(startApp({ databasePath })).rejects.toThrow(
      `Database version mismatch: database has ${migrations.length + 1}, server knows ${migrations.length}`,
    );
  });

  test("migrating from version 1 rebuilds keyword search with titles and stemming", async () => {
    const databasePath = tempDatabasePath();
    const first = await startApp({ databasePath });
    const ingest = await postIngest(first.url, {
      type: "note",
      title: "meeting with john",
      text: "scheduled",
    });
    const { item } = ingestResponse.parse(await ingest.json());
    await waitForItem(first.url, item.id, (found) => found.status === "ready");
    await first.close();

    const old = new DatabaseSync(databasePath, { allowExtension: true });
    sqliteVec.load(old);
    old.exec(`
      DROP TABLE chunks_fts;
      CREATE VIRTUAL TABLE chunks_fts USING fts5 (body);
      INSERT INTO chunks_fts (rowid, body) SELECT id, text FROM chunks;
      PRAGMA user_version = 1;
    `);
    old.close();

    const second = await startApp({ databasePath });
    expect(keywordSearch(second.db, "meetings", 10)).toHaveLength(1);
    await second.close();
  });

  test("vec0 supports insert, KNN and delete", async () => {
    const app = await startApp();
    const insert = app.db.prepare("INSERT INTO chunk_vectors (rowid, embedding) VALUES (?, ?)");
    const vector = (text: string) => new Float32Array(embedText(text));
    insert.run(1n, vector("the cat sat on the mat"));
    insert.run(2n, vector("quarterly revenue grew"));
    insert.run(3n, vector("a cat on a mat"));

    const knn = app.db.prepare(
      "SELECT rowid FROM chunk_vectors WHERE embedding MATCH ? AND k = ? ORDER BY distance",
    );
    const nearest = () => knn.all(vector("cat on the mat"), 3).map((row) => row.rowid);
    expect(nearest()).toEqual([1, 3, 2]);

    app.db.prepare("DELETE FROM chunk_vectors WHERE rowid = ?").run(1n);
    expect(nearest()).toEqual([3, 2]);
    await app.close();
  });
});
