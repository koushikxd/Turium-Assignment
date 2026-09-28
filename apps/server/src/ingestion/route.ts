import { ingestRequest } from "@turium-assignment/contracts";
import type { IngestResponse } from "@turium-assignment/contracts";
import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

import { AppError } from "../http/errors";
import { validate } from "../http/validate";
import { insertItem } from "../items/repository";
import { dedupKey } from "./dedup-key";
import { isUrlAllowed } from "./network-policy";
import type { NetworkPolicy } from "./network-policy";
import type { Worker } from "./worker";

export function ingestRouter(db: DatabaseSync, networkPolicy: NetworkPolicy, worker: Worker) {
  const router = Router();
  router.post("/ingest", async (req, res) => {
    const request = validate(ingestRequest, req, "body");
    if (request.type === "url" && !(await isUrlAllowed(new URL(request.url), networkPolicy))) {
      req.log?.set({ ingest: { type: request.type, outcome: "blocked" } });
      throw new AppError("URL_NOT_ALLOWED", "This URL resolves to a blocked address.");
    }

    const result = insertItem(
      db,
      request.type === "url"
        ? { type: "url", title: null, url: request.url, content: null, dedupKey: dedupKey(request) }
        : {
            type: "note",
            title: request.title ?? firstLine(request.text).slice(0, 80),
            url: null,
            content: request.text,
            dedupKey: dedupKey(request),
          },
    );
    if ("existingItemId" in result) {
      req.log?.set({ ingest: { type: request.type, outcome: "duplicate" } });
      throw new AppError(
        "ITEM_ALREADY_EXISTS",
        `This ${request.type === "url" ? "URL" : "note"} is already saved.`,
        {
          existingItemId: result.existingItemId,
        },
      );
    }

    req.log?.set({ ingest: { type: request.type, outcome: "created" } });
    worker.notify();
    const body: IngestResponse = { item: result.item };
    res.status(202).json(body);
  });
  return router;
}

function firstLine(text: string) {
  const [line = ""] = text.split("\n", 1);
  return line.trim();
}
