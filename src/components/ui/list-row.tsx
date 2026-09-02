import type { ElementType, ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * One row in a framed list — orders, addresses, reviews, accordion entries.
 *
 * Separated from `Surface` because these rows sit inside a shared frame and
 * divide from each other, rather than each carrying its own border.
 */
interface ListRowProps {
  as?: ElementType;
  /** Adds hover feedback for rows that link somewhere. */
  interactive?: boolean;
  className?: string;
  children: ReactNode;
}

export function ListRow({
  as: Tag = "li",
  interactive = false,
  className,
  children,
}: ListRowProps) {
  return (
    <Tag
      className={cn(
        "min-w-0 px-4 py-3",
        interactive &&
          "transition-colors duration-100 ease-fluent hover:bg-state-hover",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

interface ListProps {
  as?: ElementType;
  className?: string;
  children: ReactNode;
}

/** The frame the rows divide inside. */
export function List({ as: Tag = "ul", className, children }: ListProps) {
  return (
    <Tag
      className={cn(
        "divide-y divide-line-divider overflow-hidden rounded-md border border-line bg-card",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
