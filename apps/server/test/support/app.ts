import { once } from "node:events";
import { mkdtempSync, rmSync } from "node:fs";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createApp } from "../../src/app";
import { openDatabase } from "../../src/db/open";
import { fakeChatModel, fakeEmbeddingModel } from "./models";

export function tempDatabasePath() {
  return join(mkdtempSync(join(tmpdir(), "inbox-test-")), "inbox.db");
}

type StartAppOptions = { databasePath?: string; embeddingModelId?: string };

export async function startApp(options: StartAppOptions = {}) {
  const databasePath = options.databasePath ?? tempDatabasePath();
  const embedding = fakeEmbeddingModel(options.embeddingModelId);
  const db = openDatabase(databasePath, embedding.modelId);
  const app = createApp({ db, models: { chat: fakeChatModel("Fake answer."), embedding } });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  // SAFETY: a server listening on a TCP port reports an AddressInfo, never a pipe name.
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    db,
    async close() {
      server.close();
      await once(server, "close");
      if (db.isOpen) db.close();
      if (!options.databasePath) rmSync(join(databasePath, ".."), { recursive: true, force: true });
    },
  };
}
