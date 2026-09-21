import { ChevronUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode, ThHTMLAttributes, TdHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type TableDensity = "compact" | "default";

interface TableProps {
  children: ReactNode;
  /** Minimum width before the table starts scrolling horizontally. */
  minWidth?: string;
  /** Fluent's row heights: 32px compact, 44px default. */
  density?: TableDensity;
  className?: string;
}

/**
 * Bordered, horizontally scrollable data table shell.
 *
 * Rows follow Fluent's named heights rather than whatever padding happened to
 * be written at the call site, and the density is set once on the table
 * instead of per cell.
 */
export function Table({
  children,
  minWidth = "48rem",
  density = "default",
  className,
}: TableProps) {
  return (
    <div
      data-density={density}
      /*
       * The box scrolls sideways on a phone, and a scrolling box a keyboard
       * cannot reach is content a keyboard cannot see. A row's link usually
       * takes focus in and drags the columns into view with it, but a table
       * with no links — the sales ranking on a quiet month — offered nothing
       * to land on, and axe called it (`scrollable-region-focusable`). A tab
       * stop on the box itself lets the arrow keys scroll it, and the global
       * `:focus-visible` ring shows where focus is.
       */
      tabIndex={0}
      className={cn(
        /*
         * Square on all four corners.
         *
         * The box was `rounded-xl`, and a 16px radius cut pale notches out of
         * the header band's top corners where the card showed through — the
         * band stopped short of the edge it is meant to cap. The same applies
         * at the foot once a row is striped or selected, so the radius is gone
         * rather than halved: a table is a grid of straight rules, and its
         * frame reads better square than as a card that happens to hold one.
         *
         * This is the only component whose radius changed. `rounded-*` at
         * every other call site — cards, panels, inputs, dialogs, badges —
         * is untouched, and so are the radius tokens themselves.
         */
        "overflow-x-auto border border-line bg-card",
        className,
      )}
    >
      <table className="w-full border-collapse text-start" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line-divider bg-surface-low">{children}</thead>
  );
}

export function Tbody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line-divider">{children}</tbody>;
}

export function Tr({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <tr
      className={cn(
        "transition-colors duration-100 ease-fluent hover:bg-state-hover",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function Th({ children, className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "h-10 px-3 text-start align-middle text-label-md font-semibold text-on-surface-variant",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function Td({ children, className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn(
        "px-3 py-2 text-start align-middle text-body-md",
        "group-data-[density=compact]/table:py-1.5",
        className,
      )}
      {...props}
    >
      {children}
    </td>
  );
}

/* ------------------------------------------------------------------ */
/* Sorting                                                             */
/* ------------------------------------------------------------------ */

export type SortDirection = "asc" | "desc";

interface SortableThProps extends ThHTMLAttributes<HTMLTableCellElement> {
  /** Column key, e.g. `price` — combines with a direction into `price-asc`. */
  column: string;
  /** The table's current `sort` param, straight from the URL. */
  current?: string;
  /** Builds the href for a given sort value, preserving the other filters. */
  buildHref: (sort: string) => string;
  /** Which way this column sorts on first click. */
  defaultDirection?: SortDirection;
  children: ReactNode;
}

/**
 * A sortable column header.
 *
 * The control is a link, not a button: sorting lives in the query string, so
 * every sorted view stays a shareable URL and the page stays a Server
 * Component. `aria-sort` tells assistive technology which column is active and
 * in which direction — the tables had no sorting at all before, and therefore
 * no way to say so.
 */
export function SortableTh({
  column,
  current,
  buildHref,
  defaultDirection = "asc",
  className,
  children,
  ...props
}: SortableThProps) {
  const activeAsc = current === `${column}-asc`;
  const activeDesc = current === `${column}-desc`;
  const active = activeAsc || activeDesc;

  const next: SortDirection = activeAsc
    ? "desc"
    : activeDesc
      ? "asc"
      : defaultDirection;

  return (
    <th
      scope="col"
      aria-sort={activeAsc ? "ascending" : activeDesc ? "descending" : "none"}
      className={cn(
        "h-10 px-3 text-start align-middle text-label-md font-semibold text-on-surface-variant",
        className,
      )}
      {...props}
    >
      <Link
        href={buildHref(`${column}-${next}`)}
        className={cn(
          "inline-flex items-center gap-1 rounded-md px-1 py-0.5 -mx-1",
          "transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface",
          active && "text-on-surface",
        )}
      >
        {children}
        <ChevronUp
          aria-hidden
          className={cn(
            "size-3.5 transition-transform duration-100 ease-fluent",
            activeDesc && "rotate-180",
            !active && "opacity-0",
          )}
          strokeWidth={2.5}
        />
      </Link>
    </th>
  );
}
