import type { QuerySource } from "@turium-assignment/contracts";
import { ChevronRightIcon } from "lucide-react";

import { sourceLabel } from "@/components/chat/citation-chip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export function Sources({ sources }: { sources: QuerySource[] }) {
  if (sources.length === 0) return null;

  return (
    <Collapsible>
      <CollapsibleTrigger className="group/sources inline-flex items-center gap-1 rounded-md py-1 text-xs text-muted-foreground hover:text-foreground">
        {sources.length} {sources.length === 1 ? "source" : "sources"}
        <ChevronRightIcon className="size-3.5 transition-transform group-data-[panel-open]/sources:rotate-90" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ol className="mt-1 flex flex-col gap-1">
          {sources.map((source) => (
            <li key={source.n} className="flex min-w-0 gap-2 text-xs">
              <span className="w-5 shrink-0 text-right text-muted-foreground tabular-nums">
                {source.n}
              </span>
              <span className="min-w-0 truncate">{sourceLabel(source)}</span>
              {source.url && source.title && (
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="min-w-0 truncate text-muted-foreground underline-offset-4 hover:underline"
                >
                  {source.url}
                </a>
              )}
            </li>
          ))}
        </ol>
      </CollapsibleContent>
    </Collapsible>
  );
}
