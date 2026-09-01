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

/** Section title + optional "view all" link, used across every shelf. */
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
        "mb-6 flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b-2 border-line pb-4",
        className,
      )}
    >
      <div className="space-y-1">
        <h2 className="text-headline-md sm:text-headline-lg">{title}</h2>
        {subtitle ? <p className="text-sm text-muted">{subtitle}</p> : null}
      </div>

      {actionLabel && actionHref ? (
        <Link
          href={actionHref}
          className="group inline-flex items-center gap-1.5 text-label-md text-on-surface underline-offset-4 hover:underline"
        >
          {actionLabel}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-150 group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            strokeWidth={2}
          />
        </Link>
      ) : null}
    </div>
  );
}
