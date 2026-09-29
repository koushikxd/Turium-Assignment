import { embedMany } from "ai";
import type { EmbeddingModel } from "ai";
import { createLogger } from "evlog";
import type { DatabaseSync } from "node:sqlite";

import { commitChunks, markFailed, saveExtraction } from "../items/repository";
import type { ClaimedItem } from "../items/repository";
import { chunk } from "./chunker";
import { extract } from "./extract";
import { ItemFailure } from "./item-failure";
import type { FetchUrl } from "./url-fetcher";

export async function processItem(
  db: DatabaseSync,
  embeddingModel: EmbeddingModel,
  fetchUrl: FetchUrl,
  item: ClaimedItem,
) {
  const log = createLogger({ job: "ingestion", itemId: item.id, type: item.type });
  try {
    let content: string;
    let started = performance.now();
    if (item.type === "url") {
      const page = await fetchUrl(item.url);
      log.set({ fetchMs: elapsed(started), bytes: page.bytes });

      started = performance.now();
      const { title, text, truncated } = extract(page);
      saveExtraction(db, item.id, { title, content: text, truncated });
      log.set({ extractMs: elapsed(started), truncated });
      content = text;
    } else {
      content = item.content;
    }

    started = performance.now();
    const texts = chunk(content);
    log.set({ chunkMs: elapsed(started), chunkCount: texts.length });

    started = performance.now();
    const { embeddings, usage } = await embedMany({
      model: embeddingModel,
      values: texts,
      maxParallelCalls: 2,
    }).catch((cause: unknown) => {
      throw new ItemFailure("EMBEDDING_FAILED", "The embedding provider failed.", { cause });
    });
    log.set({ embedMs: elapsed(started), tokens: usage.tokens });

    started = performance.now();
    const committed = commitChunks(db, item.id, texts, embeddings);
    log.set({ commitMs: elapsed(started), outcome: committed ? "ready" : "deleted" });
  } catch (cause) {
    const failure =
      cause instanceof ItemFailure
        ? cause
        : new ItemFailure("INTERNAL", "Processing failed unexpectedly.", { cause });
    // evlog serializes a nested cause as {}, so the root error is logged itself.
    log.error(failure.cause instanceof Error ? failure.cause : failure);
    const marked = markFailed(db, item.id, failure.code, failure.message);
    log.set({ outcome: marked ? "failed" : "deleted", errorCode: failure.code });
  } finally {
    log.emit();
  }
}

function elapsed(started: number) {
  return Math.round(performance.now() - started);
}
