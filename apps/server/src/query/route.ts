import { queryRequest } from "@turium-assignment/contracts";
import { pipeUIMessageStreamToResponse } from "ai";
import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

import type { Models } from "../app";
import { validate } from "../http/validate";
import { answerQuery } from "./answer";

export function queryRouter(db: DatabaseSync, models: Models) {
  const router = Router();
  router.post("/query", async (req, res) => {
    const request = validate(queryRequest, req, "body");
    const controller = new AbortController();
    res.on("close", () => controller.abort());
    const stream = await answerQuery(db, models, request, controller.signal);
    await pipeUIMessageStreamToResponse({ response: res, stream });
  });
  return router;
}
