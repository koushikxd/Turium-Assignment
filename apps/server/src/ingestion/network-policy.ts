import { lookup } from "node:dns/promises";
import { BlockList, isIPv6 } from "node:net";

export type NetworkPolicy = { blocks(address: string): boolean };

const blockList = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // unspecified, "this network"
  ["10.0.0.0", 8], // RFC 1918
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local, including cloud metadata
  ["172.16.0.0", 12], // RFC 1918
  ["192.168.0.0", 16], // RFC 1918
] as const) {
  blockList.addSubnet(network, prefix, "ipv4");
}
for (const [network, prefix] of [
  ["::", 128], // unspecified
  ["::1", 128], // loopback
  ["fc00::", 7], // unique local
  ["fe80::", 10], // link-local
] as const) {
  blockList.addSubnet(network, prefix, "ipv6");
}

// BlockList also matches IPv4-mapped IPv6 (::ffff:127.0.0.1) against the IPv4 rules.
export const defaultNetworkPolicy: NetworkPolicy = {
  blocks: (address) => blockList.check(address, isIPv6(address) ? "ipv6" : "ipv4"),
};

// A hostname that does not resolve is allowed here: the fetch then fails as
// FETCH_FAILED, so the user sees it on the item (ARCHITECTURE §5.2).
export async function isUrlAllowed(url: URL, policy: NetworkPolicy) {
  const hostname = url.hostname.replace(/^\[(.*)\]$/, "$1");
  const addresses = await lookup(hostname, { all: true }).catch(() => []);
  return !addresses.some(({ address }) => policy.blocks(address));
}
