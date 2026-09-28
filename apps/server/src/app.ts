import type { EmbeddingModel, LanguageModel } from "ai";
import { evlog } from "evlog/express";
import express from "express";
import type { DatabaseSync } from "node:sqlite";

import { healthRouter } from "./health";
import { errorHandler, notFound } from "./http/error-handler";
import { requestId } from "./http/request-id";
import { ingestRouter } from "./ingestion/route";
import type { Worker } from "./ingestion/worker";
import { itemsRouter } from "./items/routes";

export type Models = { chat: LanguageModel; embedding: EmbeddingModel };

export type AppDeps = { db: DatabaseSync; models: Models; worker: Worker };

export function createApp({ db, worker }: AppDeps) {
  const app = express();
  app.use(requestId);
  app.use(evlog());
  app.use(express.json({ limit: "1mb" }));
  app.use(healthRouter(db));
  app.use(ingestRouter(db, worker));
  app.use(itemsRouter(db));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
