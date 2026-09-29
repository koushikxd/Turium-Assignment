import { describe, expect, test } from "vitest";

import { ftsQuery } from "../../src/retrieval/fts-query";

describe("ftsQuery", () => {
  test("plain words become quoted terms joined by OR", () => {
    expect(ftsQuery("feed sourdough starter")).toBe('"feed" OR "sourdough" OR "starter"');
  });

  test("stopwords are dropped, whatever their case", () => {
    expect(ftsQuery("when do i have meetings")).toBe('"meetings"');
    expect(ftsQuery("feed The starter")).toBe('"feed" OR "starter"');
  });

  test("contraction fragments are dropped with their stopwords", () => {
    expect(ftsQuery("what's my passport number")).toBe('"passport" OR "number"');
    expect(ftsQuery("I'm sure you're right, they'll see")).toBe(
      '"sure" OR "right" OR "they" OR "see"',
    );
  });

  test("a name that is also a common word is kept", () => {
    expect(ftsQuery("meeting with Will")).toBe('"meeting" OR "Will"');
  });

  test("a query of only stopwords gives null", () => {
    expect(ftsQuery("what is it")).toBeNull();
  });

  test("FTS5 syntax characters never reach the query", () => {
    expect(ftsQuery('"unbalanced')).toBe('"unbalanced"');
    expect(ftsQuery("feed*")).toBe('"feed"');
    expect(ftsQuery("-wifi")).toBe('"wifi"');
    expect(ftsQuery("(x y)")).toBe('"x" OR "y"');
    expect(ftsQuery("body:wifi")).toBe('"body" OR "wifi"');
    expect(ftsQuery("^start")).toBe('"start"');
  });

  test("FTS5 keywords are quoted as literals or dropped as stopwords", () => {
    expect(ftsQuery("sourdough AND")).toBe('"sourdough"');
    expect(ftsQuery("OR")).toBeNull();
    expect(ftsQuery("NOT wifi")).toBe('"NOT" OR "wifi"');
    expect(ftsQuery("NEAR(wifi password)")).toBe('"NEAR" OR "wifi" OR "password"');
  });

  test("Unicode letters are kept whole", () => {
    expect(ftsQuery("café 東京 привет")).toBe('"café" OR "東京" OR "привет"');
  });

  test("an ID splits the way unicode61 indexed it", () => {
    expect(ftsQuery("ZX-4471")).toBe('"ZX" OR "4471"');
  });

  test("input without tokens gives null", () => {
    expect(ftsQuery("")).toBeNull();
    expect(ftsQuery("   \n\t")).toBeNull();
    expect(ftsQuery("*** -- ()")).toBeNull();
  });
});
