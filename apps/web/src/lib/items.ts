import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type IngestRequest,
  type Item,
  ingestResponse,
  itemsResponse,
} from "@turium-assignment/contracts";

import { apiFetch } from "@/lib/api";

const ITEMS_KEY = ["items"];

export function pollInterval(items: Item[] | undefined): number | false {
  const indexing = items?.some((i) => i.status === "pending" || i.status === "processing");
  return indexing ? 1500 : false;
}

// Only a lone http(s) URL is ingested as a URL; anything else, including a bare domain, is a note.
export function toIngestRequest(input: string): IngestRequest | undefined {
  const text = input.trim();
  if (!text) return undefined;
  if (/^https?:\/\/\S+$/i.test(text)) return { type: "url", url: text };
  return { type: "note", text };
}

export function useItems() {
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: async () => itemsResponse.parse(await (await apiFetch("/items")).json()).items,
    refetchInterval: (query) => pollInterval(query.state.data),
  });
}

export function useIngest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body: IngestRequest) => {
      const res = await apiFetch("/ingest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      return ingestResponse.parse(await res.json()).item;
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}

export function useDeleteItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await apiFetch(`/items/${id}`, { method: "DELETE" });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}
