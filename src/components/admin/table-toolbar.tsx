import { Search } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ToolbarTab {
  value: string;
  label: string;
  count?: number;
  href: string;
  active: boolean;
}

interface TableToolbarProps {
  action: string;
  searchPlaceholder: string;
  searchLabel: string;
  defaultValue?: string;
  /** Preserved alongside the search term when the form submits. */
  hiddenFields?: Record<string, string | undefined>;
  tabs?: ToolbarTab[];
  className?: string;
}

/**
 * Search + status tabs above a table. The search is a plain GET form and
 * the tabs are links, so every table state is a shareable URL.
 */
export function TableToolbar({
  action,
  searchPlaceholder,
  searchLabel,
  defaultValue,
  hiddenFields,
  tabs,
  className,
}: TableToolbarProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      {tabs?.length ? (
        <nav className="flex flex-wrap gap-px">
          {tabs.map((tab) => (
            <Link
              key={tab.value}
              href={tab.href}
              aria-current={tab.active ? "page" : undefined}
              className={cn(
                "inline-flex items-center gap-2 border border-line px-3 py-2 text-label-md transition-colors",
                tab.active
                  ? "bg-primary-container font-semibold text-on-primary-container"
                  : "bg-card text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
              )}
            >
              {tab.label}
              {typeof tab.count === "number" ? (
                <span
                  className={cn(
                    "border px-1.5 font-mono text-[0.625rem]",
                    tab.active ? "border-on-primary-container" : "border-outline",
                  )}
                  data-numeric
                >
                  {tab.count}
                </span>
              ) : null}
            </Link>
          ))}
        </nav>
      ) : (
        <span />
      )}

      <form action={action} method="get" className="flex min-w-0 items-center gap-2">
        {Object.entries(hiddenFields ?? {}).map(([name, value]) =>
          value ? <input key={name} type="hidden" name={name} value={value} /> : null,
        )}

        <label htmlFor="table-search" className="sr-only">
          {searchLabel}
        </label>
        <div className="flex h-10 min-w-0 items-center border border-line bg-card ps-3">
          <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={2} />
          <input
            id="table-search"
            name="q"
            type="search"
            defaultValue={defaultValue}
            placeholder={searchPlaceholder}
            className="h-full w-full min-w-0 bg-transparent px-2 text-sm text-on-surface placeholder:text-muted focus:outline-none sm:w-64"
          />
        </div>
        <Button type="submit" variant="secondary" size="sm" className="h-10 shrink-0">
          {searchLabel}
        </Button>
      </form>
    </div>
  );
}
