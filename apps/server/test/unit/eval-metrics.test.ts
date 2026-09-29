import { describe, expect, test } from "vitest";

import { hitRank, summarize } from "../../evals/metrics";

const label = { itemId: 2, evidence: "hold the button for 30 seconds" };

describe("hitRank", () => {
  test("is the 1-based rank of the first chunk with the expected item and the phrase", () => {
    const chunks = [
      { itemId: 1, text: "unrelated" },
      { itemId: 2, text: "To reset, hold the button for 30 seconds." },
      { itemId: 2, text: "Again: hold the button for 30 seconds." },
    ];
    expect(hitRank(chunks, label)).toBe(2);
  });

  test("the expected item without the phrase is not a hit", () => {
    expect(hitRank([{ itemId: 2, text: "The router sits in the hall." }], label)).toBeNull();
  });

  test("the phrase in another item is not a hit", () => {
    expect(hitRank([{ itemId: 3, text: "hold the button for 30 seconds" }], label)).toBeNull();
  });

  test("line breaks and repeated spaces in the chunk still match", () => {
    expect(hitRank([{ itemId: 2, text: "hold the\nbutton  for 30\tseconds" }], label)).toBe(1);
  });

  test("no chunks is no hit", () => {
    expect(hitRank([], label)).toBeNull();
  });
});

describe("summarize", () => {
  test("recall counts hits within the cutoff, MRR averages 1 / rank with misses as 0", () => {
    expect(summarize([1, 3, 7, null])).toEqual({
      recallAt6: 0.5,
      recallAt20: 0.75,
      failureAt20: 0.25,
      mrr: (1 + 1 / 3 + 1 / 7) / 4,
    });
  });

  test("a hit at rank 6 counts for recall@6, and one past 20 counts for nothing", () => {
    expect(summarize([6, 21])).toMatchObject({ recallAt6: 0.5, recallAt20: 0.5 });
  });
});
