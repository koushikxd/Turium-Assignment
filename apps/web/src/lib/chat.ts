import type { QueryDataTypes, QueryRequest } from "@turium-assignment/contracts";
import type { UIMessage } from "ai";

export type QueryMessage = UIMessage<never, QueryDataTypes>;

const HISTORY_MAX = 12;
const CONTENT_MAX = 8000;

export function messageText(message: QueryMessage): string {
  return message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
}

export function toQueryRequest(messages: QueryMessage[]): QueryRequest {
  const lastUser = messages.findLastIndex((m) => m.role === "user");
  const lastUserMessage = messages[lastUser];
  const question = lastUserMessage ? messageText(lastUserMessage) : "";
  const history = messages
    .slice(0, Math.max(lastUser, 0))
    .flatMap((m) => {
      const content = messageText(m).slice(0, CONTENT_MAX);
      if (!content.trim() || m.role === "system") return [];
      return [{ role: m.role, content }];
    })
    .slice(-HISTORY_MAX);
  return { question, history };
}

// `[1]` or `[1, 3]`.
const MARKER = /\[(\d+(?:\s*,\s*\d+)*)\]/g;

// The mdast fields this plugin touches. @types/mdast is not a direct dependency.
type MdNode = { type: string; value?: string; url?: string; children?: MdNode[] };

// A remark plugin that turns markers into `#cite-n` links, for an `n` in `ns`. It runs on
// the parsed tree, so brackets in code, and in the text of an existing link, stay as they are.
export function remarkCitations(ns: ReadonlySet<number>) {
  return (tree: MdNode) => linkMarkers(tree, ns);
}

function linkMarkers(node: MdNode, ns: ReadonlySet<number>) {
  if (!node.children || node.type === "link" || node.type === "linkReference") return;
  node.children = node.children.flatMap((child) => {
    if (child.type === "text") return splitMarkers(child.value ?? "", ns);
    linkMarkers(child, ns);
    return [child];
  });
}

function splitMarkers(text: string, ns: ReadonlySet<number>): MdNode[] {
  const nodes: MdNode[] = [];
  let last = 0;
  for (const match of text.matchAll(MARKER)) {
    const [marker, group = ""] = match;
    nodes.push({ type: "text", value: text.slice(last, match.index) });
    for (const n of group.split(",").map((s) => Number(s.trim()))) {
      nodes.push(
        ns.has(n)
          ? { type: "link", url: `#cite-${n}`, children: [{ type: "text", value: String(n) }] }
          : { type: "text", value: `[${n}]` },
      );
    }
    last = match.index + marker.length;
  }
  nodes.push({ type: "text", value: text.slice(last) });
  return nodes;
}
