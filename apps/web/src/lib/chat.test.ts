import { describe, expect, it } from "vitest";

import { linkCitations, type QueryMessage, toQueryRequest } from "@/lib/chat";

describe("linkCitations", () => {
  const ns = new Set([1, 2, 3]);

  it("links a single marker", () => {
    expect(linkCitations("Paris is the capital [1].", ns)).toBe(
      "Paris is the capital [1](#cite-1).",
    );
  });

  it("splits a grouped marker into one link per source", () => {
    expect(linkCitations("Both agree [1, 3].", ns)).toBe("Both agree [1](#cite-1)[3](#cite-3).");
  });

  it("leaves a marker for an unknown source as text", () => {
    expect(linkCitations("Made up [9].", ns)).toBe("Made up [9].");
  });

  it("links the valid numbers of a mixed group and keeps the rest as text", () => {
    expect(linkCitations("Mixed [1, 9, 2].", ns)).toBe("Mixed [1](#cite-1)[9][2](#cite-2).");
  });

  it("links nothing when there are no sources", () => {
    expect(linkCitations("No sources [1].", new Set())).toBe("No sources [1].");
  });

  it("leaves non-numeric brackets and markdown links alone", () => {
    const text = "As noted [see above], read [the docs](https://x.dev) or [2](https://y.dev).";
    expect(linkCitations(text, ns)).toBe(text);
  });
});

function msg(id: string, role: "user" | "assistant", ...texts: string[]): QueryMessage {
  return { id, role, parts: texts.map((text) => ({ type: "text", text })) };
}

describe("toQueryRequest", () => {
  it("takes the question from the last user message and excludes it from history", () => {
    const req = toQueryRequest([
      msg("1", "user", "What is RRF?"),
      msg("2", "assistant", "Reciprocal ", "rank fusion [1]."),
      msg("3", "user", "Why use it?"),
    ]);
    expect(req).toEqual({
      question: "Why use it?",
      history: [
        { role: "user", content: "What is RRF?" },
        { role: "assistant", content: "Reciprocal rank fusion [1]." },
      ],
    });
  });

  it("keeps only the 12 most recent history messages", () => {
    const messages = Array.from({ length: 15 }, (_, i) =>
      msg(String(i), i % 2 === 0 ? "user" : "assistant", `m${i}`),
    );
    const req = toQueryRequest([...messages, msg("q", "user", "last")]);
    expect(req.history).toHaveLength(12);
    expect(req.history[0]?.content).toBe("m3");
    expect(req.history.at(-1)?.content).toBe("m14");
  });

  it("drops turns with no text, such as an assistant turn that failed before any text", () => {
    const req = toQueryRequest([
      msg("1", "user", "first"),
      { id: "2", role: "assistant", parts: [] },
      msg("3", "assistant", "  "),
      msg("4", "user", "second"),
    ]);
    expect(req.history).toEqual([{ role: "user", content: "first" }]);
  });

  it("slices history content to 8000 characters", () => {
    const req = toQueryRequest([msg("1", "assistant", "a".repeat(9000)), msg("2", "user", "q")]);
    expect(req.history[0]?.content).toHaveLength(8000);
  });
});
