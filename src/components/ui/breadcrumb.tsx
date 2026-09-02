import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: Crumb[];
  label: string;
  className?: string;
}

/** Trail of links; the last item is the current page and is not a link. */
export function Breadcrumb({ items, label, className }: BreadcrumbProps) {
  return (
    <nav aria-label={label} className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-1.5 text-label-md text-muted">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1.5">
              {item.href && !isLast ? (
                <Link
                  href={item.href}
                  className="underline-offset-4 hover:text-on-surface hover:underline"
                >
                  {item.label}
                </Link>
              ) : (
                <span aria-current={isLast ? "page" : undefined} className="font-medium text-on-surface">
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronLeft
                  aria-hidden
                  className="size-3.5 shrink-0 rtl:rotate-180"
                  strokeWidth={1.75}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
