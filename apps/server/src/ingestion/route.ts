import { ingestRequest } from "@turium-assignment/contracts";
import type { IngestResponse } from "@turium-assignment/contracts";
import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

import { AppError } from "../http/errors";
import { validate } from "../http/validate";
import { insertNote } from "../items/repository";
import { dedupKey } from "./dedup-key";
import type { Worker } from "./worker";

export function ingestRouter(db: DatabaseSync, worker: Worker) {
  const router = Router();
  router.post("/ingest", (req, res) => {
    const request = validate(ingestRequest, req, "body");
    // Until task 04 wires URLs into the pipeline.
    if (request.type === "url") {
      const message = "URL ingestion is not implemented yet.";
      throw new AppError("VALIDATION_FAILED", message, { errors: [{ path: "type", message }] });
    }

    const [firstLine = ""] = request.text.split("\n", 1);
    const result = insertNote(db, {
      title: request.title ?? firstLine.trim().slice(0, 80),
      content: request.text,
      dedupKey: dedupKey(request),
    });
    if ("existingItemId" in result) {
      req.log?.set({ ingest: { type: request.type, outcome: "duplicate" } });
      throw new AppError("ITEM_ALREADY_EXISTS", "This note is already saved.", {
        existingItemId: result.existingItemId,
      });
    }

    req.log?.set({ ingest: { type: request.type, outcome: "created" } });
    worker.notify();
    const body: IngestResponse = { item: result.item };
    res.status(202).json(body);
  });
  return router;
}
