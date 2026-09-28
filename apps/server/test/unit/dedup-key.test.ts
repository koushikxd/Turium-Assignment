import { describe, expect, test } from "vitest";

import { dedupKey } from "../../src/ingestion/dedup-key";

const note = (text: string, title?: string) => dedupKey({ type: "note", text, title });
const url = (value: string) => dedupKey({ type: "url", url: value });

describe("dedupKey", () => {
  test("the same text gives the same key", () => {
    expect(note("hello world")).toBe(note("hello world"));
  });

  test("different text gives a different key", () => {
    expect(note("hello world")).not.toBe(note("hello there"));
  });

  test("CRLF and LF line endings give the same key", () => {
    expect(note("line one\r\nline two")).toBe(note("line one\nline two"));
  });

  test("surrounding whitespace is ignored", () => {
    expect(note("  hello world \n\n")).toBe(note("hello world"));
  });

  test("NFC and NFD forms give the same key", () => {
    expect(note("caf\u00e9")).toBe(note("cafe\u0301"));
  });

  test("the title does not affect the key", () => {
    expect(note("hello world", "A title")).toBe(note("hello world"));
  });

  test("case is significant", () => {
    expect(note("Hello world")).not.toBe(note("hello world"));
  });

  test("a note key is note: plus a sha256 hex digest", () => {
    expect(note("hello world")).toMatch(/^note:[0-9a-f]{64}$/);
  });

  test("a URL key is url: plus the WHATWG-normalized URL", () => {
    expect(dedupKey({ type: "url", url: "HTTPS://Example.COM" })).toBe("url:https://example.com/");
  });

  test("the fragment is ignored", () => {
    expect(url("https://example.com/a#section")).toBe(url("https://example.com/a"));
  });

  test("utm_* params are stripped, other params kept in order", () => {
    expect(url("https://example.com/a?b=2&utm_source=x&a=1&utm_medium=y")).toBe(
      "url:https://example.com/a?b=2&a=1",
    );
    expect(url("https://example.com/a?utm_source=x")).toBe("url:https://example.com/a");
  });

  test("param order is significant", () => {
    expect(url("https://example.com/a?a=1&b=2")).not.toBe(url("https://example.com/a?b=2&a=1"));
  });

  test("a trailing slash is significant", () => {
    expect(url("https://example.com/a/")).not.toBe(url("https://example.com/a"));
  });

  test("host case and the default port are ignored", () => {
    expect(url("https://EXAMPLE.com:443/a")).toBe(url("https://example.com/a"));
  });

  test("path case is significant", () => {
    expect(url("https://example.com/A")).not.toBe(url("https://example.com/a"));
  });

  test("http and https are different", () => {
    expect(url("http://example.com/a")).not.toBe(url("https://example.com/a"));
  });
});
