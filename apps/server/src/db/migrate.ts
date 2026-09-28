import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { migrations } from "./migrations";

const userVersion = z.object({ user_version: z.number().int() });

export function migrate(db: DatabaseSync) {
  const { user_version: current } = userVersion.parse(db.prepare("PRAGMA user_version").get());
  for (const [index, sql] of migrations.entries()) {
    const version = index + 1;
    if (version <= current) continue;
    db.exec("BEGIN IMMEDIATE");
    try {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec("COMMIT");
    } catch (error) {
      db.exec("ROLLBACK");
      throw error;
    }
  }
}
