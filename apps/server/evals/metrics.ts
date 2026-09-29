import { TOP_K, VECTOR_K } from "../src/retrieval/config";

type Chunk = { itemId: number; text: string };
type Label = { itemId: number; evidence: string };

const squash = (text: string) => text.replaceAll(/\s+/g, " ");

// A hit needs the expected item and the evidence phrase in the chunk text (ARCHITECTURE §10).
export function hitRank(chunks: Chunk[], label: Label) {
  const evidence = squash(label.evidence);
  const index = chunks.findIndex(
    (chunk) => chunk.itemId === label.itemId && squash(chunk.text).includes(evidence),
  );
  return index === -1 ? null : index + 1;
}

// Recall@6 is what the model sees. Recall@20 is the vector candidate depth.
export function summarize(ranks: (number | null)[]) {
  const recall = (k: number) =>
    ranks.filter((rank) => rank !== null && rank <= k).length / ranks.length;
  const recallAt20 = recall(VECTOR_K);
  return {
    recallAt6: recall(TOP_K),
    recallAt20,
    failureAt20: 1 - recallAt20,
    mrr: ranks.reduce<number>((sum, rank) => sum + (rank ? 1 / rank : 0), 0) / ranks.length,
  };
}
