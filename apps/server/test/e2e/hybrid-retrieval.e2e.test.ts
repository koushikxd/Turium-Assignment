import { describe, expect, test } from "vitest";

import { TOP_K } from "../../src/retrieval/config";
import { retrieve } from "../../src/retrieval/retrieve";
import { partOf, postQuery, readUIStream, requestEvent, sourcesOf } from "../support/api";
import { startAppWithNotes } from "../support/app";
import { embedText, fakeEmbeddingModel } from "../support/models";

const TOKEN = "ZX-4471";
const TARGET = `${TOKEN} means disk quota exceeded, clear old artifacts.`;
const DISTRACTORS = [
  "Build server error after the nightly deploy: restart the runner.",
  "Build server error when tests time out on the shared agent.",
  "Build server error from a stale cache, purge it and retry.",
  "Build server error caused by an expired signing certificate.",
  "Build server error if the lockfile is out of date.",
  "Build server error reported by the linter step in CI.",
  "Build server error on Windows agents because of path length.",
];

describe("hybrid retrieval", () => {
  test("a rare-token chunk the embedding cannot see arrives through BM25", async () => {
    // Blind to the token, so TARGET shares nothing with the question in vector space
    // and ranks last. Only BM25 can bring it into the top 6.
    const embeddingModel = fakeEmbeddingModel(undefined, undefined, (text) =>
      embedText(text.replaceAll(TOKEN, "")),
    );
    const app = await startAppWithNotes({ embeddingModel }, [...DISTRACTORS, TARGET]);
    const response = await postQuery(app.url, { question: `What is build server error ${TOKEN}?` });

    const target = sourcesOf(await readUIStream(response)).sources.find(
      (source) => source.snippet === TARGET,
    );
    expect(target).toBeDefined();
    const event = await requestEvent(response);
    expect(event.query).toMatchObject({
      results: expect.arrayContaining([
        expect.objectContaining({ chunkId: target?.chunkId, vectorRank: 8, keywordRank: 1 }),
      ]),
    });
    await app.close();
  });

  test("vector-only retrieval leaves out the chunk that BM25 brings in", async () => {
    const blind = (text: string) => embedText(text.replaceAll(TOKEN, ""));
    const embeddingModel = fakeEmbeddingModel(undefined, undefined, blind);
    const app = await startAppWithNotes({ embeddingModel }, [...DISTRACTORS, TARGET]);
    const text = `What is build server error ${TOKEN}?`;
    const query = { text, embedding: blind(text) };

    const texts = (keyword: boolean) =>
      retrieve(app.db, query, { keyword, limit: TOP_K }).map((chunk) => chunk.text);
    expect(texts(true)).toContain(TARGET);
    expect(texts(false)).not.toContain(TARGET);
    expect(texts(false)).toHaveLength(TOP_K);
    await app.close();
  });

  test.each(['"unbalanced', "feed*", "sourdough AND", "NEAR(wifi password)", "-wifi", "OR", "***"])(
    "FTS5 syntax in %j is searched as plain text",
    async (question) => {
      const app = await startAppWithNotes({}, [
        "Sourdough starter: feed it flour and water twice a day, morning and evening.",
        "Office wifi: the guest password rotates every Monday at nine.",
      ]);
      const parts = await readUIStream(await postQuery(app.url, { question }));

      expect(partOf(parts, "data-sources")).toBeDefined();
      expect(partOf(parts, "error")).toBeUndefined();
      expect(parts.at(-1)?.type).toBe("finish");
      await app.close();
    },
  );
});
