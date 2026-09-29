import { isUrlAllowed } from "./network-policy";
import type { NetworkPolicy } from "./network-policy";
import { ItemFailure } from "./item-failure";

const MAX_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 5;
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const CONTENT_TYPES = ["text/html", "text/plain"] as const;

export type FetchedPage = {
  body: string;
  contentType: (typeof CONTENT_TYPES)[number];
  bytes: number;
};
export type FetchUrl = (url: string) => Promise<FetchedPage>;

// One timeout covers every redirect hop and the body read (ARCHITECTURE §5.2).
export function createUrlFetcher(policy: NetworkPolicy, timeoutMs = 10_000): FetchUrl {
  return async (url) => {
    const signal = AbortSignal.timeout(timeoutMs);
    try {
      const response = await fetchFollowingRedirects(new URL(url), policy, signal);
      if (!response.ok) {
        await response.body?.cancel();
        throw new ItemFailure("FETCH_FAILED", `The URL returned HTTP ${response.status}.`);
      }

      const header = response.headers.get("content-type") ?? "";
      const mediaType = header.split(";", 1)[0]?.trim().toLowerCase();
      const contentType = CONTENT_TYPES.find((type) => type === mediaType);
      if (!contentType) {
        await response.body?.cancel();
        throw new ItemFailure(
          "UNSUPPORTED_CONTENT_TYPE",
          `Only HTML and plain text are supported, not ${mediaType || "an unknown type"}.`,
        );
      }

      const bytes = await readCapped(response);
      return { body: decode(bytes, header), contentType, bytes: bytes.length };
    } catch (cause) {
      if (cause instanceof ItemFailure) throw cause;
      // The timeout is the only thing that aborts the signal.
      if (signal.aborted) {
        throw new ItemFailure("FETCH_TIMEOUT", `The URL did not respond within ${timeoutMs} ms.`, {
          cause,
        });
      }
      throw new ItemFailure("FETCH_FAILED", "The URL could not be fetched.", { cause });
    }
  };
}

async function fetchFollowingRedirects(start: URL, policy: NetworkPolicy, signal: AbortSignal) {
  let url = start;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new ItemFailure("URL_BLOCKED", "A redirect pointed to a non-HTTP URL.");
    }
    if (!(await isUrlAllowed(url, policy, signal))) {
      throw new ItemFailure("URL_BLOCKED", "The URL or a redirect resolves to a blocked address.");
    }
    const response = await fetch(url, { redirect: "manual", signal });
    const location = response.headers.get("location");
    if (!REDIRECT_STATUSES.has(response.status) || location === null) return response;
    await response.body?.cancel();
    url = new URL(location, url);
  }
  throw new ItemFailure("FETCH_FAILED", `The URL redirected more than ${MAX_REDIRECTS} times.`);
}

// Counts bytes as they arrive, so a body without content-length is still capped.
// Throwing out of the for-await cancels the stream, which aborts the download.
async function readCapped(response: Response) {
  if (!response.body) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for await (const chunk of response.body) {
    total += chunk.length;
    if (total > MAX_BYTES) {
      throw new ItemFailure("CONTENT_TOO_LARGE", "The page is larger than 5 MB.");
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function decode(bytes: Uint8Array, contentTypeHeader: string) {
  const charset = /charset\s*=\s*"?([^";\s]+)/i.exec(contentTypeHeader)?.[1];
  try {
    return new TextDecoder(charset ?? "utf-8").decode(bytes);
  } catch {
    // TextDecoder throws a RangeError on an unknown charset label.
    return new TextDecoder("utf-8").decode(bytes);
  }
}
