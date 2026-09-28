import { describe, expect, test } from "vitest";

import { ftsQuery } from "../../src/retrieval/fts-query";

describe("ftsQuery", () => {
  test("plain words become quoted terms joined by OR", () => {
    expect(ftsQuery("feed the starter")).toBe('"feed" OR "the" OR "starter"');
  });

  test("FTS5 syntax characters never reach the query", () => {
    expect(ftsQuery('"unbalanced')).toBe('"unbalanced"');
    expect(ftsQuery("feed*")).toBe('"feed"');
    expect(ftsQuery("-wifi")).toBe('"wifi"');
    expect(ftsQuery("(a b)")).toBe('"a" OR "b"');
    expect(ftsQuery("body:wifi")).toBe('"body" OR "wifi"');
    expect(ftsQuery("^start")).toBe('"start"');
  });

  test("FTS5 keywords are quoted as literals", () => {
    expect(ftsQuery("sourdough AND")).toBe('"sourdough" OR "AND"');
    expect(ftsQuery("OR")).toBe('"OR"');
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
