# AI Knowledge Inbox: Project Spec

Scope, API contract and acceptance criteria. How it is built is in [ARCHITECTURE.md](./ARCHITECTURE.md).

## 1. Purpose

A single-user web app to save notes and URLs, then ask questions over them in a multi-turn conversation. Answers stream in, grounded in the saved content, with inline citations pointing at the source snippets.

## 2. Scope

### In scope

- Ingest plain-text notes and URLs. URLs are fetched and extracted server-side.
- Asynchronous processing with a visible per-item status.
- Chunking, embeddings, hybrid retrieval (vector + BM25).
- Streaming, multi-turn answers with inline citations, checked against the sources actually sent.
- List and delete items.
- Structured logging, RFC 9457 errors, E2E tests, a retrieval eval, CI.
- Local run via `pnpm dev` and `pnpm start`.

### Non-goals

| Not doing                         | Why                                                               |
| --------------------------------- | ----------------------------------------------------------------- |
| Auth, multiple users              | Single-user is fine for the assignment. See ARCHITECTURE.md §13   |
| Deployment, Docker                | The assignment asks for a local run                               |
| Server-side conversation storage  | The client holds history                                          |
| PDFs, images, other content types | Only `text/html` and `text/plain`. Others fail with a clear error |
| Editing items or re-fetching URLs | Delete and re-ingest covers it                                    |
| Pagination, rate limiting         | Single local user. See ARCHITECTURE.md §12                        |
| LLM-judged answer metrics         | The eval measures retrieval only                                  |

### Interpretations

- **"Store raw content":** the note text, or the main-content text extracted from the page, stored in full in `items.content`. The fetched HTML is not stored: only text is ever re-used.
- **"Async":** `POST /ingest` does no page fetch or model work. The only network work in the request is the DNS lookup for the URL policy check, so a blocked URL gets `422` immediately. It stores a `pending` item and returns `202`. A worker does the rest.
- **API paths:** the server serves `/ingest`, `/items`, `/query` as named in the assignment. The browser reaches them under `/api/*` through the Vite proxy, which strips the prefix.

## 3. Domain

### Item

| Field                    | Type                                               | Notes                                                                                                                                 |
| ------------------------ | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `id`                     | integer                                            |                                                                                                                                       |
| `type`                   | `"note" \| "url"`                                  |                                                                                                                                       |
| `title`                  | string \| null                                     | Note: the given title, else the first line (max 80 chars). URL: the extracted page title, `null` until processed and for `text/plain` |
| `url`                    | string \| null                                     | URL items only, as submitted                                                                                                          |
| `status`                 | `"pending" \| "processing" \| "ready" \| "failed"` |                                                                                                                                       |
| `error`                  | `{ code, message } \| null`                        | Set only when `failed`                                                                                                                |
| `truncated`              | boolean                                            | Extracted page text exceeded 100,000 chars and was cut                                                                                |
| `chunkCount`             | integer                                            | `0` until `ready`                                                                                                                     |
| `preview`                | string \| null                                     | First ~200 chars of content. `null` for a URL not yet fetched                                                                         |
| `createdAt`, `updatedAt` | string                                             | ISO 8601 UTC                                                                                                                          |

### Lifecycle

```
            POST /ingest
                 │
                 ▼
            ┌─────────┐   worker claims   ┌────────────┐   commit    ┌───────┐
            │ pending │ ────────────────▶ │ processing │ ──────────▶ │ ready │
            └─────────┘                   └────────────┘             └───────┘
                 ▲                              │
                 │ server restart               │ any stage fails
                 └──────────────────────────────┤
                                                ▼
                                           ┌────────┐
                                           │ failed │
                                           └────────┘
```

- `failed` is terminal. To retry, submit the same note or URL again. Failed items do not count as duplicates.
- Chunks become searchable atomically at the `ready` commit.
- Deleting a `processing` item is allowed. The delete wins and the worker's commit becomes a no-op.

Failure codes: `URL_BLOCKED`, `FETCH_FAILED`, `FETCH_TIMEOUT`, `CONTENT_TOO_LARGE`, `UNSUPPORTED_CONTENT_TYPE`, `EXTRACTION_EMPTY`, `EMBEDDING_FAILED`, `INTERNAL`.

## 4. API contract

- JSON in and out, except `POST /query`, which streams.
- Collections are wrapped (`{ "items": [...] }`) so fields can be added without breaking clients.
- All schemas live in `packages/contracts` (Zod). The server validates with them and the web app types against them.
- Every response has an `x-request-id` header, matching `requestId` in error bodies and in the server log event.

### Errors (RFC 9457)

Every non-2xx response is `application/problem+json`:

```json
{
  "type": "/problems/validation-failed",
  "title": "Request validation failed",
  "status": 400,
  "detail": "Body does not match the ingest schema.",
  "code": "VALIDATION_FAILED",
  "requestId": "01J...",
  "errors": [{ "path": "url", "message": "Must be an http or https URL" }]
}
```

| Code                   | Status | When                                                                                                      |
| ---------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `VALIDATION_FAILED`    | 400    | Body or params fail the schema (with `errors[]`), or the JSON is malformed or uses an unsupported charset |
| `ITEM_NOT_FOUND`       | 404    | Unknown item id                                                                                           |
| `ROUTE_NOT_FOUND`      | 404    | Unknown path                                                                                              |
| `ITEM_ALREADY_EXISTS`  | 409    | Same normalized URL or note text exists and is not `failed`. Includes `existingItemId`                    |
| `KNOWLEDGE_BASE_EMPTY` | 409    | A question was asked with no `ready` items                                                                |
| `PAYLOAD_TOO_LARGE`    | 413    | Body over 1 MB                                                                                            |
| `URL_NOT_ALLOWED`      | 422    | URL resolves to a private, loopback, link-local or otherwise blocked address                              |
| `UPSTREAM_AI_FAILED`   | 502    | The model provider failed before the answer stream opened                                                 |
| `INTERNAL`             | 500    | Anything else. Generic detail, cause in the log                                                           |
| `SERVICE_UNAVAILABLE`  | 503    | `GET /health` could not query the database                                                                |

### `POST /ingest`

```json
{ "type": "note", "text": "string, 1..100000 chars", "title": "optional, 1..200 chars" }
{ "type": "url", "url": "http(s) URL, max 2048 chars" }
```

- Notes over 100,000 chars are rejected, not truncated, since the user typed them.
- URLs are checked against the network policy at request time (`422`) and again on every redirect at fetch time (`failed` with `URL_BLOCKED`).

`202 Accepted`: `{ "item": Item }` with `status: "pending"`.

Errors: `400`, `409 ITEM_ALREADY_EXISTS`, `413`, `422`.

### `GET /items`

`200`: `{ "items": Item[] }`, newest first. Content is not included.

### `DELETE /items/:id`

`204`. Errors: `400` (non-integer id), `404 ITEM_NOT_FOUND`.

### `GET /health`

`200 { "status": "ok" }` if a trivial DB query succeeds, otherwise `503`.

### `POST /query`

```json
{
  "question": "string, 1..2000 chars",
  "history": [
    { "role": "user", "content": "string, 1..8000 chars" },
    { "role": "assistant", "content": "..." }
  ]
}
```

`history` is optional (default `[]`), max 12 messages. `[n]` markers in assistant history are stripped by the server.

**Before the stream opens**, failures are normal problem+json: `400`, `409 KNOWLEDGE_BASE_EMPTY`, `502 UPSTREAM_AI_FAILED`, `500`.

**Otherwise** the response is `200 text/event-stream` in the AI SDK v7 UI message stream format, with parts in this order:

1. `data-sources`, once, before any text:
   ```json
   {
     "query": "standalone query used for retrieval",
     "sources": [
       {
         "n": 1,
         "chunkId": 42,
         "itemId": 7,
         "title": "…",
         "url": "https://…",
         "snippet": "chunk text"
       }
     ]
   }
   ```
2. Text deltas, citing sources inline as `[n]` or `[n, m]`.
3. `data-citations`, once, after the text: `{ "citations": [1, 3] }`. The valid `n` values used, in order of first appearance. Markers with no matching source are excluded here but stay in the text.
4. On a failure during generation, an `error` part with a generic message.

A zero-citation answer is valid: the sources did not cover the question and the model said so. Closing the connection aborts generation.

## 5. Configuration

Server env, declared in `apps/server/.env.schema` (Varlock):

| Var               | Default                  | Notes                           |
| ----------------- | ------------------------ | ------------------------------- |
| `OPENAI_API_KEY`  | required                 | Sensitive                       |
| `PORT`            | `8888`                   |                                 |
| `DATABASE_PATH`   | `./data/inbox.db`        |                                 |
| `CHAT_MODEL`      | `gpt-5.4-mini`           | Answering and query rewrite     |
| `EMBEDDING_MODEL` | `text-embedding-3-small` | Locked in the DB on first start |

Retrieval and chunking constants are in code (`retrieval/config.ts`, `ingestion/chunker.ts`).

## 6. Acceptance criteria

Each criterion is covered by an automated test unless marked _(manual)_. E2E tests run against the real Express app and a real SQLite file, with mock models.

**Ingestion**

- A note returns `202` with a `pending` item and reaches `ready` with `chunkCount ≥ 1`.
- A URL on a fixture server reaches `ready` with the extracted title and main-content text.
- A URL to `127.0.0.1` or `169.254.169.254` is rejected with `422` under the default policy.
- A redirect to a blocked address ends `failed` with `URL_BLOCKED`.
- Non-HTML content, oversized bodies, timeouts and empty extractions each end `failed` with their code.
- Re-submitting an existing note or URL returns `409` with `existingItemId`. Re-submitting a `failed` one creates a new item.
- Items left `processing` when the server stopped are processed after restart.
- Invalid bodies return `400` with `errors[]` pointing at the field.

**Items**

- `GET /items` lists newest first with status, preview and chunk count, without content.
- `DELETE /items/:id` returns `204`, and the item's chunks no longer appear in vector or keyword retrieval.
- Deleting a `processing` item leaves no orphan chunks, vectors or FTS rows.

**Query**

- With no ready items, `/query` returns `409 KNOWLEDGE_BASE_EMPTY`.
- The stream sends `data-sources`, then text, then `data-citations`.
- A citation to a non-existent source is excluded from `data-citations`.
- With history, retrieval uses the rewritten query, visible in `data-sources.query`.
- A model failure before streaming returns `502`. A failure during streaming yields an `error` part.

**Hybrid retrieval**

- FTS5 keyword search is fused with vector search via RRF.
- A rare token (an ID, an error code) in exactly one chunk, which the test embedding ranks outside the vector top 6, lands in the hybrid top 6.
- Queries containing FTS5 syntax (`"`, `*`, `AND`, `NEAR`, `-`) never error.

**Cross-cutting**

- Every response has `x-request-id`, and every error body is RFC 9457 with `code` and `requestId`.
- Each request emits exactly one wide log event, and so does each ingestion job.
- CI runs type checks, lint and the mocked test suite on push, with no secrets.
- `pnpm test:live` runs one ingest-and-ask round trip against the real OpenAI API _(local only)_.
- `pnpm eval` reports recall@6, recall@20 and MRR for vector-only and hybrid retrieval and writes `evals/eval-results.json`.

**Frontend** _(manual)_

- Add a note and a URL, and watch each reach `ready` or `failed`.
- Ask a question and see the answer stream in, with citation chips that open the source snippet.
- Delete an item.

## 7. Requirement traceability

| Assignment item                                      | Where                                                           |
| ---------------------------------------------------- | --------------------------------------------------------------- |
| Add notes and URLs (server-side fetch)               | `POST /ingest`, ARCHITECTURE.md §5                              |
| Store raw content, timestamp, source type            | `items` table, §2 interpretations                               |
| Intentional chunking strategy                        | ARCHITECTURE.md §5.3                                            |
| Embeddings and vector storage                        | `text-embedding-3-small`, sqlite-vec in the same SQLite file    |
| Retrieve top chunks                                  | Hybrid retrieval, ARCHITECTURE.md §6                            |
| Answer with cited sources                            | `/query` stream, citations checked against sent sources         |
| Frontend: add, list, ask, show answer and snippets   | `apps/web`                                                      |
| React hooks, state management                        | TanStack Query for server state, `useChat` for the conversation |
| `POST /ingest`, `GET /items`, `POST /query`          | §4                                                              |
| Validation, error handling, status codes             | Zod contracts, RFC 9457, §4                                     |
| Structured logging                                   | ARCHITECTURE.md §8                                              |
| Tradeoffs: chunking, vector store, scale, production | ARCHITECTURE.md §11-13                                          |
| Separation of concerns                               | ARCHITECTURE.md §3                                              |
| Local run, clear setup                               | `pnpm dev`, `pnpm start`, README                                |
