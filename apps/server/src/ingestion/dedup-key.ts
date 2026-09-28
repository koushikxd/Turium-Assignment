import type { IngestRequest } from "@turium-assignment/contracts";
import { createHash } from "node:crypto";

// Notes match on their text after normalizing line endings, Unicode form and
// surrounding whitespace, so a pasted copy of the same note is a duplicate.
export function dedupKey(request: IngestRequest) {
  if (request.type === "url") return `url:${new URL(request.url).href}`;
  const text = request.text.replaceAll("\r\n", "\n").normalize("NFC").trim();
  return `note:${createHash("sha256").update(text).digest("hex")}`;
}
