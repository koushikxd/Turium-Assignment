import { simulateReadableStream } from "ai";
import { MockEmbeddingModelV4, MockLanguageModelV4 } from "ai/test";

import { EMBEDDING_DIMENSIONS } from "../../src/db/open";

// Deterministic bag-of-words: each word adds 1 to a hashed dimension, then the
// vector is normalized to unit length like OpenAI embeddings. Texts that share
// words land close together, so retrieval assertions stay meaningful offline.
export function embedText(text: string): number[] {
  const vector = Array.from({ length: EMBEDDING_DIMENSIONS }, () => 0);
  for (const word of text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []) {
    const index = fnv1a(word) % EMBEDDING_DIMENSIONS;
    vector[index] = (vector[index] ?? 0) + 1;
  }
  const norm = Math.hypot(...vector);
  return norm === 0 ? vector : vector.map((value) => value / norm);
}

function fnv1a(word: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < word.length; i++) {
    hash ^= word.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash;
}

// beforeEmbed runs before every embed call. Tests use it to hold a job at the
// embed stage (await a promise) or to make the provider fail (throw).
export function fakeEmbeddingModel(
  modelId = "text-embedding-3-small",
  beforeEmbed?: (values: string[]) => Promise<void>,
) {
  return new MockEmbeddingModelV4({
    modelId,
    maxEmbeddingsPerCall: 2048,
    doEmbed: async ({ values }) => {
      await beforeEmbed?.(values);
      // One token per value. Without usage, evlog's embedding token count is NaN.
      return { embeddings: values.map(embedText), usage: { tokens: values.length }, warnings: [] };
    },
  });
}

const usage = {
  inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 0, text: 0, reasoning: 0 },
};

export const answerUsage = {
  inputTokens: { total: 120, noCache: 120, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 8, text: 8, reasoning: 0 },
};

type ChatScript = {
  // Streamed word by word by doStream, the answer call.
  answer: string;
  // Returned by doGenerate, the rewrite call.
  rewrite?: string;
  generateError?: Error;
  // Emitted after the answer text, in place of the finish chunk.
  streamError?: Error;
  chunkDelayMs?: number;
};

export function fakeChatModel(script: ChatScript) {
  return new MockLanguageModelV4({
    modelId: "fake-chat",
    doGenerate: async () => {
      if (script.generateError) throw script.generateError;
      return {
        content: [{ type: "text", text: script.rewrite ?? "" }],
        finishReason: { unified: "stop", raw: undefined },
        usage,
        warnings: [],
      };
    },
    doStream: async () => ({
      stream: simulateReadableStream({
        chunkDelayInMs: script.chunkDelayMs,
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "text-1" },
          ...script.answer
            .split(/(?<= )/)
            .map((delta) => ({ type: "text-delta" as const, id: "text-1", delta })),
          ...(script.streamError
            ? [{ type: "error" as const, error: script.streamError }]
            : [
                { type: "text-end" as const, id: "text-1" },
                {
                  type: "finish" as const,
                  finishReason: { unified: "stop" as const, raw: undefined },
                  usage: answerUsage,
                },
              ]),
        ],
      }),
    }),
  });
}
