"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";

interface FilterSheetProps {
  labels: { open: string; title: string; close: string };
  children: ReactNode;
}

/** Wraps the same filter form in a drawer on small screens. */
export function FilterSheet({ labels, children }: FilterSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      <Button variant="secondary" size="md" onClick={() => setIsOpen(true)} fullWidth>
        <SlidersHorizontal aria-hidden className="size-4" strokeWidth={2} />
        {labels.open}
      </Button>

      {isOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-inverse-surface/70"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={labels.title}
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto border-t-2 border-line bg-surface"
          >
            <div className="sticky top-0 flex items-center justify-between border-b-2 border-line bg-surface p-4">
              <span className="label-mono text-muted">{labels.title}</span>
              <IconButton
                variant="outline"
                label={labels.close}
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden className="size-5" strokeWidth={2} />
              </IconButton>
            </div>
            <div className="p-4">{children}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
