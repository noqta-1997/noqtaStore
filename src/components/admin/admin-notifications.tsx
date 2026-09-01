"use client";

import { Bell, PackageX, Settings2, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import type { AdminNotification, AdminNotificationKind } from "@/types";

export interface BellLabels {
  trigger: string;
  title: string;
  empty: string;
  allOff: string;
  settings: string;
  kinds: Record<AdminNotificationKind, string>;
  stockRemaining: string;
  more: string;
}

interface AdminNotificationsProps {
  items: AdminNotification[];
  /** The true outstanding count, which can exceed the listed items. */
  total: number;
  /** False when every kind is switched off in settings. */
  anyEnabled: boolean;
  settingsHref: string;
  labels: BellLabels;
}

const icons: Record<AdminNotificationKind, typeof Bell> = {
  order: ShoppingBag,
  review: Star,
  stock: PackageX,
};

/**
 * Everything waiting for the manager, filtered by the toggles in settings.
 * The badge counts outstanding work rather than unread messages: acting on
 * something is what clears it.
 */
export function AdminNotifications({
  items,
  total,
  anyEnabled,
  settingsHref,
  labels,
}: AdminNotificationsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={container} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={labels.trigger}
        title={labels.trigger}
        aria-expanded={isOpen}
        className="relative inline-flex size-9 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-surface-high"
      >
        <Bell aria-hidden className="size-4.5" strokeWidth={2} />
        {total > 0 ? (
          <span
            className="absolute -end-1 -top-1 flex size-4 items-center justify-center border border-line bg-primary-container font-mono text-[0.5625rem] font-semibold text-on-primary-container"
            data-numeric
          >
            {total > 99 ? "99+" : total}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute end-0 top-full z-40 mt-1 w-80 max-w-[calc(100vw-2rem)] border border-line bg-card shadow-hard">
          <p className="border-b border-line px-4 py-3 text-label-md font-semibold text-on-surface">
            {labels.title}
          </p>

          {items.length ? (
            <ul className="max-h-96 divide-y divide-outline-variant overflow-y-auto">
              {items.map((item) => {
                const Icon = icons[item.kind];

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-high"
                    >
                      <span className="flex size-8 shrink-0 items-center justify-center border border-line bg-surface-high text-primary">
                        <Icon aria-hidden className="size-4" strokeWidth={2} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="label-mono block text-muted">
                          {labels.kinds[item.kind]}
                        </span>
                        <span className="block truncate text-label-md font-semibold text-on-surface">
                          {item.label}
                        </span>
                        <span className="block truncate text-label-sm text-on-surface-variant">
                          {item.kind === "stock"
                            ? `${labels.stockRemaining}: ${item.detail}`
                            : item.detail}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-body-md text-muted">
              {anyEnabled ? labels.empty : labels.allOff}
            </p>
          )}

          <Link
            href={settingsHref}
            onClick={() => setIsOpen(false)}
            className={cn(
              "flex items-center gap-2 border-t border-line px-4 py-3",
              "text-label-md text-on-surface-variant transition-colors hover:bg-surface-high hover:text-on-surface",
            )}
          >
            <Settings2 aria-hidden className="size-4" strokeWidth={2} />
            {labels.settings}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
