import type { ErrorRequestHandler, RequestHandler } from "express";
import { z } from "zod";

import { AppError, sendProblem } from "./errors";

// Errors thrown by express.json() carry a `type` field (body-parser's contract).
const bodyParserError = z.object({
  type: z.enum([
    "entity.too.large",
    "entity.parse.failed",
    "charset.unsupported",
    "encoding.unsupported",
  ]),
});

export const notFound: RequestHandler = (req) => {
  throw new AppError("ROUTE_NOT_FOUND", `No route for ${req.method} ${req.path}.`);
};

export const errorHandler: ErrorRequestHandler = (cause: unknown, req, res, _next) => {
  if (cause instanceof AppError) return sendProblem(req, res, cause);

  const parsed = bodyParserError.safeParse(cause);
  if (parsed.success && parsed.data.type === "entity.too.large") {
    return sendProblem(req, res, new AppError("PAYLOAD_TOO_LARGE", "Request body exceeds 1 MB."));
  }
  if (parsed.success && parsed.data.type === "entity.parse.failed") {
    return sendProblem(
      req,
      res,
      new AppError("VALIDATION_FAILED", "Request body is not valid JSON."),
    );
  }
  if (parsed.success) {
    return sendProblem(
      req,
      res,
      new AppError(
        "VALIDATION_FAILED",
        "Request body charset or content-encoding is not supported.",
      ),
    );
  }

  req.log?.error(cause instanceof Error ? cause : String(cause));
  sendProblem(req, res, new AppError("INTERNAL", "Something went wrong."));
};
