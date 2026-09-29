import type { QuerySource } from "@turium-assignment/contracts";
import { type ComponentProps, createContext, memo, type ReactNode, use } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

import { CitationChip } from "@/components/chat/citation-chip";
import { Sources } from "@/components/chat/sources";
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { listedSources, messageText, type QueryMessage, remarkCitations } from "@/lib/chat";

const SourcesContext = createContext<QuerySource[]>([]);

const CITE_HREF = /^#cite-(\d+)$/;

function MarkdownLink({ href, children }: ComponentProps<"a">) {
  const sources = use(SourcesContext);
  const n = Number(CITE_HREF.exec(href ?? "")?.[1]);
  const source = sources.find((s) => s.n === n);
  if (source) return <CitationChip source={source} />;
  return (
    <a href={href} target="_blank" rel="noreferrer" className="underline underline-offset-4">
      {children}
    </a>
  );
}

function Heading({ children }: { children?: ReactNode }) {
  return <h3 className="mt-6 mb-2 text-base font-semibold">{children}</h3>;
}

const MARKDOWN_COMPONENTS: Components = {
  p: ({ children }) => <p className="my-3 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-3 list-disc space-y-1 pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="my-3 list-decimal space-y-1 pl-6">{children}</ol>,
  h1: Heading,
  h2: Heading,
  h3: Heading,
  h4: Heading,
  pre: ({ children }) => (
    <pre className="my-3 overflow-x-auto rounded-lg bg-muted p-3 text-sm [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  code: ({ children }) => (
    <code className="rounded-sm bg-muted px-1 py-0.5 font-mono text-[0.9em]">{children}</code>
  ),
  a: MarkdownLink,
};

function UserMessage({ text }: { text: string }) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble variant="muted" align="end">
          <BubbleContent className="rounded-lg px-4 py-2.5 text-base whitespace-pre-wrap">
            {text}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}

function AssistantMessage({
  text,
  sources,
  listed,
}: {
  text: string;
  sources: QuerySource[];
  listed: QuerySource[];
}) {
  return (
    <Message>
      <MessageContent className="gap-3 text-base leading-relaxed">
        {text ? (
          <SourcesContext value={sources}>
            <div>
              <ReactMarkdown
                remarkPlugins={[remarkGfm, [remarkCitations, new Set(sources.map((s) => s.n))]]}
                components={MARKDOWN_COMPONENTS}
              >
                {text}
              </ReactMarkdown>
            </div>
          </SourcesContext>
        ) : null}
        <Sources sources={listed} />
      </MessageContent>
    </Message>
  );
}

export const ChatMessage = memo(function ChatMessage({ message }: { message: QueryMessage }) {
  const text = messageText(message);
  if (message.role === "user") return <UserMessage text={text} />;
  const sources = message.parts.find((part) => part.type === "data-sources")?.data.sources ?? [];
  return <AssistantMessage text={text} sources={sources} listed={listedSources(message)} />;
});
