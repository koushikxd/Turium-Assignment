# AI Knowledge Inbox: Architecture

How the system is built, what I chose at each step, and what each choice costs. Scope and the API contract are in [PROJECT_SPEC.md](./PROJECT_SPEC.md).

## 1. Overview

```
 Browser (Vite + React)
   │  /api/*  (prefix stripped by the Vite proxy)
   ▼
 Express 5 process ─────────────────────────────────────────────────────────┐
   │                                                                        │
   ├─ POST /ingest ──▶ insert item (pending) ──▶ 202                        │
   │                          │ notify                                      │
   │                          ▼                                             │
   │                 Ingestion worker (same process, concurrency 2)         │
   │                   fetch (SSRF-guarded) → extract → chunk               │
   │                   → embed (batched)                                    │
   │                   → one transaction: chunks + vectors + FTS + ready    │
   │                                                                        │
   ├─ GET /items, DELETE /items/:id                                         │
   │                                                                        │
   └─ POST /query ──▶ rewrite (if history) → embed query                    │
                      → vector top 20 ∥ BM25 top 20 → RRF → top 6           │
                      → stream: data-sources, text [n], data-citations      │
                                                                            │
 SQLite file (node:sqlite, WAL)  ◀──────────────────────────────────────────┘
   items · chunks · chunk_vectors (sqlite-vec vec0) · chunks_fts (FTS5) · meta

 OpenAI (via AI SDK v7): text-embedding-3-small, gpt-5.4-mini
```

One process and one SQLite file hold all state. I built it this way because the assignment is single-user and local, and one file gives me transactions across items, vectors and the keyword index for free. §11 sums up the decisions, §12 says where this design stops working, and §13 says what I would change.

## 2. Repository layout

```
apps/
  server/        Express API + ingestion worker
    src/         (see §3)
    test/        e2e/, unit/, live/, support/ (app harness, fake models, fixture HTTP server)
    evals/       fixture corpus, questions.json, run.ts
  web/           Vite + React + TanStack Router/Query, shadcn components
packages/
  contracts/     Zod schemas: requests, responses, stream data parts, error codes
  config/        shared tsconfig
evals/           eval-results.json, written by `pnpm eval`
```

`packages/contracts` is the only code the server and web app share. The server validates requests with it and the web app types against it, so the API cannot drift between the two without a type error.

## 3. Code structure

### Server

```
apps/server/src/
├── index.ts      composition root: env → db → models → worker → createApp → listen
├── app.ts        createApp(deps): builds the Express app, no module-level state
├── http/         problem-details errors, validate(), request id
├── db/           open + pragmas + model lock, migrations
├── items/        list and delete routes, repository
├── ingestion/    ingest route, intake, worker, jobs, pipeline, url-fetcher,
│                 network-policy, extract, chunker, dedup-key
├── retrieval/    config, chunk-index, fts-query, rrf, retrieve
└── query/        route, answer, rewrite, prompt, citations
```

- **Folders by feature, not by layer.** Each flow lives in one folder, so changing how answers are built means reading `query/` and nothing else.
- **Dependencies are injected.** `createApp({ db, models, networkPolicy, worker })` takes everything with side effects. `index.ts` builds the real ones and tests build fakes, so the tests need no module mocking.
- **Routes are thin.** A route validates with a contract schema, calls one function and maps the result to a status code. For ingest that function is `submitItem` (`ingestion/intake`), which returns `{ item }`, `{ existingItemId }` or `{ blocked }` rather than throwing, because a duplicate or a blocked URL is an expected outcome, not an error.
- **SQL lives in three places:** `items/repository`, `ingestion/jobs` (worker status transitions) and `retrieval/`. `retrieval/chunk-index` is the only module that writes chunks and the only one that touches the virtual tables, so the rules in §4 are enforced in one file.
- **Raw SQL, no ORM.** Two of the five tables are virtual tables (`vec0`, FTS5) that an ORM cannot model, and they hold the queries that matter.

### Web app

```
apps/web/src/
├── lib/          api (fetch + problem+json), items (queries, polling), chat (request mapping, citations)
└── components/
    ├── knowledge/  add-item form, item list
    └── chat/       chat, message, citation chip, sources list, prompt form
```

- **Two kinds of state, two owners, no global store.** The item list is server state, so TanStack Query owns it, with caching, refetch and invalidation after ingest or delete. The conversation is `useChat` state from the AI SDK. Nothing else is shared, so a store like Redux or Zustand would add a layer without solving a problem.
- **Polling only while something is indexing.** The item query refetches every 1.5 s while any item is `pending` or `processing` and stops once none is. An item can fail after `POST /ingest` has returned `202`, so a failure toast fires when a poll sees an item move from indexing to `failed`. SSE would remove the polling (§13), but for one local user, polling a short list costs next to nothing.
- **One input for notes and URLs.** A lone `http(s)` URL is ingested as a URL and anything else as a note. That saves the user a type toggle. The cost: a note that is only a URL is fetched as a page.
- **The client speaks our contract, not the SDK's.** A custom `useChat` transport maps UI messages to `{ question, history }`, capping history at 12 messages of 8,000 chars and dropping empty turns. The `data-sources` and `data-citations` parts are validated against the contract schemas as they arrive.
- **Citations are rendered from the markdown tree.** A remark plugin turns `[n]` markers into citation chips after the markdown is parsed, so brackets inside code or existing links stay as text. Only a number that matches a sent source becomes a chip. A chip opens a popover with the source title, URL and snippet.
- **The sources list follows the answer.** While the answer streams, the list shows every retrieved source. Once `data-citations` arrives, it narrows to the cited ones. An answer that fails or is aborted keeps the full list.
- **Errors show the server's words.** `apiFetch` parses problem+json and surfaces its `detail`, so a message like "Add an item and wait until it is ready" reaches the user unchanged.
- **Tradeoff:** the conversation lives in memory only and is lost on reload. Persisting it would mean server-side sessions, which the spec leaves out.

## 4. Data model

```sql
CREATE TABLE items (
  id            INTEGER PRIMARY KEY,
  type          TEXT NOT NULL CHECK (type IN ('note', 'url')),
  title         TEXT,
  url           TEXT,
  dedup_key     TEXT NOT NULL,          -- 'url:<normalized>' or 'note:<sha256>'
  content       TEXT,                   -- note text or extracted page text
  truncated     INTEGER NOT NULL DEFAULT 0,
  status        TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  error_code    TEXT,
  error_message TEXT,
  created_at    TEXT NOT NULL,          -- ISO 8601 UTC
  updated_at    TEXT NOT NULL
);
CREATE UNIQUE INDEX items_dedup_key ON items (dedup_key) WHERE status <> 'failed';
CREATE INDEX items_status ON items (status);

CREATE TABLE chunks (
  id       INTEGER PRIMARY KEY,
  item_id  INTEGER NOT NULL REFERENCES items (id) ON DELETE CASCADE,
  ordinal  INTEGER NOT NULL,
  text     TEXT NOT NULL,
  UNIQUE (item_id, ordinal)
);

CREATE VIRTUAL TABLE chunk_vectors USING vec0 (embedding float[1536]);  -- rowid = chunks.id
CREATE VIRTUAL TABLE chunks_fts    USING fts5 (title, body, tokenize = 'porter unicode61');  -- rowid = chunks.id

CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
```

- **Integer IDs.** `vec0` and FTS5 link to chunks by integer rowid. I used integers for items too, so there is one ID type.
- **Partial unique index.** Uniqueness applies only to items that have not failed. One constraint gives both "no duplicates" and "re-submitting a failed item retries it".
- **Virtual tables ignore foreign keys.** The cascade removes `chunks` rows but not vector or FTS rows, so deleting an item first removes those by chunk id, in the same transaction.
- **The embedding model is locked.** On first start, `meta` records the embedding model and dimensions, and the server refuses to start if the configured model later differs. Vectors from different models are not comparable, so I prefer a startup error to retrieval that silently degrades.
- **Migrations** are an ordered array of SQL strings in `db/migrations.ts`, tracked with `PRAGMA user_version` and each applied in a transaction. They are TS rather than `.sql` files because the server is bundled into a single file.
- **Binding vec0 values from `node:sqlite`:** rowids must be bound as `BigInt` (a JS `number` binds as REAL, which vec0 rejects), and vectors as `Float32Array`.
- **Pragmas:** WAL, `foreign_keys=ON`, `busy_timeout`. WAL lets another connection (the eval, a `sqlite3` shell) read while the server writes. Inside the server there is one synchronous connection.

## 5. Ingestion

### 5.1 Worker

The database is the queue. Redis with BullMQ would give me retries and scheduling, but it is a second service to run, and it cannot commit a job's state in the same transaction as the item's chunks. For one user, a table and an in-process worker give the same guarantees with none of that.

- `POST /ingest` validates, checks the network policy for URLs, computes the dedup key and inserts a `pending` row. A unique-index conflict becomes `409`. It then calls `worker.notify()` and returns `202`.
- **Dedup keys.** Note: `note:` + SHA-256 of the text after normalizing line endings, Unicode (NFC) and surrounding whitespace. URL: `url:` + the WHATWG-normalized `href` without the fragment and `utm_*` params. I keep the trailing slash, `www.`, parameter order and scheme significant, because those can point at different resources.
- **Atomic claim:** `UPDATE items SET status = 'processing' WHERE id = (SELECT id FROM items WHERE status = 'pending' ORDER BY id LIMIT 1) RETURNING *`.
- **Concurrency 2, no polling.** The worker drains until nothing is pending, then sleeps until the next `notify()`. `notify()` sets a flag that is checked before sleeping, so an item inserted between the last empty claim and the sleep is not missed.
- **Crash recovery:** on startup, `processing → pending`, then drain. This is safe because the final commit (§5.4) is all-or-nothing.
- **Retries:** the AI SDK retries transient provider errors. `failed` is terminal and stores `{ code, message }`, and the user retries by re-submitting. Automatic retries with backoff belong with a real queue (§13). Here the user sees the error and decides.
- **Delete during processing:** every worker write is conditional on `status = 'processing'`. If the item was deleted, the write changes zero rows and the job stops, leaving nothing behind.

### 5.2 Fetching URLs safely

Fetching user-supplied URLs server-side is an SSRF risk, so every request goes through an injected `NetworkPolicy`:

- `http:` and `https:` only.
- Resolve DNS and reject loopback, private (RFC 1918), link-local (including `169.254.169.254`), CGNAT, unspecified and the IPv6 equivalents.
- Follow redirects manually (max 5) and re-check the policy on every hop.
- 10 s timeout covering all hops and the body read. 5 MB body cap, enforced while streaming. `text/html` or `text/plain` only.
- A hostname that does not resolve is not a policy violation: it is accepted (`202`) and then fails as `FETCH_FAILED`. `422` means only "resolves to a blocked address".

E2E tests inject a policy that allows loopback so they can reach the local fixture server. A separate test asserts the default policy blocks loopback and metadata addresses.

**Known gap:** DNS rebinding. A host can resolve to a public IP at check time and a private one at connect time. Closing it needs IP pinning or an egress proxy (§13).

### 5.3 Extraction and chunking

**Extraction.** `@mozilla/readability` on a `linkedom` DOM. Readability's HTML output is converted to text with block elements (paragraphs, headings, list items, `pre`) separated by blank lines, because the chunker splits on that structure and `textContent` would flatten it. `text/plain` skips Readability. Empty output fails with `EXTRACTION_EMPTY`. Text over 100,000 chars is cut and the item flagged `truncated`.

**Chunking.** Recursive and structure-aware:

- Target about 400 tokens per chunk with about 60 tokens of overlap.
- Split on the coarsest boundary that fits: paragraph → line → sentence → word → hard cut.
- A tail under 25% of the target merges into the previous chunk.
- Tokens are estimated as `chars / 4`. Sizes only need to be roughly right, and this avoids a tokenizer dependency.

Most items are short notes or articles, so I wanted chunks that follow the author's own paragraphs and stay cheap and predictable. These are the options I weighed:

| Strategy                         | For                                                                      | Against                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fixed windows                    | Trivial                                                                  | Cuts sentences and ideas mid-way                                                                                                                   |
| **Recursive, structure-aware**   | Follows the author's own boundaries. Deterministic, cheap, unit-testable | Uneven sizes. Depends on extraction quality                                                                                                        |
| Semantic (embedding breakpoints) | Adapts to topic shifts                                                   | An embedding per sentence and a threshold to tune. [Qu et al.](https://arxiv.org/abs/2410.13070) found no consistent gain over fixed-size chunking |

**Title as keyword context.** Every chunk is indexed with its item's title in the FTS `title` column, so the later chunks of a page or long note can be found by words that appear only in the title. When the chunk already starts with the title (a note's default title is its first line), I leave the title out so it is not counted twice. I also tried prefixing the title to the embedded text and measured it on the eval (§10). It lowered vector-only MRR from 0.901 to 0.86 and hybrid from 0.95 to 0.91, so the title stays in keyword search only.

**Why I left out full Contextual Retrieval.** [Anthropic's technique](https://www.anthropic.com/news/contextual-retrieval) has an LLM write a short context line for each chunk before indexing, which helps chunks that never name their subject. I left it out for three reasons: it mainly helps long multi-section documents, and most inbox items are short; it makes search match on generated text the user never sees; and the eval corpus is too small to show a gain. It would slot in between chunking and embedding, and it is first in line once long documents show up (§13).

### 5.4 Embedding and commit

All of an item's chunks go to one `embedMany` call (`maxParallelCalls: 2`). A single `BEGIN IMMEDIATE` transaction then flips the item to `ready` and inserts chunks, vectors and FTS rows, so search never sees a partially indexed item. The conditional `ready` update runs first, so a deleted item is detected before any insert.

## 6. Retrieval

```
query ──▶ embed ──▶ vec0 KNN (k=20) ──┐
   │                                  ├──▶ RRF (k=60) ──▶ top 6 ──▶ load chunk + item
   └──▶ sanitize ──▶ FTS5 bm25 (20) ──┘
```

- **Vector:** sqlite-vec 0.1.9 does exact brute-force KNN with L2 distance. OpenAI embeddings are unit-length, so L2 and cosine give the same order, and RRF uses only order.
- **Keyword:** FTS5 `bm25()` over the chunk body and item title, with the `porter` stemmer so "meetings" matches "meeting". Raw user text breaks FTS5 syntax (`"`, `AND`, `NEAR`, `-`), so `fts-query` extracts word tokens, drops English stopwords, quotes each token and joins them with `OR`. If no tokens are left, keyword search is skipped.
- **Why I drop stopwords:** IDF is corpus-relative. In a small inbox of short notes, words like "when", "do" and "have" may appear only in one long saved page, so BM25 rates them rare and ranks that page first for "when do i have meetings". RRF then rewards a chunk that is in both lists over one that is only near the top of the vector list, and in manual testing three chunks of such a page displaced the note that answered. A fixed list of about 50 pronouns, auxiliaries, articles, prepositions and wh-words, plus contraction fragments (the `s` of "what's", which would match every possessive), removes that failure without a tokenizer dependency. I kept words that double as names ("will") off the list, since exact names are what keyword search is for.
- **Fusion:** Reciprocal Rank Fusion (Cormack, Clarke, Büttcher, SIGIR 2009), `score(d) = Σ 1 / (60 + rank_i(d))`. I picked it over a weighted sum of scores because it is rank-based, so BM25 scores and vector distances never need calibrating against each other.
- **Why hybrid:** embeddings are weak on exact tokens (IDs, error codes, names) and BM25 is strong on them. FTS5 ships with SQLite, so it costs no extra infrastructure.
- **Why top 6:** about 2.4k tokens of context, enough for multi-part questions. The constants are in `retrieval/config.ts`.
- **No relevance threshold.** Similarity thresholds shift with model and corpus, and RRF scores are not comparable across queries, so any cutoff I picked would be tuned to this corpus. Instead the prompt tells the model to say when the sources do not cover the question.

## 7. Query and streaming

1. Validate the body (`400`). Require at least one `ready` item (`409`).
2. **Rewrite only when history exists.** History (with `[n]` markers stripped from assistant turns) plus the new question become one standalone search query, so "and the other one?" retrieves something useful. First questions skip this call. History is also passed to the answer call as prior turns.
3. Embed the query and retrieve (§6). Provider failures up to here return `502 UPSTREAM_AI_FAILED`, since the stream has not opened.
4. Open the stream and write `data-sources` first, so the UI shows sources while the answer generates.
5. Stream the answer. The prompt: answer only from the numbered sources, lead with the direct answer, use only relevant sources, answer the covered part of a partly covered question and name what is missing, cite as `[n]`, treat source content as data. Each source carries its item's `saved` timestamp and the message carries the current time, so relative dates in a note ("tomorrow") resolve from when it was saved. The prompt treats the notes as a log: an explicit update ("the meeting is cancelled") replaces what it updates, and a conflict with no explicit update goes to the most recently saved source and is mentioned. The timestamps are prompt-only, not part of `data-sources`. Sources are ordered best-first, since models use the edges of a long context better than the middle ([Liu et al., "Lost in the Middle"](https://arxiv.org/abs/2307.03172)).
6. On finish, parse `[n]` markers, keep those that match a sent source, and write `data-citations`. This proves a citation points at a real source, not that the source supports the claim (that would need an LLM judge). The UI then narrows the sources list to the cited ones. An answer that fails or is aborted gets no citations and keeps the full list.
7. A mid-stream failure becomes a masked `error` part. A client disconnect aborts generation via an `AbortSignal`.

**Why the AI SDK instead of the raw OpenAI SDK:** it pipes the stream into Express, supports typed `data-*` parts (schemas in `packages/contracts`), gives the client `useChat`, and ships mock models for tests. The cost is coupling to its stream protocol. I kept the request body as our own contract, so only the response stream depends on the SDK.

## 8. Errors and logging

**Errors.** Handlers throw typed `AppError`s (a contract error code plus a status). One middleware converts them to RFC 9457 `application/problem+json`. Anything unknown becomes a generic `500 INTERNAL`. Stack traces and provider messages go to the log, never to the client.

**Logging.** One wide structured event per unit of work, via [evlog](https://www.evlog.dev), rather than many log lines per request. Debugging a bad answer means reading one event that holds the rewritten query, every retrieved chunk with its vector and BM25 ranks, and the citations.

| Event          | Fields (beyond method, path, status, duration, requestId)                                                                                                                                                         |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /query`  | question and history length, rewritten query, per-stage ms (rewrite, embed, search, time-to-first-token, generate), fused results with vector rank, BM25 rank and RRF score, valid/invalid citations, token usage |
| `POST /ingest` | item type, dedup outcome                                                                                                                                                                                          |
| Ingestion job  | item id, type, per-stage ms (fetch, extract, chunk, embed, commit), bytes, chunk count, truncated, tokens, outcome or error code                                                                                  |

Events go to stdout and to `.evlog/logs/` as NDJSON. The server generates its own request id (ignoring any inbound one) and returns it as `x-request-id`.

## 9. Testing

| Layer          | What                                                                                                 | How                                                                                                                                                                                       |
| -------------- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **E2E**        | Every acceptance criterion in the spec                                                               | Vitest against the real `createApp` on an ephemeral port, a real SQLite file with sqlite-vec and FTS5, and a local fixture HTTP server for pages, redirects, slow and oversized responses |
| **Unit**       | Chunker, citation parser, FTS sanitizer, RRF, dedup keys, network policy, eval metrics, web UI logic | Pure functions with many edge cases, written before the code                                                                                                                              |
| **Live smoke** | One real ingest-and-ask round trip                                                                   | `pnpm test:live` with a real OpenAI key. Not run in CI                                                                                                                                    |
| **Eval**       | Retrieval quality                                                                                    | §10                                                                                                                                                                                       |

**Fake models.** The chat model is `MockLanguageModelV4` with scripted output (including a deliberately invalid `[9]` citation). The embedding model wraps a deterministic hashed bag-of-words embedding, so "a question about X retrieves the note about X" stays meaningful without a network. The hybrid test uses an embedding that is deliberately blind to the target chunk, which proves the chunk arrived through BM25.

**CI** runs `check-types`, lint and the full mocked suite on every push, with no secrets.

I did not write a browser E2E suite. The server E2E suite covers every contract the UI depends on, and the UI's pure logic (request mapping, citation rendering, the sources list, polling) has unit tests. The frontend acceptance criteria are checked by hand.

## 10. Evaluation

The eval measures **retrieval only**, with no LLM judge. Retrieval is what the techniques above change, and with a labelled set its metrics are exact and repeatable. The stopword, stemming and title changes in §5.3 and §6 were measured with it.

- **Corpus:** 12 committed documents (7 notes, 5 HTML pages served locally so the URL path is exercised), 21 chunks. Notes are ingested as text only, like the UI's single input, so each note's title is its first line.
- **Questions:** 25, written without reusing chunk wording, otherwise BM25 wins trivially.
- **Labels:** each question names the expected item and a short evidence phrase. A hit is a chunk from that item whose text contains the phrase. The runner checks that every phrase exists in some chunk before scoring, so a bad label fails the run instead of counting as a miss.
- **Configurations:** vector-only and hybrid over the same ingest. Only the retrieval step differs.
- **Run:** `pnpm eval` with a real key. It ingests through the real intake and worker steps and writes `evals/eval-results.json`.

Results (`text-embedding-3-small`, one run):

| Configuration               | recall@6 | recall@20 | MRR   |
| --------------------------- | -------- | --------- | ----- |
| Vector only                 | 1.00     | 1.00      | 0.901 |
| Hybrid (vector + BM25, RRF) | 1.00     | 1.00      | 0.950 |

Recall ties at the ceiling: every evidence chunk is in the top 6 in both. Against vector-only, hybrid moves two questions up (rank 2 → 1 and 5 → 1) and one down (3 → 4). Stopwords, stemming and the title column (§6) raised hybrid MRR from 0.920, the run before them. With 21 chunks on unrelated topics the embedding has few near-misses, and the questions deliberately avoid chunk wording, which removes most of BM25's advantage. The case hybrid exists for, an exact token the embedding misses, is proven by the hybrid E2E test rather than by this corpus. 25 questions show direction, not statistical significance.

## 11. Decisions and tradeoffs

| Decision         | What I chose                              | Alternatives I considered           | Why                                                                            | What it costs                                                                            |
| ---------------- | ----------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| Storage          | SQLite via `node:sqlite`                  | Postgres, in-memory                 | One file, no services, transactions across all tables, survives restarts       | Single writer, single machine (§12). `node:sqlite` is release-candidate in Node 24       |
| Vector store     | sqlite-vec in the same file               | A separate vector DB                | Retrieval joins against items in one query. Deletes are transactional          | Brute-force O(n) per query                                                               |
| Keyword search   | FTS5 + RRF                                | Vector only                         | Exact-token recall for little code. No score calibration                       | A second index, kept in sync in the same transaction                                     |
| Async ingestion  | DB as queue, in-process worker            | Synchronous request, BullMQ + Redis | Fast requests, per-item failures, restart-safe                                 | Ingestion shares CPU and failure fate with the API                                       |
| Chunking         | Recursive, structure-aware                | Fixed windows, semantic             | §5.3                                                                           | Depends on extraction preserving structure                                               |
| Chunk context    | Item title in keyword search only         | Contextual Retrieval, late chunking | §5.3. Late chunking needs token-level embeddings, which OpenAI does not expose | A chunk that depends on an earlier section, beyond the title, can be missed              |
| Relevance cutoff | Model abstains via prompt                 | Score threshold                     | Thresholds do not transfer across models, corpora or RRF                       | The model may stretch weak sources. Citations make it visible                            |
| Answer transport | Streaming                                 | JSON response                       | Sources show immediately, tokens stream                                        | Errors after the first byte cannot use status codes, so all fallible pre-work runs first |
| Conversation     | Client-held history, rewrite on follow-up | Single-turn, server sessions        | Follow-ups work with no session storage                                        | One extra LLM call per follow-up. The conversation is lost on reload                     |
| Frontend state   | TanStack Query + `useChat`                | A global store                      | Each kind of state already has an owner (§3)                                   | Item status arrives by polling, up to 1.5 s late                                         |

## 12. What breaks at scale

In roughly the order it would hurt:

1. **Vector search is a linear scan.** 1536 float32 dims is 6 KB per chunk, so 1M chunks means scanning about 6 GB per question.
2. **`node:sqlite` is synchronous.** A slow query blocks the event loop, including every in-flight stream.
3. **Single writer, single machine.** No horizontal scaling.
4. **The worker shares the API process.** Bulk imports compete with query latency. There is no backoff scheduling or dead-letter handling.
5. **Changing the embedding model** means re-embedding everything. Today the server refuses to start instead.
6. **`GET /items` is unpaginated,** and the UI polls it for status.
7. **No auth or tenancy.** Every query searches everything.

## 13. Production changes

The storage and queue picks depend on scale and on what the team already runs, so treat them as starting points.

| Area               | Change                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Storage and search | Postgres with pgvector (HNSW) and full-text search as the smallest step: approximate search, concurrent writers, backups, and still one transaction per item. A dedicated vector store or search engine once vector count or query load outgrows one database, at the cost of syncing two stores |
| Ingestion          | A Postgres-backed queue (`SKIP LOCKED`, e.g. pg-boss) if Postgres is already there, or a dedicated broker (SQS, BullMQ) at higher volume. Either way a separately scaled worker, backoff, dead-letter state, provider rate limiting                                                              |
| Retrieval quality  | Cross-encoder reranking after fusion. Contextual Retrieval once the corpus has long documents. Date and source filters extracted from the question. Small-to-big retrieval. Query decomposition for multi-part questions. A larger eval set plus LLM-judged faithfulness as a CI gate            |
| Tenancy            | Auth, `user_id` on items, every query scoped by user                                                                                                                                                                                                                                             |
| SSRF               | Pin the resolved IP per connection, or route fetches through an egress proxy                                                                                                                                                                                                                     |
| Status updates     | Push ingestion status over SSE instead of polling                                                                                                                                                                                                                                                |
| Observability      | Ship events to a log backend, trace ids from request to worker, redact question text                                                                                                                                                                                                             |
| Abuse and cost     | Per-user rate limits, quotas, provider spend caps                                                                                                                                                                                                                                                |
| Model migrations   | Re-embed in the background into a new vector column, then switch over                                                                                                                                                                                                                            |

## 14. Security notes

- **SSRF:** §5.2.
- **Prompt injection via saved pages:** page content ends up in the prompt. Sources are delimited and the system prompt treats them as data, which reduces the risk without removing it. The model has no tools or write access, so the worst case is a misleading answer, traceable through its citations.
- **No auth:** the app assumes a trusted local user.
- **Secrets:** `OPENAI_API_KEY` is marked sensitive in the Varlock schema and lives only in the git-ignored `apps/server/.env`. CI needs no secrets.
