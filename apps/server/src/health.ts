import type { HealthResponse } from "@turium-assignment/contracts";
import { Router } from "express";
import type { DatabaseSync } from "node:sqlite";

import { AppError, toError } from "./http/errors";

export function healthRouter(db: DatabaseSync) {
  const router = Router();
  router.get("/health", (req, res) => {
    try {
      db.prepare("SELECT 1").get();
    } catch (error) {
      req.log?.error(toError(error));
      throw new AppError("SERVICE_UNAVAILABLE", "Database is not reachable.");
    }
    const body: HealthResponse = { status: "ok" };
    res.status(200).json(body);
  });
  return router;
}
