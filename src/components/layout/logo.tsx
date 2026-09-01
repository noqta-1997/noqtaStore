import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LogoProps {
  locale: Locale;
  name: string;
  tagline?: string;
  className?: string;
}

/** The mark is literally a dot — "نُقطة". */
export function Logo({ locale, name, tagline, className }: LogoProps) {
  return (
    <Link
      href={`/${locale}`}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label={name}
    >
      <span className="flex size-9 shrink-0 items-center justify-center border border-line bg-primary-container transition-transform duration-150 group-hover:-rotate-6">
        <span className="size-2.5 rounded-full bg-on-primary-container" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-extrabold text-on-surface">
          {name}
        </span>
        {tagline ? (
          <span className="label-mono mt-1 text-muted">{tagline}</span>
        ) : null}
      </span>
    </Link>
  );
}
