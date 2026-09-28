import type { Request } from "express";
import type { z } from "zod";

import { AppError } from "./errors";

// A function, not middleware: the route gets the parsed value with its type.
export function validate<T extends z.ZodType>(schema: T, req: Request, source: "body" | "params") {
  const parsed = schema.safeParse(req[source]);
  if (parsed.success) return parsed.data;
  const errors = parsed.error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
  throw new AppError(
    "VALIDATION_FAILED",
    source === "body" ? "Body does not match the schema." : "Path parameters are invalid.",
    { errors },
  );
}
