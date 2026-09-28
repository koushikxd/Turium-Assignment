import type { QuerySource } from "@turium-assignment/contracts";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function sourceLabel(source: QuerySource): string {
  return source.title ?? source.url ?? "Untitled note";
}

export function CitationChip({ source }: { source: QuerySource }) {
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Source ${source.n}: ${sourceLabel(source)}`}
        className="mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-muted px-1 align-text-top text-xs font-medium text-muted-foreground tabular-nums transition-colors hover:bg-accent hover:text-foreground"
      >
        {source.n}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 rounded-xl">
        <p className="font-medium text-foreground">{sourceLabel(source)}</p>
        {source.url && (
          <a
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="truncate text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            {source.url}
          </a>
        )}
        <p className="line-clamp-6 leading-relaxed text-muted-foreground">{source.snippet}</p>
      </PopoverContent>
    </Popover>
  );
}
