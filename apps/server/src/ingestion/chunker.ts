// Sizes are in chars, estimated as 4 chars per token (ARCHITECTURE §5.3).
const CHARS_PER_TOKEN = 4;
const TARGET_TOKENS = 400;
const OVERLAP_TOKENS = 60;

const OVERLAP = OVERLAP_TOKENS * CHARS_PER_TOKEN;
// The overlap is prepended to each span, so the span itself gets the rest of the target.
const BODY = TARGET_TOKENS * CHARS_PER_TOKEN - OVERLAP;
const MIN_TAIL = (TARGET_TOKENS * CHARS_PER_TOKEN) / 4;

// Coarsest first: paragraph, line, sentence end, whitespace. Lookbehinds keep each
// separator on the segment before it, so segments concatenate back to the input.
const boundaries = [
  /(?<=\n[ \t]*\n)(?![ \t]*\n)/,
  /(?<=\n)(?!\n)/,
  /(?<=[.!?]["')\]]*\s+)(?!\s)/,
  /(?<=\s)(?!\s)/,
];

export function chunk(input: string): string[] {
  const text = input.replaceAll("\r\n", "\n");
  if (text.trim() === "") return [];

  const spans: { start: number; end: number }[] = [];
  let start = 0;
  let end = 0;
  for (const segment of split(text, 0)) {
    if (end > start && end - start + segment.length > BODY) {
      spans.push({ start, end });
      start = end;
    }
    end += segment.length;
  }
  const last = spans.at(-1);
  if (last && end - start < MIN_TAIL) last.end = end;
  else spans.push({ start, end });

  return spans
    .map((span) => text.slice(overlapStart(text, span.start), span.end).trim())
    .filter((piece) => piece !== "");
}

function split(text: string, level: number): string[] {
  if (text.length <= BODY) return [text];
  const boundary = boundaries[level];
  if (!boundary) {
    return Array.from({ length: Math.ceil(text.length / BODY) }, (_, i) =>
      text.slice(i * BODY, (i + 1) * BODY),
    );
  }
  return text.split(boundary).flatMap((segment) => split(segment, level + 1));
}

// Back up by the overlap, then forward to the next word start so the overlap
// never opens mid-word. With no whitespace in range, there is no overlap.
function overlapStart(text: string, start: number) {
  const from = start - OVERLAP;
  if (from <= 0) return 0;
  const offset = text.slice(from - 1, start).search(/\s/);
  return offset === -1 ? start : from + offset;
}
