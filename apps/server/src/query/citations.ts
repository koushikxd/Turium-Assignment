// `[1]` or `[1, 3]`. Anything else in brackets (`[a]`, `[1.5]`, `[1,]`) is not a marker.
const MARKER = String.raw`\[(\d+(?:\s*,\s*\d+)*)\]`;

// Both lists are unique, in order of first appearance. A number is valid when it
// names a source that was sent (1..sourceCount), not when the source supports the claim.
export function parseCitations(text: string, sourceCount: number) {
  const citations = new Set<number>();
  const invalid = new Set<number>();
  for (const [, group = ""] of text.matchAll(new RegExp(MARKER, "g"))) {
    for (const part of group.split(",")) {
      const n = Number(part.trim());
      if (n >= 1 && n <= sourceCount) citations.add(n);
      else invalid.add(n);
    }
  }
  return { citations: [...citations], invalid: [...invalid] };
}

// History is re-sent without markers: its numbers point at an earlier turn's sources.
export function stripCitations(text: string) {
  return text.replace(new RegExp(String.raw`\s*${MARKER}`, "g"), "");
}
