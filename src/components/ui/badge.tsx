import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * There is no `gold` tone. Amber is reserved for ratings — stars, the star
 * picker, the distribution bars — and nothing else, so that a gold mark on
 * this site always means a score. A chip is a label, never a score, so the
 * two call sites that wore amber (the hero eyebrow and the book tag) take
 * `muted` instead.
 */
export type BadgeTone = "primary" | "tint" | "ink" | "outline" | "muted";

const tones: Record<BadgeTone, string> = {
  primary: "border-transparent bg-primary-container text-on-primary-container",
  /*
   * The brand at chip weight. A card can carry a discount badge and an
   * add-to-cart button at once, and with both solid the eye cannot tell which
   * one it is meant to press — on a grid of twenty-four that is most of the
   * page shouting. `tint` says "brand" without claiming to be the action, so
   * the solid fill is left to the one control that actually does something.
   *
   * Pair with `--on-primary-fixed`, never `--on-primary-container`: that other
   * pairing measures 1.11:1 and the accessibility baseline caught it once.
   */
  tint: "border-transparent bg-primary-fixed text-on-primary-fixed",
  ink: "border-transparent bg-inverse-surface text-inverse-on-surface",
  outline: "border-line bg-card text-on-surface",
  muted: "border-transparent bg-surface-low text-on-surface-variant",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** 22px tall with circular ends — the reference's pill, at Fluent's Base200. */
export function Badge({ tone = "primary", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5.5 items-center gap-1 rounded-full border px-2.5",
        "text-label-md font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
