import { readMemoryLogs } from "evlog/memory";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { expectProblem } from "../support/api";
import { startApp } from "../support/app";

let app: Awaited<ReturnType<typeof startApp>>;

beforeEach(async () => {
  app = await startApp();
});

afterEach(async () => {
  await app.close();
});

describe("GET /health", () => {
  test("returns ok when the database answers", async () => {
    const response = await fetch(`${app.url}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  test("returns 503 problem+json when the database is gone", async () => {
    app.db.close();
    await expectProblem(await fetch(`${app.url}/health`), 503, "SERVICE_UNAVAILABLE");
  });
});

describe("errors", () => {
  test("an unknown route is a 404 ROUTE_NOT_FOUND", async () => {
    const body = await expectProblem(await fetch(`${app.url}/nope`), 404, "ROUTE_NOT_FOUND");
    expect(body.type).toBe("/problems/route-not-found");
  });

  test("an inbound x-request-id is replaced by the server's own", async () => {
    const response = await fetch(`${app.url}/nope`, { headers: { "x-request-id": "client-id" } });
    const body = await expectProblem(response, 404, "ROUTE_NOT_FOUND");
    expect(body.requestId).not.toBe("client-id");
  });

  test("a body over 1 MB is a 413 PAYLOAD_TOO_LARGE", async () => {
    const response = await fetch(`${app.url}/health`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: "x".repeat(1.1 * 1024 * 1024) }),
    });
    await expectProblem(response, 413, "PAYLOAD_TOO_LARGE");
  });

  test("malformed JSON is a 400 VALIDATION_FAILED", async () => {
    const response = await fetch(`${app.url}/health`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{not json",
    });
    await expectProblem(response, 400, "VALIDATION_FAILED");
  });
});

describe("logging", () => {
  test("each request emits exactly one wide event with its request id", async () => {
    const responses = [await fetch(`${app.url}/health`), await fetch(`${app.url}/nope`)];

    for (const response of responses) {
      const requestId = response.headers.get("x-request-id");
      await vi.waitFor(() =>
        expect(readMemoryLogs({ filter: (event) => event.requestId === requestId })).toHaveLength(
          1,
        ),
      );
    }
    const [health, missing] = responses.map((response) =>
      readMemoryLogs({
        filter: (event) => event.requestId === response.headers.get("x-request-id"),
      }),
    );
    expect(health?.[0]).toMatchObject({ method: "GET", path: "/health", status: 200 });
    expect(missing?.[0]).toMatchObject({ method: "GET", path: "/nope", status: 404 });
  });
});
