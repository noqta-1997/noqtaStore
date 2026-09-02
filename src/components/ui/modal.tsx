"use client";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  DialogTrigger,
} from "@fluentui/react-components";
import { Dismiss24Regular } from "@fluentui/react-icons";
import type { ReactNode } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { useRestoreFocus } from "@/components/ui/use-restore-focus";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  closeLabel: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Fluent's Dialog, behind the props this component already had — so every
 * caller, `ConfirmDialog` included, is untouched.
 *
 * The hand-rolled version had no focus trap, never restored focus on close,
 * and used an unlabelled full-screen `<button>` as its backdrop. Fluent brings
 * all of that: focus moves in on open, `Tab` cycles inside the surface, `Esc`
 * closes, focus returns to whatever opened it, and the rest of the page is
 * made inert. That is the whole reason this island exists rather than being
 * another Tailwind component.
 */
export function Modal({
  open,
  onClose,
  title,
  description,
  closeLabel,
  children,
  footer,
  className,
}: ModalProps) {
  useRestoreFocus(open);

  return (
    <Dialog
      open={open}
      onOpenChange={(_, data) => {
        if (!data.open) onClose();
      }}
    >
      <DialogSurface className={cn("max-w-md", className)}>
        <DialogBody>
          <DialogTitle
            action={
              <DialogTrigger action="close" disableButtonEnhancement>
                <IconButton variant="subtle" label={closeLabel}>
                  <Dismiss24Regular aria-hidden className="size-5" />
                </IconButton>
              </DialogTrigger>
            }
          >
            <span className="text-headline-md">{title}</span>
            {description ? (
              <span className="mt-1 block text-body-md font-normal text-on-surface-variant">
                {description}
              </span>
            ) : null}
          </DialogTitle>

          {children ? <DialogContent>{children}</DialogContent> : null}

          {footer ? <DialogActions>{footer}</DialogActions> : null}
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
