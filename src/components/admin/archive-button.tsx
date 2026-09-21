"use client";

import { Archive, ArchiveRestore } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setBookArchived, setHandoutArchived } from "@/app/actions/admin";
import { runAction } from "@/lib/action-result";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface ArchiveButtonProps {
  kind: "book" | "handout";
  id: string;
  archived: boolean;
  labels: {
    archive: string;
    restore: string;
    archived: string;
    restored: string;
    failure: string;
  };
  errorMessages: Record<string, string>;
  /** Show the label beside the icon — the detail page has room; a table row does not. */
  withText?: boolean;
  className?: string;
}

const setArchived = { book: setBookArchived, handout: setHandoutArchived };

/** Takes a title off sale or puts it back; the alternative to deleting an ordered one. */
export function ArchiveButton({
  kind,
  id,
  archived,
  labels,
  errorMessages,
  withText = false,
  className,
}: ArchiveButtonProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const label = archived ? labels.restore : labels.archive;
  const Icon = archived ? ArchiveRestore : Archive;

  const onClick = async () => {
    setPending(true);
    const result = await runAction(setArchived[kind](id, !archived));
    setPending(false);

    if (!result.ok) {
      toast({ title: errorMessages[result.error] ?? labels.failure, tone: "error" });
      // The title was deleted meanwhile; the table still lists it.
      if (result.error === "notFound") router.refresh();
      return;
    }

    toast({ title: archived ? labels.restored : labels.archived });
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-label={withText ? undefined : label}
      title={withText ? undefined : label}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md",
        "text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary disabled:opacity-50",
        withText ? "h-9 border border-line px-3 text-label-md font-semibold" : "size-9",
        className,
      )}
    >
      <Icon aria-hidden className="size-4" strokeWidth={1.75} />
      {withText ? label : null}
    </button>
  );
}
