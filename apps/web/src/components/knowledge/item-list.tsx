import type { Item } from "@turium-assignment/contracts";
import { InboxIcon, Trash2Icon } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useDeleteItem, useItems } from "@/lib/items";

const STATUS_DOT = {
  pending: "bg-yellow-500",
  processing: "bg-amber-500 animate-pulse motion-reduce:animate-none",
  ready: "bg-emerald-500",
  failed: "bg-destructive",
} satisfies Record<Item["status"], string>;

const STATUS_TEXT = {
  pending: "Queued",
  processing: "Indexing",
  ready: "Ready",
  failed: "Failed",
} satisfies Record<Item["status"], string>;

function itemTitle(item: Item): string {
  return item.title ?? item.url ?? item.preview ?? "Untitled note";
}

function ItemMeta({ item }: { item: Item }) {
  if (item.status === "failed") {
    return (
      <span className="truncate text-xs text-destructive">
        {item.error?.message ?? STATUS_TEXT.failed}
      </span>
    );
  }
  const text =
    item.status === "ready" ? `${item.type} · ${item.chunkCount} chunks` : STATUS_TEXT[item.status];
  return <span className="truncate text-xs text-muted-foreground tabular-nums">{text}</span>;
}

function DeleteItemDialog({ item, title }: { item: Item; title: string }) {
  const deleteItem = useDeleteItem();
  const deleting = deleteItem.isPending;

  return (
    <AlertDialog>
      <Tooltip>
        <TooltipTrigger
          render={
            <AlertDialogTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Delete item"
                  disabled={deleting}
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 max-sm:opacity-100"
                />
              }
            />
          }
        >
          {deleting ? <Spinner /> : <Trash2Icon />}
        </TooltipTrigger>
        <TooltipContent>Delete item</TooltipContent>
      </Tooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="break-words">Delete “{title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            {deleteItem.error?.message ??
              "It will be removed from the knowledge base and from future answers."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={deleting}
            onClick={() => deleteItem.mutate(item.id)}
          >
            {deleting && <Spinner data-icon="inline-start" />}
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ItemRow({ item }: { item: Item }) {
  const title = itemTitle(item);

  return (
    <li className="group flex items-center gap-2 px-3 transition-colors hover:bg-muted/40 focus-within:bg-muted/40">
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[item.status])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3">
        <span className="min-w-0 truncate text-sm font-medium">{title}</span>
        <ItemMeta item={item} />
      </div>
      <DeleteItemDialog item={item} title={title} />
    </li>
  );
}

const LIST_CLASS = "divide-y divide-border overflow-hidden rounded-xl border border-border";

export function ItemList() {
  const items = useItems();

  if (items.isPending) {
    return (
      <ul aria-busy className={LIST_CLASS}>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-2 px-3 py-3">
            <Skeleton className="size-2 rounded-full" />
            <div className="flex flex-1 flex-col gap-1.5">
              <Skeleton className="h-4 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/3 rounded-md" />
            </div>
          </li>
        ))}
      </ul>
    );
  }

  if (items.isError) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs text-destructive"
      >
        Could not load your items. {items.error.message}
      </div>
    );
  }

  if (items.data.length === 0) {
    return (
      <Empty className="p-6 md:p-6">
        <EmptyHeader>
          <EmptyMedia variant="icon" className="size-11 rounded-2xl [&_svg]:size-5">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No items yet</EmptyTitle>
          <EmptyDescription className="text-xs/relaxed">
            Add a note or URL to start.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className={LIST_CLASS}>
      {items.data.map((item) => (
        <ItemRow key={item.id} item={item} />
      ))}
    </ul>
  );
}
