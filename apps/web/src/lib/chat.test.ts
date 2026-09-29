import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";

import { listedSources, type QueryMessage, remarkCitations, toQueryRequest } from "@/lib/chat";

// Rendered through react-markdown, as the chat does, so markdown decides what is code or a link.
function render(markdown: string, ns: ReadonlySet<number> = new Set([1, 2, 3])) {
  return renderToStaticMarkup(
    createElement(ReactMarkdown, { remarkPlugins: [remarkGfm, [remarkCitations, ns]] }, markdown),
  );
}

describe("remarkCitations", () => {
  it("links a single marker", () => {
    expect(render("Paris is the capital [1].")).toBe(
      '<p>Paris is the capital <a href="#cite-1">1</a>.</p>',
    );
  });

  it("splits a grouped marker into one link per source", () => {
    expect(render("Both agree [1, 3].")).toBe(
      '<p>Both agree <a href="#cite-1">1</a><a href="#cite-3">3</a>.</p>',
    );
  });

  it("leaves a marker for an unknown source as text", () => {
    expect(render("Made up [9].")).toBe("<p>Made up [9].</p>");
  });

  it("links the valid numbers of a mixed group and keeps the rest as text", () => {
    expect(render("Mixed [1, 9, 2].")).toBe(
      '<p>Mixed <a href="#cite-1">1</a>[9]<a href="#cite-2">2</a>.</p>',
    );
  });

  it("links nothing when there are no sources", () => {
    expect(render("No sources [1].", new Set())).toBe("<p>No sources [1].</p>");
  });

  it("leaves non-numeric brackets and markdown links alone", () => {
    expect(
      render("As noted [see above], read [the docs](https://x.dev) or [2](https://y.dev)."),
    ).toBe(
      '<p>As noted [see above], read <a href="https://x.dev">the docs</a> or <a href="https://y.dev">2</a>.</p>',
    );
  });

  it("leaves markers in inline code and code blocks alone", () => {
    expect(render("Use `arr[1]` here [1].\n\n```\na[2]\n```")).toBe(
      '<p>Use <code>arr[1]</code> here <a href="#cite-1">1</a>.</p>\n<pre><code>a[2]\n</code></pre>',
    );
  });

  it("does not nest a citation inside a link", () => {
    expect(render("[see [1]](https://x.dev)")).toBe('<p><a href="https://x.dev">see [1]</a></p>');
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

function source(n: number) {
  return { n, chunkId: n, itemId: n, title: null, url: null, snippet: `s${n}` };
}

function answer(citations?: number[]): QueryMessage {
  return {
    id: "a",
    role: "assistant",
    parts: [
      { type: "data-sources", data: { query: "q", sources: [source(1), source(2), source(3)] } },
      { type: "text", text: "answer" },
      ...(citations ? [{ type: "data-citations" as const, data: { citations } }] : []),
    ],
  };
}

describe("listedSources", () => {
  it("lists every retrieved source while the answer streams", () => {
    expect(listedSources(answer()).map((s) => s.n)).toEqual([1, 2, 3]);
  });

  it("lists only the cited sources once citations arrive", () => {
    expect(listedSources(answer([3, 1])).map((s) => s.n)).toEqual([1, 3]);
  });

  it("lists nothing when the finished answer cites nothing", () => {
    expect(listedSources(answer([]))).toEqual([]);
  });

  it("lists nothing before sources arrive", () => {
    expect(listedSources({ id: "a", role: "assistant", parts: [] })).toEqual([]);
  });
});
