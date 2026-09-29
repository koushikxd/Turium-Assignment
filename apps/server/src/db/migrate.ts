import type { DatabaseSync } from "node:sqlite";
import { z } from "zod";

import { migrations } from "./migrations";
import { immediate } from "./sql";

const userVersion = z.object({ user_version: z.number().int() });

export function migrate(db: DatabaseSync) {
  const { user_version: current } = userVersion.parse(db.prepare("PRAGMA user_version").get());
  if (current > migrations.length) {
    throw new Error(
      `Database version mismatch: database has ${current}, server knows ${migrations.length}`,
    );
  }
  for (const [index, sql] of migrations.entries()) {
    const version = index + 1;
    if (version <= current) continue;
    immediate(db, () => {
      db.exec(sql);
      db.exec(`PRAGMA user_version = ${version}`);
    });
  }
}
