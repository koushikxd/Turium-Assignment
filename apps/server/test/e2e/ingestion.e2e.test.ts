import { ingestResponse } from "@turium-assignment/contracts";
import { readMemoryLogs } from "evlog/memory";
import { describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { expectProblem, postIngest, waitForItem } from "../support/api";
import { startApp, tempDatabasePath } from "../support/app";
import { fakeEmbeddingModel } from "../support/models";

async function ingestNote(url: string, text: string, title?: string) {
  const response = await postIngest(url, { type: "note", text, title });
  expect(response.status).toBe(202);
  return ingestResponse.parse(await response.json()).item;
}

// Every test starts a fresh database, so item ids repeat across tests in this file.
// The emit timestamp scopes events to the current test.
const ingestionEvents = (itemId: number, since: string) =>
  readMemoryLogs({
    filter: (event) =>
      event.job === "ingestion" && event.itemId === itemId && event.timestamp >= since,
  });

describe("POST /ingest (note)", () => {
  test("a note returns 202 pending, then reaches ready with a derived title", async () => {
    const app = await startApp();
    const response = await postIngest(app.url, {
      type: "note",
      text: "Groceries for the week\nmilk, eggs, bread",
    });
    expect(response.status).toBe(202);
    const { item } = ingestResponse.parse(await response.json());
    expect(item).toMatchObject({ type: "note", status: "pending", chunkCount: 0, error: null });

    const ready = await waitForItem(app.url, item.id, (found) => found.status === "ready");
    expect(ready.chunkCount).toBeGreaterThanOrEqual(1);
    expect(ready.title).toBe("Groceries for the week");
    await vi.waitFor(() =>
      expect(
        readMemoryLogs({
          filter: (event) => event.requestId === response.headers.get("x-request-id"),
        }),
      ).toMatchObject([{ ingest: { type: "note", outcome: "created" } }]),
    );
    await app.close();
  });

  test("a given title is kept, and a long first line is cut to 80 chars", async () => {
    const app = await startApp();
    const titled = await ingestNote(app.url, "Some body text.", "  My title  ");
    const untitled = await ingestNote(app.url, "w".repeat(120));
    expect(titled.title).toBe("My title");
    expect(untitled.title).toBe("w".repeat(80));
    await app.close();
  });

  test("a whitespace variant of an existing note is a 409 with existingItemId", async () => {
    const app = await startApp();
    const item = await ingestNote(app.url, "Meeting notes\nship on Friday");
    const duplicate = await postIngest(app.url, {
      type: "note",
      text: "  Meeting notes\r\nship on Friday\n\n",
    });
    const body = await expectProblem(duplicate, 409, "ITEM_ALREADY_EXISTS");
    expect(body.existingItemId).toBe(item.id);
    await app.close();
  });

  test("an embedding failure ends failed, and resubmitting creates a new item", async () => {
    const embeddingModel = fakeEmbeddingModel(undefined, async () => {
      throw new Error("provider exploded: secret detail");
    });
    const app = await startApp({ embeddingModel });
    const started = new Date().toISOString();
    const item = await ingestNote(app.url, "A note the provider cannot embed.");

    const failed = await waitForItem(app.url, item.id, (found) => found.status === "failed");
    expect(failed.error).toEqual({
      code: "EMBEDDING_FAILED",
      message: "The embedding provider failed.",
    });
    expect(failed.chunkCount).toBe(0);

    await vi.waitFor(() => expect(ingestionEvents(item.id, started)).toHaveLength(1));
    expect(ingestionEvents(item.id, started)[0]).toMatchObject({
      outcome: "failed",
      errorCode: "EMBEDDING_FAILED",
      error: { message: "provider exploded: secret detail" },
    });

    const retry = await ingestNote(app.url, "A note the provider cannot embed.");
    expect(retry.id).not.toBe(item.id);
    await app.close();
  });

  test("an item left processing by a stopped server is processed after restart", async () => {
    const databasePath = tempDatabasePath();
    const first = await startApp({ databasePath });
    const { id } = z.object({ id: z.number() }).parse(
      first.db
        .prepare(
          `INSERT INTO items (type, title, dedup_key, content, status, created_at, updated_at)
         VALUES ('note', 'Stuck', 'note:stuck', 'Left mid-job by a crash.', 'processing', 'x', 'x')
         RETURNING id`,
        )
        .get(),
    );
    await first.close();

    const second = await startApp({ databasePath });
    const ready = await waitForItem(second.url, id, (found) => found.status === "ready");
    expect(ready.chunkCount).toBe(1);
    await second.close();
  });

  test.each([
    ["text missing", "text", { type: "note" }],
    ["text over 100,000 chars", "text", { type: "note", text: "a".repeat(100_001) }],
    ["whitespace-only text", "text", { type: "note", text: "   \n " }],
    ["title over 200 chars", "title", { type: "note", text: "ok", title: "t".repeat(201) }],
    ["unknown type", "type", { type: "pdf", text: "ok" }],
  ])("%s is a 400 pointing at %s", async (_name, path, body) => {
    const app = await startApp();
    const problem = await expectProblem(await postIngest(app.url, body), 400, "VALIDATION_FAILED");
    expect(problem.errors?.map((error) => error.path)).toEqual([path]);
    await app.close();
  });

  test("each ingestion job emits exactly one wide event", async () => {
    const app = await startApp();
    const started = new Date().toISOString();
    const item = await ingestNote(app.url, "One event per job, please.");
    await waitForItem(app.url, item.id, (found) => found.status === "ready");
    await vi.waitFor(() => expect(ingestionEvents(item.id, started)).toHaveLength(1));
    expect(ingestionEvents(item.id, started)[0]).toMatchObject({
      type: "note",
      outcome: "ready",
      chunkCount: 1,
      tokens: expect.any(Number),
      chunkMs: expect.any(Number),
      embedMs: expect.any(Number),
      commitMs: expect.any(Number),
    });
    await app.close();
  });
});
