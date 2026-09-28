import { ArrowUpIcon, SquareIcon } from "lucide-react";
import { useState } from "react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";

export function PromptForm({
  busy,
  onSubmit,
  onStop,
}: {
  busy: boolean;
  onSubmit: (text: string) => void;
  onStop: () => void;
}) {
  const [input, setInput] = useState("");

  function submit() {
    const text = input.trim();
    if (!text || busy) return;
    onSubmit(text);
    setInput("");
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
    >
      <InputGroup className="rounded-3xl bg-sidebar">
        <InputGroupTextarea
          aria-label="Question"
          placeholder="Ask about your notes and links…"
          className="max-h-48 px-3.5 pt-3.5 pb-2 text-base sm:px-4 sm:pt-4 md:text-base"
          maxLength={2000}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              submit();
            }
          }}
        />
        <InputGroupAddon align="block-end">
          {busy ? (
            <InputGroupButton
              variant="outline"
              size="icon-sm"
              aria-label="Stop generating"
              className="ml-auto size-9 rounded-full"
              onClick={onStop}
            >
              <SquareIcon />
            </InputGroupButton>
          ) : (
            <InputGroupButton
              type="submit"
              variant="default"
              size="icon-sm"
              aria-label="Send"
              className="ml-auto size-9 rounded-full"
              disabled={!input.trim()}
            >
              <ArrowUpIcon />
            </InputGroupButton>
          )}
        </InputGroupAddon>
      </InputGroup>
    </form>
  );
}
