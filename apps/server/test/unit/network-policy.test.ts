import { describe, expect, test } from "vitest";

import { defaultNetworkPolicy, isUrlAllowed } from "../../src/ingestion/network-policy";

describe("defaultNetworkPolicy", () => {
  test.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.0.1",
    "192.168.1.1",
    "169.254.169.254",
    "100.64.0.1",
    "0.0.0.0",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "::7f00:1",
  ])("blocks %s", (address) => {
    expect(defaultNetworkPolicy.blocks(address)).toBe(true);
  });

  test.each(["8.8.8.8", "1.1.1.1", "2606:4700::1"])("allows %s", (address) => {
    expect(defaultNetworkPolicy.blocks(address)).toBe(false);
  });
});

// IP literals and localhost resolve without the network.
describe("isUrlAllowed", () => {
  test.each([
    "http://127.0.0.1/",
    "http://localhost:8080/",
    "http://[::1]/",
    "http://[::ffff:127.0.0.1]/",
    "http://[fe80::1]/",
    "http://2130706433/",
    "http://0x7f.1/",
  ])("blocks %s", async (url) => {
    expect(await isUrlAllowed(new URL(url), defaultNetworkPolicy)).toBe(false);
  });

  test.each(["http://8.8.8.8/", "https://[2606:4700::1]/"])("allows %s", async (url) => {
    expect(await isUrlAllowed(new URL(url), defaultNetworkPolicy)).toBe(true);
  });

  test("allows a host that does not resolve, so the fetch fails as FETCH_FAILED", async () => {
    expect(await isUrlAllowed(new URL("http://nothing.invalid/"), defaultNetworkPolicy)).toBe(true);
  });

  test("rejects with the signal's reason when already aborted", async () => {
    const signal = AbortSignal.abort(new Error("timed out"));
    await expect(
      isUrlAllowed(new URL("http://8.8.8.8/"), defaultNetworkPolicy, signal),
    ).rejects.toThrow("timed out");
  });
});
