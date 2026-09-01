import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface PaginationProps {
  page: number;
  pageCount: number;
  /** Builds the href for a given page, preserving existing filters. */
  buildHref: (page: number) => string;
  labels: { previous: string; next: string; page: string };
  className?: string;
}

/** Numbered pagination with a windowed page list. */
export function Pagination({
  page,
  pageCount,
  buildHref,
  labels,
  className,
}: PaginationProps) {
  if (pageCount <= 1) return null;

  const window = 1;
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (item) =>
      item === 1 ||
      item === pageCount ||
      (item >= page - window && item <= page + window),
  );

  const box =
    "inline-flex h-10 min-w-10 items-center justify-center border border-line px-3 text-label-md transition-colors";

  return (
    <nav aria-label={labels.page} className={cn("flex justify-center", className)}>
      <ul className="flex flex-wrap items-center gap-1.5">
        <li>
          {page > 1 ? (
            <Link
              href={buildHref(page - 1)}
              aria-label={labels.previous}
              className={cn(box, "bg-card hover:bg-surface-high")}
            >
              <ChevronRight aria-hidden className="size-4 rtl:hidden" strokeWidth={2} />
              <ChevronLeft aria-hidden className="hidden size-4 rtl:block" strokeWidth={2} />
            </Link>
          ) : (
            <span
              aria-disabled
              className={cn(box, "border-outline text-muted")}
            >
              <ChevronRight aria-hidden className="size-4 rtl:hidden" strokeWidth={2} />
              <ChevronLeft aria-hidden className="hidden size-4 rtl:block" strokeWidth={2} />
            </span>
          )}
        </li>

        {pages.map((item, index) => {
          const previous = pages[index - 1];
          const gap = previous && item - previous > 1;

          return (
            <li key={item} className="flex items-center gap-1.5">
              {gap ? <span className="px-1 text-muted">…</span> : null}
              {item === page ? (
                <span
                  aria-current="page"
                  data-numeric
                  className={cn(box, "bg-primary-container font-semibold text-on-primary-container")}
                >
                  {item}
                </span>
              ) : (
                <Link
                  href={buildHref(item)}
                  data-numeric
                  className={cn(box, "bg-card hover:bg-surface-high")}
                >
                  {item}
                </Link>
              )}
            </li>
          );
        })}

        <li>
          {page < pageCount ? (
            <Link
              href={buildHref(page + 1)}
              aria-label={labels.next}
              className={cn(box, "bg-card hover:bg-surface-high")}
            >
              <ChevronLeft aria-hidden className="size-4 rtl:hidden" strokeWidth={2} />
              <ChevronRight aria-hidden className="hidden size-4 rtl:block" strokeWidth={2} />
            </Link>
          ) : (
            <span aria-disabled className={cn(box, "border-outline text-muted")}>
              <ChevronLeft aria-hidden className="size-4 rtl:hidden" strokeWidth={2} />
              <ChevronRight aria-hidden className="hidden size-4 rtl:block" strokeWidth={2} />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
