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

export const itemStatus = z.enum(["pending", "processing", "ready", "failed"]);
export type ItemStatus = z.infer<typeof itemStatus>;

export const itemFailureCode = z.enum([
  "URL_BLOCKED",
  "FETCH_FAILED",
  "FETCH_TIMEOUT",
  "CONTENT_TOO_LARGE",
  "UNSUPPORTED_CONTENT_TYPE",
  "EXTRACTION_EMPTY",
  "EMBEDDING_FAILED",
  "INTERNAL",
]);
export type ItemFailureCode = z.infer<typeof itemFailureCode>;

export const item = z.object({
  id: z.number().int(),
  type: z.enum(["note", "url"]),
  title: z.string().nullable(),
  url: z.string().nullable(),
  status: itemStatus,
  error: z.object({ code: itemFailureCode, message: z.string() }).nullable(),
  truncated: z.boolean(),
  chunkCount: z.number().int(),
  preview: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Item = z.infer<typeof item>;

export const ingestRequest = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("note"),
    text: z.string().trim().min(1).max(100_000),
    title: z.string().trim().min(1).max(200).optional(),
  }),
  z.object({
    type: z.literal("url"),
    url: z.url({ protocol: /^https?$/ }).max(2048),
  }),
]);
export type IngestRequest = z.infer<typeof ingestRequest>;

export const ingestResponse = z.object({ item });
export type IngestResponse = z.infer<typeof ingestResponse>;

export const itemsResponse = z.object({ items: z.array(item) });
export type ItemsResponse = z.infer<typeof itemsResponse>;

export const itemIdParams = z.object({ id: z.coerce.number().int().positive() });
export type ItemIdParams = z.infer<typeof itemIdParams>;

export const chatMessage = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(8000),
});
export type ChatMessage = z.infer<typeof chatMessage>;

export const queryRequest = z.object({
  question: z.string().trim().min(1).max(2000),
  history: z.array(chatMessage).max(12).default([]),
});
export type QueryRequest = z.infer<typeof queryRequest>;

export const querySource = z.object({
  n: z.number().int().positive(),
  chunkId: z.number().int(),
  itemId: z.number().int(),
  title: z.string().nullable(),
  url: z.string().nullable(),
  snippet: z.string(),
});
export type QuerySource = z.infer<typeof querySource>;

export const sourcesData = z.object({ query: z.string(), sources: z.array(querySource) });
export type SourcesData = z.infer<typeof sourcesData>;

export const citationsData = z.object({ citations: z.array(z.number().int().positive()) });
export type CitationsData = z.infer<typeof citationsData>;

// The `data-*` parts of the /query stream. Both apps build
// `UIMessage<never, QueryDataTypes>` from it, so contracts needs no `ai` dependency.
export type QueryDataTypes = { sources: SourcesData; citations: CitationsData };
