import { createOpenAI } from "@ai-sdk/openai";
import { embed } from "ai";
import { initLogger } from "evlog";
import { once } from "node:events";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

import { openDatabase } from "../src/db/open";
import { env } from "../src/env.server";
import { dedupKey } from "../src/ingestion/dedup-key";
import { claimNextItem } from "../src/ingestion/jobs";
import { processItem } from "../src/ingestion/pipeline";
import { createUrlFetcher } from "../src/ingestion/url-fetcher";
import { insertItem, listItems } from "../src/items/repository";
import { VECTOR_K } from "../src/retrieval/config";
import { retrieve } from "../src/retrieval/retrieve";
import { hitRank, summarize } from "./metrics";

const corpusDir = join(import.meta.dirname, "corpus");
const resultsDir = join(import.meta.dirname, "../../../evals");
const questions = z
  .array(z.object({ id: z.string(), item: z.string(), question: z.string(), evidence: z.string() }))
  .parse(JSON.parse(readFileSync(join(import.meta.dirname, "questions.json"), "utf8")));
const files = readdirSync(corpusDir)
  .filter((name) => /\.(md|html)$/.test(name))
  .sort();

// The wide events of the ingestion jobs are not needed here.
initLogger({ silent: true, drain: () => {} });

const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
const embeddingModel = openai.embedding(env.EMBEDDING_MODEL);
const tempDir = mkdtempSync(join(tmpdir(), "inbox-eval-"));
const db = openDatabase(join(tempDir, "eval.db"), env.EMBEDDING_MODEL);

// HTML files are ingested as URLs, so fetch and extraction run too.
const corpusServer = createServer((req, res) => {
  const file = files.find((name) => req.url === `/${name}`);
  if (!file) return void res.writeHead(404).end();
  res
    .writeHead(200, { "content-type": "text/html; charset=utf-8" })
    .end(readFileSync(join(corpusDir, file)));
});
corpusServer.listen(0, "127.0.0.1");
await once(corpusServer, "listening");
// SAFETY: a server listening on a TCP port reports an AddressInfo, never a pipe name.
const { port } = corpusServer.address() as AddressInfo;

function newItem(file: string) {
  if (file.endsWith(".html")) {
    const url = `http://127.0.0.1:${port}/${file}`;
    return {
      type: "url",
      title: null,
      url,
      content: null,
      dedupKey: dedupKey({ type: "url", url }),
    } as const;
  }
  const text = readFileSync(join(corpusDir, file), "utf8");
  return {
    type: "note",
    title: file,
    url: null,
    content: text,
    dedupKey: dedupKey({ type: "note", text }),
  } as const;
}

try {
  const itemIds = new Map<string, number>();
  for (const file of files) {
    const inserted = insertItem(db, newItem(file));
    if (!("item" in inserted) || !inserted.item) throw new Error(`${file} duplicates another file`);
    itemIds.set(file, inserted.item.id);
  }

  // The real pipeline, run to completion. The corpus server is on loopback, so nothing is blocked.
  const fetchUrl = createUrlFetcher({ blocks: () => false });
  for (let item = claimNextItem(db); item; item = claimNextItem(db)) {
    await processItem(db, embeddingModel, fetchUrl, item);
  }
  const items = listItems(db);
  const failed = items.filter((item) => item.status !== "ready");
  if (failed.length > 0) throw new Error(`Ingest failed: ${JSON.stringify(failed)}`);

  const chunks = z
    .array(z.object({ itemId: z.number(), text: z.string() }))
    .parse(db.prepare("SELECT item_id AS itemId, text FROM chunks ORDER BY id").all());
  const cases = await Promise.all(
    questions.map(async (question) => {
      const itemId = itemIds.get(question.item);
      if (itemId === undefined) throw new Error(`${question.id}: no corpus file ${question.item}`);
      const label = { itemId, evidence: question.evidence };
      // A phrase split across chunks, or mistyped, could never be a hit in any configuration.
      if (hitRank(chunks, label) === null)
        throw new Error(`${question.id}: evidence not in a chunk`);
      const { embedding } = await embed({ model: embeddingModel, value: question.question });
      return { label, query: { text: question.question, embedding } };
    }),
  );
  // VECTOR_K is the most the vector-only arm can return, and the depth of recall@20.
  const ranksFor = (keyword: boolean) =>
    cases.map(({ label, query }) =>
      hitRank(retrieve(db, query, { keyword, limit: VECTOR_K }), label),
    );
  const vectorOnly = ranksFor(false);
  const hybrid = ranksFor(true);

  const results = {
    runAt: new Date().toISOString(),
    embeddingModel: env.EMBEDDING_MODEL,
    documents: items.length,
    chunks: chunks.length,
    questions: questions.length,
    configurations: { vectorOnly: summarize(vectorOnly), hybrid: summarize(hybrid) },
    // Rank of the first hit per question, null for a miss within the top 20.
    perQuestion: questions.map((question, i) => ({
      id: question.id,
      vectorOnly: vectorOnly[i],
      hybrid: hybrid[i],
    })),
  };
  mkdirSync(resultsDir, { recursive: true });
  writeFileSync(join(resultsDir, "eval-results.json"), `${JSON.stringify(results, null, 2)}\n`);
  console.table(results.configurations);
  console.table(results.perQuestion.filter((row) => row.vectorOnly !== row.hybrid));
} finally {
  corpusServer.close();
  db.close();
  rmSync(tempDir, { recursive: true, force: true });
}
