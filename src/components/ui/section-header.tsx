import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionHref?: string;
  className?: string;
}

/**
 * Section title + optional "view all" link, used across every shelf.
 *
 * The rule under the title is gone. The reference separates its sections with
 * space and with alternating bands, not with hairlines, and a divider under
 * every heading on the page was the loudest thing on it.
 */
export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  actionHref,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-headline-md sm:text-headline-lg">{title}</h2>
        {subtitle ? <p className="text-body-md text-muted">{subtitle}</p> : null}
      </div>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-body-md font-medium text-on-surface-variant transition-colors duration-100 ease-fluent hover:text-primary"
        >
          {actionLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            strokeWidth={1.75}
          />
        </Link>
      ) : null}
    </div>
  );
}
