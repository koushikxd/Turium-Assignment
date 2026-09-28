import { ingestResponse } from "@turium-assignment/contracts";
import { readMemoryLogs } from "evlog/memory";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { defaultNetworkPolicy } from "../../src/ingestion/network-policy";
import { expectProblem, listItems, postIngest, waitForItem } from "../support/api";
import { startApp } from "../support/app";
import {
  ARTICLE_PARAGRAPHS,
  ARTICLE_TITLE,
  FOOTER_TEXT,
  NAV_TEXT,
  startFixtureServer,
} from "../support/fixture-server";

let fixture: Awaited<ReturnType<typeof startFixtureServer>>;
beforeAll(async () => {
  fixture = await startFixtureServer();
});
afterAll(() => fixture.close());

async function ingestUrl(appUrl: string, url: string) {
  const response = await postIngest(appUrl, { type: "url", url });
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

describe("POST /ingest (url)", () => {
  test("an article reaches ready with its title and main-content paragraphs", async () => {
    const app = await startApp();
    const started = new Date().toISOString();
    const item = await ingestUrl(app.url, `${fixture.url}/article`);
    expect(item).toMatchObject({ type: "url", url: `${fixture.url}/article`, title: null });

    const ready = await waitForItem(app.url, item.id, (found) => found.status === "ready");
    expect(ready).toMatchObject({ title: ARTICLE_TITLE, truncated: false });
    expect(ready.chunkCount).toBeGreaterThanOrEqual(1);

    const { content } = z
      .object({ content: z.string() })
      .parse(app.db.prepare("SELECT content FROM items WHERE id = ?").get(item.id));
    expect(content).toContain(ARTICLE_PARAGRAPHS.join("\n\n"));
    for (const word of [...NAV_TEXT.split(" "), FOOTER_TEXT]) expect(content).not.toContain(word);

    await vi.waitFor(() => expect(ingestionEvents(item.id, started)).toHaveLength(1));
    expect(ingestionEvents(item.id, started)[0]).toMatchObject({
      type: "url",
      outcome: "ready",
      fetchMs: expect.any(Number),
      extractMs: expect.any(Number),
      bytes: expect.any(Number),
      truncated: false,
    });
    await app.close();
  });

  test.each([
    "http://127.0.0.1:9/article",
    "http://169.254.169.254/latest/meta-data/",
    "http://2130706433/",
    "http://0177.0.0.1/",
    "http://0x7f000001/",
  ])("%s is a 422 under the default policy, and no item is created", async (url) => {
    const app = await startApp({ networkPolicy: defaultNetworkPolicy });
    await expectProblem(await postIngest(app.url, { type: "url", url }), 422, "URL_NOT_ALLOWED");
    expect(await listItems(app.url)).toEqual([]);
    await app.close();
  });

  test("a redirect to a blocked address ends failed with URL_BLOCKED", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/redirect-blocked`);
    const failed = await waitForItem(app.url, item.id, (found) => found.status === "failed");
    expect(failed.error?.code).toBe("URL_BLOCKED");
    await app.close();
  });

  test("a redirect to a file: URL ends failed with URL_BLOCKED", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/redirect-file`);
    const failed = await waitForItem(app.url, item.id, (found) => found.status === "failed");
    expect(failed.error?.code).toBe("URL_BLOCKED");
    await app.close();
  });

  test.each([
    ["/missing", "FETCH_FAILED", {}],
    ["/file.pdf", "UNSUPPORTED_CONTENT_TYPE", {}],
    ["/large", "CONTENT_TOO_LARGE", {}],
    ["/slow", "FETCH_TIMEOUT", { fetchTimeoutMs: 200 }],
    ["/empty", "EXTRACTION_EMPTY", {}],
  ])("%s ends failed with %s", async (path, code, options) => {
    const app = await startApp(options);
    const item = await ingestUrl(app.url, `${fixture.url}${path}`);
    const failed = await waitForItem(app.url, item.id, (found) => found.status === "failed");
    expect(failed.error?.code).toBe(code);
    expect(failed.chunkCount).toBe(0);
    await app.close();
  });

  test("text over 100,000 chars is cut there and flagged truncated", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/long.txt`);
    const ready = await waitForItem(app.url, item.id, (found) => found.status === "ready");
    expect(ready).toMatchObject({ title: null, truncated: true });
    const { length } = z
      .object({ length: z.number() })
      .parse(
        app.db.prepare("SELECT length(content) AS length FROM items WHERE id = ?").get(item.id),
      );
    expect(length).toBe(100_000);
    await app.close();
  });

  test("the cut never splits a surrogate pair", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/emoji.txt`);
    const ready = await waitForItem(app.url, item.id, (found) => found.status === "ready");
    expect(ready.truncated).toBe(true);
    const { content } = z
      .object({ content: z.string() })
      .parse(app.db.prepare("SELECT content FROM items WHERE id = ?").get(item.id));
    expect(content).toBe("a".repeat(99_999));
    await app.close();
  });

  test("a text/plain body is decoded with its declared charset", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/windows-1252.txt`);
    await waitForItem(app.url, item.id, (found) => found.status === "ready");
    const { content } = z
      .object({ content: z.string() })
      .parse(app.db.prepare("SELECT content FROM items WHERE id = ?").get(item.id));
    expect(content).toBe("caf\u00e9");
    await app.close();
  });

  test("the same URL with a fragment is a 409 with existingItemId", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/article`);
    const duplicate = await postIngest(app.url, {
      type: "url",
      url: `${fixture.url}/article#frag`,
    });
    const body = await expectProblem(duplicate, 409, "ITEM_ALREADY_EXISTS");
    expect(body.existingItemId).toBe(item.id);
    await app.close();
  });

  test("resubmitting a failed URL creates a new item", async () => {
    const app = await startApp();
    const item = await ingestUrl(app.url, `${fixture.url}/file.pdf`);
    await waitForItem(app.url, item.id, (found) => found.status === "failed");
    const retry = await ingestUrl(app.url, `${fixture.url}/file.pdf`);
    expect(retry.id).not.toBe(item.id);
    await app.close();
  });
});
