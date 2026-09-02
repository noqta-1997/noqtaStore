"use client";

import { MailOpen, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setMessageStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, type ConfirmLabels } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import type { ActionResult } from "@/lib/action-result";
import type { ContactStatus } from "@/types";

interface MessageActionsProps {
  messageId: string;
  status: ContactStatus;
  subject: string;
  labels: {
    markRead: string;
    markNew: string;
    saved: string;
    failure: string;
  };
  confirm: ConfirmLabels;
  /** The delete action, already bound to this row. */
  deleteAction: () => Promise<ActionResult>;
  errorMessages: Record<string, string>;
}

/** Read/unread toggle plus a guarded delete, for one message row. */
export function MessageActions({
  messageId,
  status,
  subject,
  labels,
  confirm,
  deleteAction,
  errorMessages,
}: MessageActionsProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const next: ContactStatus = status === "read" ? "new" : "read";
  const label = status === "read" ? labels.markNew : labels.markRead;

  const toggle = async () => {
    setPending(true);
    const result = await setMessageStatus(messageId, next);
    setPending(false);

    if (!result.ok) {
      toast({ title: errorMessages[result.error] ?? labels.failure, tone: "error" });
      return;
    }

    toast({ title: labels.saved, description: subject });
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={pending}
        className="px-2"
        aria-label={label}
        title={label}
        onClick={toggle}
      >
        {status === "read" ? (
          <Undo2 aria-hidden className="size-4" strokeWidth={1.75} />
        ) : (
          <MailOpen aria-hidden className="size-4" strokeWidth={1.75} />
        )}
      </Button>

      <ConfirmDialog
        labels={confirm}
        action={deleteAction}
        errorMessages={errorMessages}
        fallbackError={labels.failure}
        itemName={subject}
        className="size-9"
      />
    </div>
  );
}
