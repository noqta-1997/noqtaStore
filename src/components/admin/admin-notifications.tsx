"use client";

import { Popover, PopoverSurface, PopoverTrigger } from "@fluentui/react-components";
import { Bell, PackageX, Settings2, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
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

  return (
    /*
     * The last hand-rolled floating layer. It had its own outside-click and
     * escape listeners and no focus management; Fluent's Popover brings both,
     * and dismissal now behaves the same as every other overlay in the app.
     */
    <Popover
      open={isOpen}
      onOpenChange={(_, data) => setIsOpen(data.open)}
      positioning="below-end"
    >
      <PopoverTrigger disableButtonEnhancement>
        <IconButton variant="subtle" size="md" label={labels.trigger} className="relative">
          <Bell aria-hidden className="size-4.5" strokeWidth={1.75} />
          {total > 0 ? (
            <span
              className="absolute -end-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-primary-container text-[0.5625rem] font-semibold text-on-primary-container"
              data-numeric
            >
              {total > 99 ? "99+" : total}
            </span>
          ) : null}
        </IconButton>
      </PopoverTrigger>

      <PopoverSurface className="w-80 max-w-[calc(100vw-2rem)] p-0">
          <p className="border-b border-line-divider px-4 py-3 text-label-md font-semibold text-on-surface">
            {labels.title}
          </p>

          {items.length ? (
            <ul className="max-h-96 divide-y divide-line-divider overflow-y-auto">
              {items.map((item) => {
                const Icon = icons[item.kind];

                return (
                  <li key={item.id}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-state-hover"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
                        <Icon aria-hidden className="size-4" strokeWidth={1.75} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="label-mono block text-muted">
                          {labels.kinds[item.kind]}
                        </span>
                        <span className="block truncate text-label-md font-semibold text-on-surface">
                          {item.label}
                        </span>
                        <span className="block truncate text-label-md text-on-surface-variant">
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
              "flex items-center gap-2 border-t border-line-divider px-4 py-3",
              "text-label-md text-on-surface-variant transition-colors hover:bg-state-hover hover:text-on-surface",
            )}
          >
            <Settings2 aria-hidden className="size-4" strokeWidth={1.75} />
            {labels.settings}
          </Link>
      </PopoverSurface>
    </Popover>
  );
}
