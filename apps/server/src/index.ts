import { createOpenAI } from "@ai-sdk/openai";
import { initLogger } from "evlog";
import { createFsDrain } from "evlog/fs";

import { createApp } from "./app";
import { openDatabase } from "./db/open";
import { env } from "./env.server";
import { defaultNetworkPolicy } from "./ingestion/network-policy";
import { createUrlFetcher } from "./ingestion/url-fetcher";
import { createWorker } from "./ingestion/worker";

initLogger({ drain: createFsDrain() });

const db = openDatabase(env.DATABASE_PATH, env.EMBEDDING_MODEL);
const openai = createOpenAI({ apiKey: env.OPENAI_API_KEY });
const models = { chat: openai(env.CHAT_MODEL), embedding: openai.embedding(env.EMBEDDING_MODEL) };
const networkPolicy = defaultNetworkPolicy;
const worker = createWorker(db, models.embedding, createUrlFetcher(networkPolicy));
worker.start();
const app = createApp({ db, models, networkPolicy, worker });

app.listen(env.PORT, () => {
  console.log(`Server is running on http://localhost:${env.PORT}`);
});
