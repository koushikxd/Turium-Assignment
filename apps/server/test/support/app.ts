import type { EmbeddingModel, LanguageModel } from "ai";
import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "../../src/app";
import { openDatabase } from "../../src/db/open";
import { defaultNetworkPolicy } from "../../src/ingestion/network-policy";
import type { NetworkPolicy } from "../../src/ingestion/network-policy";
import { createUrlFetcher } from "../../src/ingestion/url-fetcher";
import { createWorker } from "../../src/ingestion/worker";
import { fakeChatModel, fakeEmbeddingModel } from "./models";

export function tempDatabasePath() {
  return join(mkdtempSync(join(tmpdir(), "inbox-test-")), "inbox.db");
}

type StartAppOptions = {
  databasePath?: string;
  embeddingModelId?: string;
  embeddingModel?: Exclude<EmbeddingModel, string>;
  chatModel?: LanguageModel;
  networkPolicy?: NetworkPolicy;
  fetchTimeoutMs?: number;
};

// The default policy, except loopback, so the app can reach the local fixture server.
const allowLoopback: NetworkPolicy = {
  blocks: (address) =>
    !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(address) &&
    defaultNetworkPolicy.blocks(address),
};

export async function startApp(options: StartAppOptions = {}) {
  const databasePath = options.databasePath ?? tempDatabasePath();
  const embedding = options.embeddingModel ?? fakeEmbeddingModel(options.embeddingModelId);
  const db = openDatabase(databasePath, embedding.modelId);
  const networkPolicy = options.networkPolicy ?? allowLoopback;
  const worker = createWorker(
    db,
    embedding,
    createUrlFetcher(networkPolicy, options.fetchTimeoutMs),
  );
  worker.start();
  const app = createApp({
    db,
    models: { chat: options.chatModel ?? fakeChatModel({ answer: "Fake answer." }), embedding },
    networkPolicy,
    worker,
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  // SAFETY: a server listening on a TCP port reports an AddressInfo, never a pipe name.
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    db,
    async close() {
      server.close();
      // After an aborted request, fetch leaves a fresh socket open that never sends
      // a request, and server.close() waits for it until fetch's 4 s idle timeout.
      server.closeAllConnections();
      await once(server, "close");
      await worker.stop();
      if (db.isOpen) db.close();
      if (!options.databasePath) rmSync(join(databasePath, ".."), { recursive: true, force: true });
    },
  };
}
