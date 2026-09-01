"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { AdminNav, type AdminNavLabels } from "@/components/admin/admin-nav";
import { IconButton } from "@/components/ui/icon-button";

interface AdminMobileNavProps {
  locale: string;
  labels: AdminNavLabels;
  panelLabel: string;
  menuLabel: string;
  closeLabel: string;
}

/** The admin navigation as a drawer on phones. */
export function AdminMobileNav({
  locale,
  labels,
  panelLabel,
  menuLabel,
  closeLabel,
}: AdminMobileNavProps) {
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
    <>
      <IconButton
        variant="outline"
        label={menuLabel}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="md:hidden"
      >
        <Menu aria-hidden className="size-5" strokeWidth={2} />
      </IconButton>

      {isOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label={closeLabel}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-inverse-surface/70"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={panelLabel}
            className="absolute inset-y-0 start-0 flex w-[min(18rem,85vw)] flex-col overflow-y-auto border-e-2 border-line bg-card"
          >
            <div className="flex items-center justify-between border-b-2 border-line p-4">
              <span className="label-mono text-muted">{panelLabel}</span>
              <IconButton
                variant="outline"
                label={closeLabel}
                onClick={() => setIsOpen(false)}
              >
                <X aria-hidden className="size-5" strokeWidth={2} />
              </IconButton>
            </div>

            <AdminNav
              locale={locale}
              labels={labels}
              onNavigate={() => setIsOpen(false)}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
