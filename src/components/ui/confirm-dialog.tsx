"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import { cn } from "@/lib/utils";

export interface ConfirmLabels {
  title: string;
  description: string;
  confirm: string;
  cancel: string;
  /** Shown as the toast title once confirmed. */
  done: string;
  /** Accessible name for the trigger. */
  trigger: string;
}

interface ConfirmDialogProps {
  labels: ConfirmLabels;
  /** A server action bound to the row; omit for a dialog that only reports. */
  action?: () => Promise<ActionResult>;
  /** Maps an action error code to a sentence. */
  errorMessages?: Record<string, string>;
  fallbackError?: string;
  /** Extra line inside the dialog, e.g. the item being removed. */
  itemName?: string;
  /** `icon` renders a square icon button, `button` a labelled danger button. */
  variant?: "icon" | "button";
  className?: string;
  children?: ReactNode;
}

/**
 * Destructive actions always confirm first. With an `action` the confirmation
 * runs it and reports the outcome; without one it only reports.
 */
export function ConfirmDialog({
  labels,
  action,
  errorMessages,
  fallbackError,
  itemName,
  variant = "icon",
  className,
  children,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const toast = useToast();
  const router = useRouter();

  const onConfirm = async () => {
    if (!action) {
      setOpen(false);
      toast({ title: labels.done, description: itemName, tone: "info" });
      return;
    }

    /* The action reports through its result; if it throws instead (a lost
       connection, a bug), the dialog still closes and says so rather than
       staying open with its button disabled. */
    setPending(true);
    let result: ActionResult;
    try {
      result = await action();
    } catch (error) {
      console.error("[confirm-dialog] action threw", error);
      result = { ok: false, error: "thrown" };
    }
    setPending(false);
    setOpen(false);

    if (result.ok) {
      toast({ title: labels.done, description: itemName, tone: "info" });
      router.refresh();
      return;
    }

    toast({
      title: errorMessages?.[result.error] ?? fallbackError ?? labels.title,
      tone: "error",
    });
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={labels.trigger}
          title={labels.trigger}
          className={cn(
            "inline-flex size-10 shrink-0 items-center justify-center border border-transparent",
            "text-on-surface transition-colors hover:border-error hover:bg-error-container hover:text-on-error-container",
            className,
          )}
        >
          {children ?? <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 rounded-md bg-error-container px-4 py-2.5",
            "text-label-md font-semibold text-on-error-container",
            "transition-shadow duration-100 ease-fluent hover:elevation-sm",
            className,
          )}
        >
          <Trash2 aria-hidden className="size-4" strokeWidth={1.75} />
          {labels.trigger}
        </button>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={labels.title}
        description={labels.description}
        closeLabel={labels.cancel}
        footer={
          <>
            <Button variant="subtle" onClick={() => setOpen(false)}>
              {labels.cancel}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={pending}
              className="border-line bg-error-container text-on-error-container"
            >
              {labels.confirm}
            </Button>
          </>
        }
      >
        {itemName ? (
          <p className="rounded-md bg-surface-low px-4 py-3 text-body-md text-on-surface">
            {itemName}
          </p>
        ) : null}
      </Modal>
    </>
  );
}
