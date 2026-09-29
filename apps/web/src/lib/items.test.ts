import type { Item } from "@turium-assignment/contracts";
import { describe, expect, it } from "vitest";

import { pollInterval, toIngestRequest } from "@/lib/items";

function makeItem(status: Item["status"]): Item {
  return {
    id: 1,
    type: "note",
    title: null,
    url: null,
    status,
    error: null,
    truncated: false,
    chunkCount: 0,
    preview: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };
}

describe("pollInterval", () => {
  it("polls while an item is pending", () => {
    expect(pollInterval([makeItem("ready"), makeItem("pending")])).toBeTypeOf("number");
  });

  it("polls while an item is processing", () => {
    expect(pollInterval([makeItem("processing")])).toBeTypeOf("number");
  });

  it("stops when every item is ready or failed", () => {
    expect(pollInterval([makeItem("ready"), makeItem("failed")])).toBe(false);
  });

  it("stops for an empty list", () => {
    expect(pollInterval([])).toBe(false);
  });

  it("stops before data has loaded", () => {
    expect(pollInterval(undefined)).toBe(false);
  });
});

describe("toIngestRequest", () => {
  it("sends a lone http(s) URL as a url", () => {
    expect(toIngestRequest("https://example.com/a?b=1")).toEqual({
      type: "url",
      url: "https://example.com/a?b=1",
    });
    expect(toIngestRequest("  http://example.com  \n")).toEqual({
      type: "url",
      url: "http://example.com",
    });
  });

  it("accepts an uppercase scheme", () => {
    expect(toIngestRequest("HTTPS://example.com")).toEqual({
      type: "url",
      url: "HTTPS://example.com",
    });
  });

  it("sends text containing a URL as a note", () => {
    expect(toIngestRequest("read https://example.com later")).toEqual({
      type: "note",
      text: "read https://example.com later",
    });
    expect(toIngestRequest("https://a.com\nhttps://b.com")).toEqual({
      type: "note",
      text: "https://a.com\nhttps://b.com",
    });
  });

  it("sends a bare domain or another scheme as a note", () => {
    expect(toIngestRequest("example.com")).toEqual({ type: "note", text: "example.com" });
    expect(toIngestRequest("ftp://example.com")).toEqual({
      type: "note",
      text: "ftp://example.com",
    });
  });

  it("trims a multi-line note", () => {
    expect(toIngestRequest("\n  first line\nsecond  \n")).toEqual({
      type: "note",
      text: "first line\nsecond",
    });
  });

  it("returns undefined for blank input", () => {
    expect(toIngestRequest("  \n ")).toBeUndefined();
  });
});
