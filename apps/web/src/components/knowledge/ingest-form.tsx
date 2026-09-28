import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { ApiError } from "@/lib/api";
import { useIngest } from "@/lib/items";

type Tab = "note" | "url";

const TAB_FIELDS = { note: ["title", "text"], url: ["url"] } satisfies Record<Tab, string[]>;

export function IngestForm() {
  const ingest = useIngest();
  const [tab, setTab] = useState<Tab>("note");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");

  const error = ingest.error;
  const fieldErrors = error instanceof ApiError ? (error.problem.errors ?? []) : [];
  const fieldError = (path: string) => fieldErrors.find((e) => e.path === path)?.message;
  const hasFieldError = TAB_FIELDS[tab].some((path) => fieldError(path));
  const formError = error && !hasFieldError ? error.message : undefined;

  function changeTab(value: Tab) {
    setTab(value);
    ingest.reset();
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (tab === "note") {
      ingest.mutate(
        { type: "note", text, title: title.trim() || undefined },
        {
          onSuccess: () => {
            setTitle("");
            setText("");
          },
        },
      );
    } else {
      ingest.mutate({ type: "url", url: url.trim() }, { onSuccess: () => setUrl("") });
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList variant="line">
          <TabsTrigger value="note">Note</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        <TabsContent value="note">
          <FieldGroup className="gap-3">
            <Field data-invalid={Boolean(fieldError("title"))}>
              <FieldLabel htmlFor="ingest-title">Title (optional)</FieldLabel>
              <Input
                id="ingest-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-invalid={Boolean(fieldError("title"))}
              />
              <FieldError>{fieldError("title")}</FieldError>
            </Field>
            <Field data-invalid={Boolean(fieldError("text"))}>
              <FieldLabel htmlFor="ingest-text">Note</FieldLabel>
              <Textarea
                id="ingest-text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or write something to remember"
                className="min-h-28"
                aria-invalid={Boolean(fieldError("text"))}
              />
              <FieldError>{fieldError("text")}</FieldError>
            </Field>
          </FieldGroup>
        </TabsContent>
        <TabsContent value="url">
          <Field data-invalid={Boolean(fieldError("url"))}>
            <FieldLabel htmlFor="ingest-url">URL</FieldLabel>
            <Input
              id="ingest-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/article"
              aria-invalid={Boolean(fieldError("url"))}
            />
            <FieldError>{fieldError("url")}</FieldError>
          </Field>
        </TabsContent>
      </Tabs>
      {formError && (
        <p role="alert" className="text-xs text-destructive">
          {formError}
        </p>
      )}
      <Button type="submit" disabled={ingest.isPending}>
        {ingest.isPending && <Spinner data-icon="inline-start" />}
        Add
      </Button>
    </form>
  );
}
