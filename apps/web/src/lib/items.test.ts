import type { Item } from "@turium-assignment/contracts";
import { describe, expect, it } from "vitest";

import { pollInterval } from "@/lib/items";

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
