"use client";

import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";

import { IconButton } from "@/components/ui/icon-button";
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

/** Centred dialog: hard frame, hard shadow, no blur — same language as the cards. */
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
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label={closeLabel}
        onClick={onClose}
        className="absolute inset-0 bg-inverse-surface/70"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative w-full max-w-md border-2 border-line bg-card shadow-hard",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line p-5">
          <div className="min-w-0 space-y-1">
            <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
            {description ? (
              <p className="text-body-md text-on-surface-variant">{description}</p>
            ) : null}
          </div>
          <IconButton variant="ghost" label={closeLabel} onClick={onClose}>
            <X aria-hidden className="size-5" strokeWidth={2} />
          </IconButton>
        </div>

        {children ? <div className="p-5">{children}</div> : null}

        {footer ? (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line p-5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
