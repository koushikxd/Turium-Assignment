import { itemsResponse, problemDetails } from "@turium-assignment/contracts";
import type { IngestRequest, Item, QueryRequest } from "@turium-assignment/contracts";
import { expect, vi } from "vitest";
import { z } from "zod";

export async function expectProblem(response: Response, status: number, code: string) {
  expect(response.status).toBe(status);
  expect(response.headers.get("content-type")).toMatch(/^application\/problem\+json/);
  const body = problemDetails.parse(await response.json());
  expect(body).toMatchObject({ status, code });
  expect(body.requestId).toBe(response.headers.get("x-request-id"));
  return body;
}

// Takes a plain record so tests can send bodies the contract rejects.
export function postIngest(url: string, body: IngestRequest | Record<string, string | number>) {
  return fetch(`${url}/ingest`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function listItems(url: string) {
  const response = await fetch(`${url}/items`);
  expect(response.status).toBe(200);
  return itemsResponse.parse(await response.json()).items;
}

// Polls GET /items until the item matches, e.g. reaches a terminal status.
export async function waitForItem(url: string, id: number, predicate: (item: Item) => boolean) {
  return vi.waitFor(
    async () => {
      const found = (await listItems(url)).find((item) => item.id === id);
      if (!found || !predicate(found)) throw new Error(`item ${id} not there yet`);
      return found;
    },
    { timeout: 5000, interval: 20 },
  );
}

export function postQuery(url: string, body: Partial<QueryRequest>, signal?: AbortSignal) {
  return fetch(`${url}/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
}

const streamPart = z.looseObject({ type: z.string(), data: z.json().optional() });

// The UI message stream is SSE: `data: <json>` events separated by blank lines,
// ending with `data: [DONE]`.
export async function readUIStream(response: Response) {
  expect(response.status).toBe(200);
  expect(response.headers.get("content-type")).toMatch(/^text\/event-stream/);
  return (await response.text())
    .split("\n\n")
    .filter((event) => event.startsWith("data: ") && event !== "data: [DONE]")
    .map((event) => streamPart.parse(JSON.parse(event.slice("data: ".length))));
}
