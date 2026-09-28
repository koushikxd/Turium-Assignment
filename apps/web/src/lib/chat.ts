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

// `[1]` or `[1, 3]`, but not the text of a markdown link like `[2](https://...)`.
const MARKER = /\[(\d+(?:\s*,\s*\d+)*)\](?!\()/g;

export function linkCitations(text: string, ns: ReadonlySet<number>): string {
  return text.replace(MARKER, (_, group: string) =>
    group
      .split(",")
      .map((s) => Number(s.trim()))
      .map((n) => (ns.has(n) ? `[${n}](#cite-${n})` : `[${n}]`))
      .join(""),
  );
}
