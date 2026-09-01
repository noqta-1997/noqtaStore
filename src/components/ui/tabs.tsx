"use client";

import { useId, useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface TabItem {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabsProps {
  items: TabItem[];
  className?: string;
}

/** Accessible tab list; panels are rendered by the server and passed in. */
export function Tabs({ items, className }: TabsProps) {
  const [active, setActive] = useState(items[0]?.id);
  const base = useId();

  return (
    <div className={className}>
      <div
        role="tablist"
        className="flex flex-wrap gap-px border-b-2 border-line"
      >
        {items.map((item) => {
          const selected = item.id === active;

          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              id={`${base}-tab-${item.id}`}
              aria-selected={selected}
              aria-controls={`${base}-panel-${item.id}`}
              onClick={() => setActive(item.id)}
              className={cn(
                "px-4 py-3 text-label-md transition-colors sm:px-6",
                selected
                  ? "bg-primary-container font-semibold text-on-primary-container"
                  : "bg-card text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {items.map((item) => (
        <div
          key={item.id}
          role="tabpanel"
          id={`${base}-panel-${item.id}`}
          aria-labelledby={`${base}-tab-${item.id}`}
          hidden={item.id !== active}
          className="border border-t-0 border-line bg-card p-5 sm:p-8"
        >
          {item.content}
        </div>
      ))}
    </div>
  );
}
