import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "primary" | "ink" | "outline" | "muted";

const tones: Record<BadgeTone, string> = {
  primary: "border-transparent bg-primary-container text-on-primary-container",
  ink: "border-transparent bg-inverse-surface text-inverse-on-surface",
  outline: "border-line bg-card text-on-surface",
  muted: "border-transparent bg-surface-low text-on-surface-variant",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

/** Fluent's badge proportions: 20px tall, circular ends, Base200 semibold. */
export function Badge({ tone = "primary", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-sm border px-1.5",
        "text-label-md font-semibold",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
