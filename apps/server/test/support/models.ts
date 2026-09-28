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

export function fakeEmbeddingModel(modelId = "text-embedding-3-small") {
  return new MockEmbeddingModelV4({
    modelId,
    maxEmbeddingsPerCall: 2048,
    doEmbed: async ({ values }) => ({ embeddings: values.map(embedText), warnings: [] }),
  });
}

export function fakeChatModel(text: string) {
  return new MockLanguageModelV4({
    modelId: "fake-chat",
    doStream: async () => ({
      stream: simulateReadableStream({
        chunks: [
          { type: "stream-start", warnings: [] },
          { type: "text-start", id: "text-1" },
          ...text
            .split(/(?<= )/)
            .map((delta) => ({ type: "text-delta" as const, id: "text-1", delta })),
          { type: "text-end", id: "text-1" },
          {
            type: "finish",
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: { total: 0, noCache: 0, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 0, text: 0, reasoning: 0 },
            },
          },
        ],
      }),
    }),
  });
}
