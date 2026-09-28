import type { EmbeddingModel, LanguageModel } from "ai";
import { evlog } from "evlog/express";
import express from "express";
import type { DatabaseSync } from "node:sqlite";

import { healthRouter } from "./health";
import { errorHandler, notFound } from "./http/error-handler";
import { requestId } from "./http/request-id";

export type Models = { chat: LanguageModel; embedding: EmbeddingModel };

export type AppDeps = { db: DatabaseSync; models: Models };

export function createApp({ db }: AppDeps) {
  const app = express();
  app.use(requestId);
  app.use(evlog());
  app.use(express.json({ limit: "1mb" }));
  app.use(healthRouter(db));
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
