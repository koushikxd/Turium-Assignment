import { ingestResponse } from "@turium-assignment/contracts";
import { readMemoryLogs } from "evlog/memory";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { expectProblem, listItems, postIngest, waitForItem } from "../support/api";
import { startApp } from "../support/app";
import { fakeEmbeddingModel } from "../support/models";

type App = Awaited<ReturnType<typeof startApp>>;

async function ingestNote(app: App, text: string) {
  const response = await postIngest(app.url, { type: "note", text });
  expect(response.status).toBe(202);
  return ingestResponse.parse(await response.json()).item;
}

function rowCounts(app: App) {
  const count = (table: string) => app.db.prepare(`SELECT count(*) AS n FROM ${table}`).get()?.n;
  return { chunks: count("chunks"), vectors: count("chunk_vectors"), fts: count("chunks_fts") };
}

// A long note, so the item has several chunks, vectors and FTS rows to remove.
const longNote = Array.from(
  { length: 80 },
  (_, i) => `Sentence ${i} about the quarterly roadmap and its many details.`,
).join(" ");

describe("GET /items", () => {
  test("lists newest first with status, preview and chunk count, without content", async () => {
    const app = await startApp();
    const first = await ingestNote(app, "First note, the older one.");
    const second = await ingestNote(app, `Second note. ${"x".repeat(300)}`);
    await waitForItem(app.url, first.id, (found) => found.status === "ready");
    await waitForItem(app.url, second.id, (found) => found.status === "ready");

    const response = await fetch(`${app.url}/items`);
    const raw = z.object({ items: z.array(z.looseObject({})) }).parse(await response.json());
    for (const entry of raw.items) expect(entry).not.toHaveProperty("content");

    const items = await listItems(app.url);
    expect(items.map((found) => found.id)).toEqual([second.id, first.id]);
    expect(items[0]).toMatchObject({ status: "ready", chunkCount: 1 });
    expect(items[0]?.preview).toHaveLength(200);
    expect(items[1]?.preview).toBe("First note, the older one.");
    await app.close();
  });

  test("a database failure is a masked 500 INTERNAL", async () => {
    const app = await startApp();
    app.db.close();
    const body = await expectProblem(await fetch(`${app.url}/items`), 500, "INTERNAL");
    expect(body.detail).toBe("Something went wrong.");
    await app.close();
  });
});

describe("DELETE /items/:id", () => {
  test("returns 204 and removes the item's chunks, vectors and FTS rows", async () => {
    const app = await startApp();
    const item = await ingestNote(app, longNote);
    const ready = await waitForItem(app.url, item.id, (found) => found.status === "ready");
    expect(ready.chunkCount).toBeGreaterThan(1);
    const n = ready.chunkCount;
    expect(rowCounts(app)).toEqual({ chunks: n, vectors: n, fts: n });

    const response = await fetch(`${app.url}/items/${item.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);
    expect(await listItems(app.url)).toEqual([]);
    expect(rowCounts(app)).toEqual({ chunks: 0, vectors: 0, fts: 0 });

    const again = await fetch(`${app.url}/items/${item.id}`, { method: "DELETE" });
    await expectProblem(again, 404, "ITEM_NOT_FOUND");
    await app.close();
  });

  test("a non-integer id is a 400 pointing at id", async () => {
    const app = await startApp();
    const response = await fetch(`${app.url}/items/abc`, { method: "DELETE" });
    const body = await expectProblem(response, 400, "VALIDATION_FAILED");
    expect(body.errors?.map((error) => error.path)).toEqual(["id"]);
    await app.close();
  });

  test("deleting a processing item wins, and the job leaves nothing behind", async () => {
    const { promise: entered, resolve: enter } = Promise.withResolvers<void>();
    const { promise: gate, resolve: release } = Promise.withResolvers<void>();
    const embeddingModel = fakeEmbeddingModel(undefined, async () => {
      enter();
      await gate;
    });
    const app = await startApp({ embeddingModel });
    const started = new Date().toISOString();
    const item = await ingestNote(app, longNote);
    await entered;
    expect((await listItems(app.url))[0]?.status).toBe("processing");

    const response = await fetch(`${app.url}/items/${item.id}`, { method: "DELETE" });
    expect(response.status).toBe(204);
    release();

    const events = () =>
      readMemoryLogs({
        filter: (event) =>
          event.job === "ingestion" && event.itemId === item.id && event.timestamp >= started,
      });
    await vi.waitFor(() => expect(events()).toHaveLength(1));
    expect(events()[0]).toMatchObject({ outcome: "deleted" });
    expect(await listItems(app.url)).toEqual([]);
    expect(rowCounts(app)).toEqual({ chunks: 0, vectors: 0, fts: 0 });
    await app.close();
  });
});
