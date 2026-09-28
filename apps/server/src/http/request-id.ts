import { randomUUID } from "node:crypto";
import type { RequestHandler } from "express";

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

// Always generate the id, ignoring any inbound x-request-id, so the response
// header, the error body and the log event can never disagree. evlog reads the
// id from the request header, so it is written there too.
export const requestId: RequestHandler = (req, res, next) => {
  req.id = randomUUID();
  req.headers["x-request-id"] = req.id;
  res.setHeader("x-request-id", req.id);
  next();
};
