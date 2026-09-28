import { RRF_K } from "./config";

type Hit = { chunkId: number; rank: number };

// The sort is stable over first appearance, so ties go to the earlier list.
export function rrf(rankings: Hit[][]) {
  const fused = new Map<number, { chunkId: number; score: number; ranks: (number | null)[] }>();
  rankings.forEach((hits, list) => {
    for (const { chunkId, rank } of hits) {
      let entry = fused.get(chunkId);
      if (!entry) {
        entry = { chunkId, score: 0, ranks: rankings.map(() => null) };
        fused.set(chunkId, entry);
      }
      entry.score += 1 / (RRF_K + rank);
      entry.ranks[list] = rank;
    }
  });
  return [...fused.values()].sort((a, b) => b.score - a.score);
}
