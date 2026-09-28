import type { ErrorCode, ProblemDetails } from "@turium-assignment/contracts";
import type { Request, Response } from "express";

const problems = {
  VALIDATION_FAILED: { status: 400, title: "Request validation failed" },
  ITEM_NOT_FOUND: { status: 404, title: "Item not found" },
  ROUTE_NOT_FOUND: { status: 404, title: "Route not found" },
  ITEM_ALREADY_EXISTS: { status: 409, title: "Item already exists" },
  KNOWLEDGE_BASE_EMPTY: { status: 409, title: "Knowledge base is empty" },
  PAYLOAD_TOO_LARGE: { status: 413, title: "Payload too large" },
  URL_NOT_ALLOWED: { status: 422, title: "URL not allowed" },
  UPSTREAM_AI_FAILED: { status: 502, title: "AI provider failed" },
  INTERNAL: { status: 500, title: "Internal server error" },
  SERVICE_UNAVAILABLE: { status: 503, title: "Service unavailable" },
} satisfies Record<ErrorCode, { status: number; title: string }>;

type ProblemExtras = Pick<ProblemDetails, "errors" | "existingItemId">;

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: ErrorCode,
    readonly detail: string,
    readonly extras: ProblemExtras = {},
  ) {
    super(detail);
    this.status = problems[code].status;
  }
}

export function sendProblem(req: Request, res: Response, error: AppError) {
  const { status, title } = problems[error.code];
  const body: ProblemDetails = {
    type: `/problems/${error.code.toLowerCase().replaceAll("_", "-")}`,
    title,
    status,
    detail: error.detail,
    code: error.code,
    requestId: req.id,
    ...error.extras,
  };
  res.status(status).type("application/problem+json").send(JSON.stringify(body));
}
