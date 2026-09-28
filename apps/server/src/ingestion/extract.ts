import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";

import { ItemFailure } from "./pipeline";
import type { FetchedPage } from "./url-fetcher";

const MAX_CHARS = 100_000;
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const BLOCKS = new Set([
  "ADDRESS",
  "ARTICLE",
  "ASIDE",
  "BLOCKQUOTE",
  "DD",
  "DIV",
  "DL",
  "DT",
  "FIGCAPTION",
  "FIGURE",
  "FOOTER",
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "HEADER",
  "HR",
  "LI",
  "OL",
  "P",
  "SECTION",
  "TABLE",
  "TD",
  "TH",
  "TR",
  "UL",
]);

// The tsconfig has no DOM lib, so linkedom's and Readability's DOM types do not
// resolve. This is the part of a node the text walk reads.
type DomNode = {
  nodeType: number;
  nodeName: string;
  textContent: string | null;
  childNodes: Iterable<DomNode>;
};

export type Extraction = { title: string | null; text: string; truncated: boolean };

export function extract(page: FetchedPage): Extraction {
  const { title, text } =
    page.contentType === "text/html"
      ? extractHtml(page.body)
      : { title: null, text: page.body.trim() };
  if (text === "") {
    throw new ItemFailure("EXTRACTION_EMPTY", "No readable text was found at the URL.");
  }
  return { title, text: text.slice(0, MAX_CHARS), truncated: text.length > MAX_CHARS };
}

function extractHtml(html: string) {
  // Readability throws on a document parsed from an empty string.
  if (html.trim() === "") return { title: null, text: "" };
  const { document } = parseHTML(html);
  // The serializer hands back the content element itself instead of an HTML string.
  const article = new Readability(document, { serializer: (node: DomNode) => node }).parse();
  return {
    title: article?.title?.trim() || null,
    text: article?.content ? toText(article.content) : "",
  };
}

// Block elements become paragraphs separated by blank lines, which the chunker
// splits on first. Readability's textContent would flatten them (ARCHITECTURE §5.3).
function toText(root: DomNode) {
  const paragraphs: string[] = [];
  let inline = "";

  function flush() {
    const text = inline
      .split("\n")
      .map((line) => line.replaceAll(/ +/g, " ").trim())
      .join("\n")
      .trim();
    if (text !== "") paragraphs.push(text);
    inline = "";
  }

  function walk(node: DomNode) {
    if (node.nodeType === TEXT_NODE) {
      inline += (node.textContent ?? "").replaceAll(/\s+/g, " ");
      return;
    }
    if (node.nodeType !== ELEMENT_NODE) return;
    if (node.nodeName === "BR") {
      inline += "\n";
      return;
    }
    if (node.nodeName === "PRE") {
      flush();
      const code = (node.textContent ?? "").replace(/^\n+/, "").trimEnd();
      if (code !== "") paragraphs.push(code);
      return;
    }
    const block = BLOCKS.has(node.nodeName);
    if (block) flush();
    for (const child of node.childNodes) walk(child);
    if (block) flush();
  }

  walk(root);
  flush();
  return paragraphs.join("\n\n");
}
