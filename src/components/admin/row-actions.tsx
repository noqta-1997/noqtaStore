import { Eye, Pencil } from "lucide-react";
import Link from "next/link";

import { ConfirmDialog, type ConfirmLabels } from "@/components/ui/confirm-dialog";
import type { ActionResult } from "@/lib/action-result";

interface RowActionsProps {
  viewHref?: string;
  editHref?: string;
  labels: { view: string; edit: string; delete: string };
  /** Omit to hide the delete control entirely. */
  confirm?: ConfirmLabels;
  /** Server action bound to this row. */
  deleteAction?: () => Promise<ActionResult>;
  errorMessages?: Record<string, string>;
  fallbackError?: string;
  /** Shown inside the confirmation dialog so the row is unambiguous. */
  itemName?: string;
}

/** View / edit / delete controls shared by every admin table row. */
export function RowActions({
  viewHref,
  editHref,
  labels,
  confirm,
  deleteAction,
  errorMessages,
  fallbackError,
  itemName,
}: RowActionsProps) {
  const iconLink =
    "inline-flex size-9 shrink-0 items-center justify-center rounded-md text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary";

  return (
    <div className="flex items-center justify-end gap-1">
      {viewHref ? (
        <Link href={viewHref} aria-label={labels.view} title={labels.view} className={iconLink}>
          <Eye aria-hidden className="size-4" strokeWidth={1.75} />
        </Link>
      ) : null}
      {editHref ? (
        <Link href={editHref} aria-label={labels.edit} title={labels.edit} className={iconLink}>
          <Pencil aria-hidden className="size-4" strokeWidth={1.75} />
        </Link>
      ) : null}
      {confirm ? (
        <ConfirmDialog
          labels={confirm}
          action={deleteAction}
          errorMessages={errorMessages}
          fallbackError={fallbackError}
          itemName={itemName}
          className="size-9"
        />
      ) : null}
    </div>
  );
}
