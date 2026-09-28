import { describe, expect, it } from "vitest";

import { problemMessage } from "@/lib/api";

describe("problemMessage", () => {
  it("returns detail from a problem+json body", () => {
    const body = JSON.stringify({
      type: "about:blank",
      title: "Conflict",
      status: 409,
      detail: "Add a note or URL before asking.",
      code: "KNOWLEDGE_BASE_EMPTY",
      requestId: "r1",
    });
    expect(problemMessage(body)).toBe("Add a note or URL before asking.");
  });

  it("passes plain text through", () => {
    expect(problemMessage("Failed to fetch")).toBe("Failed to fetch");
  });

  it("passes JSON that is not a problem through", () => {
    expect(problemMessage('{"foo":1}')).toBe('{"foo":1}');
  });
});
