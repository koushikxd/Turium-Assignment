import type {
  ChatMessage,
  QueryDataTypes,
  QueryRequest,
  QuerySource,
} from "@turium-assignment/contracts";
import { createUIMessageStream, embed, streamText, toUIMessageStream } from "ai";
import type { ToolSet, UIMessage } from "ai";
import { createAILogger } from "evlog/ai";
import { useLogger } from "evlog/express";
import type { DatabaseSync } from "node:sqlite";

import type { Models } from "../app";
import { AppError, toError } from "../http/errors";
import { hasReadyItems } from "../items/repository";
import { retrieve } from "../retrieval/retrieve";
import { parseCitations, stripCitations } from "./citations";
import { buildPrompt } from "./prompt";
import { rewriteQuery } from "./rewrite";

type QueryMessage = UIMessage<never, QueryDataTypes>;

const STREAM_ERROR = "The answer could not be generated. Please try again.";

// Throws AppError before anything is streamed (409, 502), so the route can still
// answer with problem+json. Failures after that arrive as an `error` stream part.
export async function answerQuery(
  db: DatabaseSync,
  models: Models,
  request: QueryRequest,
  signal: AbortSignal,
) {
  if (!hasReadyItems(db)) {
    throw new AppError("KNOWLEDGE_BASE_EMPTY", "Add an item and wait until it is ready.");
  }

  const log = useLogger();
  const ai = createAILogger(log);
  const { question } = request;
  const history = cleanHistory(request.history);
  log.set({ query: { questionLength: question.length, historyLength: history.length } });

  let query = question;
  let embedding: number[];
  try {
    if (history.length > 0) {
      const rewriteStarted = performance.now();
      query = await rewriteQuery(ai.wrap(models.chat), history, question);
      log.set({ query: { rewrittenQuery: query, rewriteMs: elapsed(rewriteStarted) } });
    } else {
      log.set({ query: { rewrittenQuery: query } });
    }
    const embedStarted = performance.now();
    const embedded = await embed({ model: models.embedding, value: query });
    ai.captureEmbed({ usage: embedded.usage });
    log.set({ query: { embedMs: elapsed(embedStarted) } });
    embedding = embedded.embedding;
  } catch (cause) {
    log.error(toError(cause));
    throw new AppError("UPSTREAM_AI_FAILED", "The AI provider failed. Please try again.");
  }

  const searchStarted = performance.now();
  const chunks = retrieve(db, { text: query, embedding });
  log.set({
    query: {
      searchMs: elapsed(searchStarted),
      results: chunks.map(({ chunkId, itemId, vectorRank, keywordRank, score }) => ({
        chunkId,
        itemId,
        vectorRank,
        keywordRank,
        score,
      })),
    },
  });
  const sources: QuerySource[] = chunks.map((chunk, index) => ({
    n: index + 1,
    chunkId: chunk.chunkId,
    itemId: chunk.itemId,
    title: chunk.title,
    url: chunk.url,
    snippet: chunk.text,
  }));

  return createUIMessageStream<QueryMessage>({
    execute: async ({ writer }) => {
      writer.write({ type: "data-sources", data: { query, sources } });

      const generateStarted = performance.now();
      const result = streamText({
        model: ai.wrap(models.chat),
        ...buildPrompt(question, history, chunks),
        abortSignal: signal,
        onError: ({ error }) => log.error(toError(error)),
      });

      // Iterated rather than merged, so data-citations lands after the last text
      // part and before `finish`, which must stay the final chunk.
      let answer = "";
      let failed = false;
      const parts = toUIMessageStream<ToolSet, QueryMessage>({
        stream: result.stream,
        onError: () => STREAM_ERROR,
      });
      for await (const part of parts) {
        if (part.type === "text-delta") answer += part.delta;
        if (part.type === "error") failed = true;
        if (part.type === "finish" && !failed && !signal.aborted) {
          const { citations, invalid } = parseCitations(answer, sources.length);
          writer.write({ type: "data-citations", data: { citations } });
          log.set({
            query: {
              generateMs: elapsed(generateStarted),
              citations: { valid: citations, invalid },
            },
          });
        }
        writer.write(part);
      }
    },
    onError: (cause) => {
      log.error(toError(cause));
      return STREAM_ERROR;
    },
  });
}

// Markers are the model's, so only assistant turns carry them. A user's `arr[0]` stays.
function cleanHistory(history: ChatMessage[]) {
  return history
    .map((message) =>
      message.role === "assistant"
        ? { role: message.role, content: stripCitations(message.content) }
        : message,
    )
    .filter((message) => message.content.trim() !== "");
}

function elapsed(started: number) {
  return Math.round(performance.now() - started);
}
