import Link from "next/link";

import { LogoMark } from "@/components/layout/logo-mark";
import { cn } from "@/lib/utils";

interface LogoProps {
  name: string;
  tagline?: string;
  className?: string;
}

/**
 * The wordmark: the store's mark beside its name.
 *
 * The mark used to be drawn in CSS — a filled disc inside a brand-coloured
 * circle, standing in for the dot the name means. It is the real artwork now.
 * The name keeps its own colour rather than being baked into the image, so it
 * still answers to the theme and to the type scale.
 *
 * The tagline sits under the name between `sm` and `lg` and stays out of the
 * desktop row: from `lg` the header lays the wordmark, eight links and the
 * reader's controls on one 1216px line with nothing to spare, and the tagline
 * is the one element whose length the settings screen leaves free — the
 * shipped copy fit, a longer one folded the links onto two lines. The
 * reference draws the wordmark alone there.
 */
export function Logo({ name, tagline, className }: LogoProps) {
  return (
    <Link
      href={"/"}
      className={cn("group flex shrink-0 items-center gap-2.5", className)}
      aria-label={name}
    >
      <LogoMark
        size={36}
        className="transition-transform duration-100 ease-fluent group-hover:scale-110"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-xl font-bold text-primary">
          {name}
        </span>
        {tagline ? (
          <span className="mt-1 hidden text-label-sm text-muted sm:block lg:hidden">
            {tagline}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
