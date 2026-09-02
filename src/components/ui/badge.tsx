import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "primary" | "ink" | "outline" | "muted" | "gold";

const tones: Record<BadgeTone, string> = {
  primary: "border-transparent bg-primary-container text-on-primary-container",
  ink: "border-transparent bg-inverse-surface text-inverse-on-surface",
  outline: "border-line bg-card text-on-surface",
  muted: "border-transparent bg-surface-low text-on-surface-variant",
  /* The reference's ribbon note — an amber chip on a pale ground. */
  gold: "border-transparent bg-primary-fixed text-gold-fg",
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
