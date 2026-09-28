import { describe, expect, test } from "vitest";

import { rrf } from "../../src/retrieval/rrf";

const hits = (...chunkIds: number[]) =>
  chunkIds.map((chunkId, index) => ({ chunkId, rank: index + 1 }));

describe("rrf", () => {
  test("no lists, or only empty lists, give no results", () => {
    expect(rrf([])).toEqual([]);
    expect(rrf([[], []])).toEqual([]);
  });

  test("a single list keeps its order with score 1/(60+rank)", () => {
    expect(rrf([hits(7, 3)])).toEqual([
      { chunkId: 7, score: 1 / 61, ranks: [1] },
      { chunkId: 3, score: 1 / 62, ranks: [2] },
    ]);
  });

  test("a chunk in both lists sums its scores and beats a single-list chunk at the same rank", () => {
    const fused = rrf([hits(1, 2), hits(2)]);
    expect(fused[0]).toEqual({ chunkId: 2, score: 1 / 62 + 1 / 61, ranks: [2, 1] });
    expect(fused[1]).toEqual({ chunkId: 1, score: 1 / 61, ranks: [1, null] });
  });

  test("a chunk only in the second list has a null first rank", () => {
    expect(rrf([hits(1), hits(1, 9)])[1]).toEqual({ chunkId: 9, score: 1 / 62, ranks: [null, 2] });
  });

  test("equal scores keep first-list order", () => {
    expect(rrf([hits(1), hits(2)]).map((result) => result.chunkId)).toEqual([1, 2]);
    expect(rrf([hits(5, 6), hits(6, 5)]).map((result) => result.chunkId)).toEqual([5, 6]);
  });
});
