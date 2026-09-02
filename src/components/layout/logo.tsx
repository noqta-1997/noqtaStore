import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

interface LogoProps {
  locale: Locale;
  name: string;
  tagline?: string;
  className?: string;
}

/**
 * The mark is literally a dot — "نُقطة".
 *
 * The reference sets its wordmark in the display serif and in the warm accent
 * rather than in ink, so the name carries the brand colour and the dot beside
 * it is now a filled disc instead of a framed square.
 */
export function Logo({ locale, name, tagline, className }: LogoProps) {
  return (
    <Link
      href={`/${locale}`}
      className={cn("group flex shrink-0 items-center gap-2.5", className)}
      aria-label={name}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-container transition-transform duration-100 ease-fluent group-hover:scale-110">
        <span className="size-2.5 rounded-full bg-on-primary-container" />
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold text-primary">
          {name}
        </span>
        {tagline ? (
          <span className="mt-1 hidden text-label-sm text-muted sm:block">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
