import { z } from "zod";

export const healthResponse = z.object({ status: z.literal("ok") });
export type HealthResponse = z.infer<typeof healthResponse>;

export const errorCode = z.enum([
  "VALIDATION_FAILED",
  "ITEM_NOT_FOUND",
  "ROUTE_NOT_FOUND",
  "ITEM_ALREADY_EXISTS",
  "KNOWLEDGE_BASE_EMPTY",
  "PAYLOAD_TOO_LARGE",
  "URL_NOT_ALLOWED",
  "UPSTREAM_AI_FAILED",
  "INTERNAL",
  "SERVICE_UNAVAILABLE",
]);
export type ErrorCode = z.infer<typeof errorCode>;

export const problemDetails = z.object({
  type: z.string(),
  title: z.string(),
  status: z.number().int(),
  detail: z.string(),
  code: errorCode,
  requestId: z.string(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  existingItemId: z.number().int().optional(),
});
export type ProblemDetails = z.infer<typeof problemDetails>;
