import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface PanelProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  /** Removes the body padding for tables that draw their own. */
  flush?: boolean;
  className?: string;
}

/** Framed card with a titled header — the admin's basic building block. */
export function Panel({
  title,
  subtitle,
  action,
  children,
  flush = false,
  className,
}: PanelProps) {
  return (
    <section className={cn("min-w-0 border border-line bg-card", className)}>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
        <div className="space-y-0.5">
          <h2 className="font-display text-lg font-bold text-on-surface">{title}</h2>
          {subtitle ? <p className="text-label-sm text-muted">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}
