import { useChat } from "@ai-sdk/react";
import { citationsData, sourcesData } from "@turium-assignment/contracts";
import { DefaultChatTransport } from "ai";

import { ChatMessage } from "@/components/chat/chat-message";
import { PromptForm } from "@/components/chat/prompt-form";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import { problemMessage } from "@/lib/api";
import { messageText, type QueryMessage, toQueryRequest } from "@/lib/chat";

const transport = new DefaultChatTransport<QueryMessage>({
  api: "/api/query",
  prepareSendMessagesRequest: ({ messages }) => ({ body: toQueryRequest(messages) }),
});

const DATA_PART_SCHEMAS = { sources: sourcesData, citations: citationsData };

export function Chat() {
  const { messages, sendMessage, status, stop, error } = useChat<QueryMessage>({
    transport,
    dataPartSchemas: DATA_PART_SCHEMAS,
  });

  const busy = status === "submitted" || status === "streaming";
  const last = messages.at(-1);
  // Sources stream before any text, so the turn is still "thinking" until text arrives.
  const thinking =
    status === "submitted" || (status === "streaming" && last !== undefined && !messageText(last));

  const form = (
    <PromptForm busy={busy} onSubmit={(text) => sendMessage({ text })} onStop={() => stop()} />
  );

  if (messages.length === 0) {
    return (
      <div className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col items-center justify-center gap-7 px-4 py-6">
        <h2 className="text-2xl font-semibold tracking-tight text-balance">
          Ask your knowledge base
        </h2>
        <div className="w-full">{form}</div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent className="mx-auto w-full max-w-3xl px-4 pt-6 pb-40">
              {messages.map((message) => (
                <MessageScrollerItem
                  key={message.id}
                  messageId={message.id}
                  scrollAnchor={message.role === "user"}
                >
                  <ChatMessage message={message} />
                </MessageScrollerItem>
              ))}
              {thinking && (
                <MessageScrollerItem messageId="thinking">
                  <div className="shimmer text-sm text-muted-foreground">Thinking…</div>
                </MessageScrollerItem>
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className="rounded-full data-[direction=end]:bottom-36" />
        </MessageScroller>
      </MessageScrollerProvider>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-background from-70% to-transparent pt-8 pb-[calc(1rem+env(safe-area-inset-bottom))]">
        <div className="pointer-events-auto mx-auto flex w-full max-w-3xl flex-col gap-2 px-4">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive"
            >
              {problemMessage(error.message)}
            </div>
          )}
          {form}
        </div>
      </div>
    </div>
  );
}
