import type { IngestRequest, Item } from "@turium-assignment/contracts";
import type { DatabaseSync } from "node:sqlite";

import { insertItem } from "../items/repository";
import { dedupKey } from "./dedup-key";
import { isUrlAllowed } from "./network-policy";
import type { NetworkPolicy } from "./network-policy";

// Turns a validated request into a pending item, or says why it did not.
export async function submitItem(
  db: DatabaseSync,
  policy: NetworkPolicy,
  request: IngestRequest,
): Promise<{ item: Item } | { existingItemId: number } | { blocked: true }> {
  if (request.type === "url" && !(await isUrlAllowed(new URL(request.url), policy))) {
    return { blocked: true };
  }
  return insertItem(
    db,
    request.type === "url"
      ? { type: "url", title: null, url: request.url, content: null, dedupKey: dedupKey(request) }
      : {
          type: "note",
          title: request.title ?? firstLine(request.text).slice(0, 80),
          url: null,
          content: request.text,
          dedupKey: dedupKey(request),
        },
  );
}

function firstLine(text: string) {
  const [line = ""] = text.split("\n", 1);
  return line.trim();
}
