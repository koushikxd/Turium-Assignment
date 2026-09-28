import { createOpenAI } from "@ai-sdk/openai";
import { citationsData, ingestResponse, sourcesData } from "@turium-assignment/contracts";
import { expect, onTestFinished, test, vi } from "vitest";

import { env } from "../../src/env.server";
import { listItems, postIngest, postQuery, readUIStream } from "../support/api";
import { startApp } from "../support/app";

test("a note is ingested and answered with a citation by the real models", async () => {
  const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
  const app = await startApp({
    chatModel: openai(env.CHAT_MODEL),
    embeddingModel: openai.embedding(env.EMBEDDING_MODEL),
  });
  onTestFinished(() => app.close());

  const ingest = await postIngest(app.url, {
    type: "note",
    title: "Router reset",
    text: "To reset the office router, hold the recessed button on the back for 30 seconds, then wait five minutes for the lights to turn solid green.",
  });
  const { item } = ingestResponse.parse(await ingest.json());
  const done = await vi.waitFor(
    async () => {
      const found = (await listItems(app.url)).find((listed) => listed.id === item.id);
      if (found?.status !== "ready" && found?.status !== "failed") throw new Error("not done");
      return found;
    },
    { timeout: 30_000, interval: 250 },
  );
  expect(done).toMatchObject({ status: "ready", error: null });
  expect(done.chunkCount).toBeGreaterThanOrEqual(1);

  const parts = await readUIStream(
    await postQuery(app.url, { question: "How long do I hold the router button?" }),
  );
  const { sources } = sourcesData.parse(parts.find((part) => part.type === "data-sources")?.data);
  expect(sources[0]?.itemId).toBe(item.id);
  const text = parts
    .filter((part) => part.type === "text-delta")
    .map((part) => String(part.delta))
    .join("");
  expect(text).toMatch(/30/);
  const { citations } = citationsData.parse(
    parts.find((part) => part.type === "data-citations")?.data,
  );
  expect(citations).toContain(1);
});
