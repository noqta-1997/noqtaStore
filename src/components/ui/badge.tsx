import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type BadgeTone = "primary" | "ink" | "outline" | "muted";

const tones: Record<BadgeTone, string> = {
  primary: "border-line bg-primary-container text-on-primary-container",
  ink: "border-line bg-inverse-surface text-inverse-on-surface",
  outline: "border-line bg-card text-on-surface",
  muted: "border-outline bg-surface-high text-muted",
};

interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = "primary", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "label-mono inline-flex items-center gap-1 border px-2 py-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
