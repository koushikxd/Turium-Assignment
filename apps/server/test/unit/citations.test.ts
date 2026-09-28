import { describe, expect, test } from "vitest";

import { parseCitations, stripCitations } from "../../src/query/citations";

describe("parseCitations", () => {
  test("a single marker is a valid citation", () => {
    expect(parseCitations("Paris is the capital [1].", 3)).toEqual({ citations: [1], invalid: [] });
  });

  test("a grouped marker cites each number, with or without spaces", () => {
    expect(parseCitations("Both [1, 3].", 3).citations).toEqual([1, 3]);
    expect(parseCitations("Both [1,3].", 3).citations).toEqual([1, 3]);
  });

  test("a repeated number keeps its first position", () => {
    expect(parseCitations("A [2]. B [1]. C [2]. D [1, 2].", 3).citations).toEqual([2, 1]);
  });

  test("citations keep the order of first appearance, not numeric order", () => {
    expect(parseCitations("First [3], then [1].", 3).citations).toEqual([3, 1]);
  });

  test("numbers outside 1..sourceCount are invalid", () => {
    expect(parseCitations("Made up [9]. Zero [0].", 6)).toEqual({ citations: [], invalid: [9, 0] });
  });

  test("a group with one bad number keeps the good one", () => {
    expect(parseCitations("Mixed [1, 9].", 6)).toEqual({ citations: [1], invalid: [9] });
  });

  test("an invalid number is listed once", () => {
    expect(parseCitations("[7] and [7]", 2).invalid).toEqual([7]);
  });

  test("a marker glued to a word or punctuation still counts", () => {
    expect(parseCitations("claim[2]. Another(1)[1]", 2).citations).toEqual([2, 1]);
  });

  test("brackets that are not markers are ignored", () => {
    expect(parseCitations("[] [a] [1.5] [1,] [ 2] arr[i]", 6)).toEqual({
      citations: [],
      invalid: [],
    });
  });

  test("text without markers gives no citations", () => {
    expect(parseCitations("The sources do not cover this.", 6)).toEqual({
      citations: [],
      invalid: [],
    });
  });
});

describe("stripCitations", () => {
  test("removes a marker and the space before it", () => {
    expect(stripCitations("Paris is the capital [1].")).toBe("Paris is the capital.");
  });

  test("removes grouped and glued markers", () => {
    expect(stripCitations("A [1, 3] and B[2].")).toBe("A and B.");
  });

  test("removes markers for any number, valid or not", () => {
    expect(stripCitations("Made up [9].")).toBe("Made up.");
  });

  test("leaves brackets that are not markers alone", () => {
    expect(stripCitations("arr[i] and [a] stay")).toBe("arr[i] and [a] stay");
  });

  test("text without markers is unchanged", () => {
    expect(stripCitations("No markers here.")).toBe("No markers here.");
  });
});
