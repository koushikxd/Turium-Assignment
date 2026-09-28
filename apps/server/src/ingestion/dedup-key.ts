import type { IngestRequest } from "@turium-assignment/contracts";
import { createHash } from "node:crypto";

// URLs match on the WHATWG href (lowercased scheme and host, no default port,
// normalized path) without the fragment and utm_* tracking params. The raw query
// pairs are filtered, not re-serialized, so the other params keep their encoding.
function normalizeUrl(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = url.search
    .slice(1)
    .split("&")
    .filter((pair) => pair !== "" && !pair.startsWith("utm_"))
    .join("&");
  return url.href;
}

// Notes match on their text after normalizing line endings, Unicode form and
// surrounding whitespace, so a pasted copy of the same note is a duplicate.
export function dedupKey(request: IngestRequest) {
  if (request.type === "url") return `url:${normalizeUrl(request.url)}`;
  const text = request.text.replaceAll("\r\n", "\n").normalize("NFC").trim();
  return `note:${createHash("sha256").update(text).digest("hex")}`;
}
