// Migration n (1-based) moves PRAGMA user_version from n - 1 to n. Append only:
// never edit a migration that has shipped. SQL lives in TS because tsdown bundles
// the server into one file, so .sql files would not exist next to it at runtime.
export const migrations = [
  `
  CREATE TABLE items (
    id            INTEGER PRIMARY KEY,
    type          TEXT NOT NULL CHECK (type IN ('note', 'url')),
    title         TEXT,
    url           TEXT,
    dedup_key     TEXT NOT NULL,
    content       TEXT,
    truncated     INTEGER NOT NULL DEFAULT 0,
    status        TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
    error_code    TEXT,
    error_message TEXT,
    created_at    TEXT NOT NULL,
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

  CREATE VIRTUAL TABLE chunk_vectors USING vec0 (embedding float[1536]);
  CREATE VIRTUAL TABLE chunks_fts    USING fts5 (body);

  CREATE TABLE meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  `,
  `
  DROP TABLE chunks_fts;
  CREATE VIRTUAL TABLE chunks_fts USING fts5 (title, body, tokenize = 'porter unicode61');
  INSERT INTO chunks_fts (rowid, title, body)
    SELECT c.id, CASE WHEN substr(c.text, 1, length(i.title)) = i.title THEN NULL ELSE i.title END, c.text
    FROM chunks c JOIN items i ON i.id = c.item_id;
  `,
];
