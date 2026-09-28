import type { EmbeddingModel, LanguageModel } from "ai";
import { evlog } from "evlog/express";
import express from "express";
import type { DatabaseSync } from "node:sqlite";

import { healthRouter } from "./health";
import { errorHandler, notFound } from "./http/error-handler";
import { requestId } from "./http/request-id";
import type { NetworkPolicy } from "./ingestion/network-policy";
import { ingestRouter } from "./ingestion/route";
import type { Worker } from "./ingestion/worker";
import { itemsRouter } from "./items/routes";
import { queryRouter } from "./query/route";

export type Models = { chat: LanguageModel; embedding: EmbeddingModel };

export type AppDeps = {
  db: DatabaseSync;
  models: Models;
  networkPolicy: NetworkPolicy;
  worker: Worker;
};

export function createApp({ db, models, networkPolicy, worker }: AppDeps) {
  const app = express();
  app.use(requestId);
  app.use(evlog());
  app.use(express.json({ limit: "1mb" }));
  app.use(healthRouter(db));
  app.use(ingestRouter(db, networkPolicy, worker));
  app.use(itemsRouter(db));
  app.use(queryRouter(db, models));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
