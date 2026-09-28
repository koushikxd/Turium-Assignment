import type { EmbeddingModel } from "ai";
import type { DatabaseSync } from "node:sqlite";

import { claimNextItem, requeueProcessing } from "../items/repository";
import { processItem } from "./pipeline";
import type { FetchUrl } from "./url-fetcher";

const CONCURRENCY = 2;

export type Worker = ReturnType<typeof createWorker>;

// The database is the queue (ARCHITECTURE §5.1). Runners drain pending items,
// then sleep until notify(). There is no polling timer.
export function createWorker(db: DatabaseSync, embeddingModel: EmbeddingModel, fetchUrl: FetchUrl) {
  let stopping = false;
  let notified = false;
  let waiters: (() => void)[] = [];
  let runners: Promise<void>[] = [];

  function wakeAll() {
    const woken = waiters;
    waiters = [];
    for (const wake of woken) wake();
  }

  async function run() {
    while (!stopping) {
      notified = false;
      const item = claimNextItem(db);
      if (item) {
        await processItem(db, embeddingModel, fetchUrl, item);
        continue;
      }
      // The latch covers a notify() between the empty claim and the sleep. With
      // synchronous node:sqlite both happen in one tick today, so it is a guard.
      if (!notified) await new Promise<void>((resolve) => waiters.push(resolve));
    }
  }

  return {
    start() {
      requeueProcessing(db);
      runners = Array.from({ length: CONCURRENCY }, run);
    },
    notify() {
      notified = true;
      wakeAll();
    },
    async stop() {
      stopping = true;
      wakeAll();
      await Promise.all(runners);
    },
  };
}
