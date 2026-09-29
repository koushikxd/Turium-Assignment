import type { Item } from "@turium-assignment/contracts";
import { FileTextIcon, InboxIcon, LinkIcon, Trash2Icon } from "lucide-react";

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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { itemTitle, useDeleteItem, useItems } from "@/lib/items";
import { timeAgo, useNow } from "@/lib/time";
import { cn } from "@/lib/utils";

const STATUS_PILL = {
  pending: { label: "Queued", className: "border-border bg-muted text-muted-foreground" },
  processing: {
    label: "Indexing",
    className: "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  },
  ready: {
    label: "Ready",
    className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  },
  failed: {
    label: "Failed",
    className: "border-destructive/20 bg-destructive/10 text-destructive",
  },
} satisfies Record<Item["status"], { label: string; className: string }>;

function itemSource(item: Item): string {
  return item.type === "url" && item.url ? new URL(item.url).hostname : "Note";
}

function StatusPill({ item, className }: { item: Item; className?: string }) {
  const pill = STATUS_PILL[item.status];
  return (
    <Badge variant="outline" className={cn("rounded-full", pill.className, className)}>
      {pill.label}
    </Badge>
  );
}

function ItemMeta({ item, now }: { item: Item; now: Date }) {
  if (item.status === "failed" && item.error) {
    return <span className="truncate text-xs text-destructive">{item.error.message}</span>;
  }
  const added = new Date(item.createdAt);
  return (
    <span className="truncate text-xs text-muted-foreground tabular-nums">
      {itemSource(item)} ·{" "}
      <time dateTime={item.createdAt} title={added.toLocaleString()}>
        {timeAgo(added, now)}
      </time>
    </span>
  );
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
                  size="icon-sm"
                  aria-label="Delete item"
                  disabled={deleting}
                  className="pointer-events-none text-muted-foreground opacity-0 transition-opacity group-has-focus-visible/item:pointer-events-auto group-has-focus-visible/item:opacity-100 group-hover/item:pointer-events-auto group-hover/item:opacity-100 hover:text-destructive"
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
            It will be removed from the knowledge base and from future answers.
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

function ItemDetailsDialog({ item, now }: { item: Item; now: Date }) {
  const title = itemTitle(item);
  const added = new Date(item.createdAt);

  return (
    <Dialog>
      <DialogTrigger className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-lg py-2 pl-2 text-left outline-none focus-visible:ring-1 focus-visible:ring-ring/50">
        <span aria-hidden className="flex size-4 shrink-0 text-muted-foreground [&_svg]:size-4">
          {item.type === "url" ? <LinkIcon /> : <FileTextIcon />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="min-w-0 truncate text-sm font-medium">{title}</span>
          <ItemMeta item={item} now={now} />
        </span>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="pr-8">
          <DialogTitle className="break-words">{title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-x-1.5 gap-y-1 tabular-nums">
            <StatusPill item={item} />
            <span>
              {item.type === "url" ? "URL" : "Note"} · Added{" "}
              <time dateTime={item.createdAt} title={added.toLocaleString()}>
                {timeAgo(added, now)}
              </time>
              {item.status === "ready" &&
                ` · ${item.chunkCount} ${item.chunkCount === 1 ? "chunk" : "chunks"}`}
              {item.truncated && " · truncated"}
            </span>
          </DialogDescription>
        </DialogHeader>
        {item.url && (
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-muted-foreground underline underline-offset-3 hover:text-foreground"
          >
            {item.url}
          </a>
        )}
        {item.error && (
          <p
            role="alert"
            className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 break-words text-destructive"
          >
            {item.error.message}
          </p>
        )}
        {item.preview && (
          <p className="max-h-64 overflow-y-auto rounded-lg bg-muted/50 px-3 py-2 break-words whitespace-pre-wrap text-muted-foreground">
            {item.preview}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ItemRow({ item, now }: { item: Item; now: Date }) {
  return (
    <li className="group/item flex items-center gap-2.5 rounded-lg pr-2 hover:bg-sidebar-accent has-focus-visible:bg-sidebar-accent">
      <ItemDetailsDialog item={item} now={now} />
      {/* The pill and the delete button share one cell; hovering or focusing the row swaps them.
          The pill ignores the pointer, since at opacity 0 it still paints above the button. */}
      <div className="grid shrink-0 items-center justify-items-end *:[grid-area:1/1]">
        <StatusPill
          item={item}
          className="pointer-events-none transition-opacity group-has-focus-visible/item:opacity-0 group-hover/item:opacity-0"
        />
        <DeleteItemDialog item={item} title={itemTitle(item)} />
      </div>
    </li>
  );
}

const LIST_CLASS = "flex flex-col gap-0.5";

export function ItemList() {
  const items = useItems();
  const now = useNow(5000);

  if (items.isPending) {
    return (
      <ul aria-busy className={LIST_CLASS}>
        {[0, 1, 2].map((i) => (
          <li key={i} className="flex items-center gap-2.5 rounded-lg px-2 py-2">
            <Skeleton className="size-4" />
            <div className="flex flex-1 flex-col gap-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-5 w-12 rounded-full" />
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
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <InboxIcon />
          </EmptyMedia>
          <EmptyTitle>No items yet</EmptyTitle>
          <EmptyDescription>Paste a URL or write a note above to start.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <ul className={LIST_CLASS}>
      {items.data.map((item) => (
        <ItemRow key={item.id} item={item} now={now} />
      ))}
    </ul>
  );
}
