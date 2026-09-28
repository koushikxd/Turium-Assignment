import { describe, expect, test } from "vitest";

import { defaultNetworkPolicy } from "../../src/ingestion/network-policy";

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
  ])("blocks %s", (address) => {
    expect(defaultNetworkPolicy.blocks(address)).toBe(true);
  });

  test.each(["8.8.8.8", "1.1.1.1", "2606:4700::1"])("allows %s", (address) => {
    expect(defaultNetworkPolicy.blocks(address)).toBe(false);
  });
});
