import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { toIngestRequest, useIngest } from "@/lib/items";

export function AddItemForm() {
  const ingest = useIngest();
  const [input, setInput] = useState("");
  const request = toIngestRequest(input);

  const error = ingest.error;
  // Validation errors belong to the input and stay inline; anything else is toasted.
  const errorMessage = error instanceof ApiError ? error.problem.errors?.[0]?.message : undefined;
  const label = request?.type === "url" ? "Add URL" : "Add note";

  function submit() {
    if (!request || ingest.isPending) return;
    ingest.mutate(request, {
      onSuccess: () => {
        setInput("");
        toast.success(request.type === "url" ? "URL added" : "Note added", {
          description: "Indexing it now.",
        });
      },
      onError: (error) => {
        if (!(error instanceof ApiError && error.problem.errors?.length)) {
          toast.error("Couldn't add item", { description: error.message });
        }
      },
    });
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className="flex flex-col gap-1.5"
    >
      <InputGroup className="rounded-xl">
        <InputGroupTextarea
          aria-label="Add a note or URL"
          aria-invalid={Boolean(errorMessage)}
          aria-describedby="add-item-hint"
          placeholder="Paste a URL or write a note"
          className="max-h-40 min-h-0 text-sm md:text-sm"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            if (error) ingest.reset();
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <InputGroupAddon align="inline-end" className="self-end">
          <InputGroupButton
            type="submit"
            variant="default"
            size="icon-xs"
            aria-label={label}
            disabled={!request || ingest.isPending}
            className="rounded-full active:scale-[0.96]"
          >
            {ingest.isPending ? <Spinner /> : <PlusIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p
        id="add-item-hint"
        role={errorMessage ? "alert" : undefined}
        className={
          errorMessage ? "px-1 text-xs text-destructive" : "px-1 text-xs text-muted-foreground"
        }
      >
        {errorMessage ??
          (request ? `Enter to ${label.toLowerCase()}` : "Shift+Enter for a new line")}
      </p>
    </form>
  );
}
