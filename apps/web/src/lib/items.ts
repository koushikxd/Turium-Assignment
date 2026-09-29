import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  type IngestRequest,
  type Item,
  ingestResponse,
  itemsResponse,
} from "@turium-assignment/contracts";
import { toast } from "sonner";

import { apiFetch } from "@/lib/api";

const ITEMS_KEY = ["items"];

export function itemTitle(item: Item): string {
  return item.title ?? item.url ?? item.preview ?? "Untitled note";
}

function isIndexing(item: Item): boolean {
  return item.status === "pending" || item.status === "processing";
}

// Indexing fails after POST /ingest has returned, so the failure is only seen when a poll picks it up.
function toastNewFailures(before: Item[] | undefined, after: Item[]) {
  const indexing = new Set(before?.filter(isIndexing).map((i) => i.id));
  for (const item of after) {
    if (item.status === "failed" && indexing.has(item.id)) {
      toast.error(`Couldn't add “${itemTitle(item)}”`, { description: item.error?.message });
    }
  }
}

export function pollInterval(items: Item[] | undefined): number | false {
  return items?.some(isIndexing) ? 1500 : false;
}

// Only a lone http(s) URL is ingested as a URL; anything else, including a bare domain, is a note.
export function toIngestRequest(input: string): IngestRequest | undefined {
  const text = input.trim();
  if (!text) return undefined;
  if (/^https?:\/\/\S+$/i.test(text)) return { type: "url", url: text };
  return { type: "note", text };
}

export function useItems() {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ITEMS_KEY,
    queryFn: async () => {
      const items = itemsResponse.parse(await (await apiFetch("/items")).json()).items;
      toastNewFailures(queryClient.getQueryData<Item[]>(ITEMS_KEY), items);
      return items;
    },
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
    // Hook-level, not per-mutate: the row that started the delete unmounts once the list refetches.
    onSuccess: () => toast.success("Item deleted"),
    onError: (error) => toast.error("Couldn't delete item", { description: error.message }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ITEMS_KEY }),
  });
}
