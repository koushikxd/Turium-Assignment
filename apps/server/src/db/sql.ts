import type { DatabaseSync } from "node:sqlite";

export const NOW = "strftime('%Y-%m-%dT%H:%M:%fZ', 'now')";

export function immediate<T>(db: DatabaseSync, work: () => T) {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = work();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
