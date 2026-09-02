import { TrendingDown, TrendingUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  change?: number;
  changeLabel?: string;
  className?: string;
}

/** Headline metric with its period-over-period movement. */
export function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeLabel,
  className,
}: StatCardProps) {
  const positive = (change ?? 0) >= 0;
  const Trend = positive ? TrendingUp : TrendingDown;

  return (
    <div className={cn("rounded-md border border-line bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="label-mono text-muted">{label}</span>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low text-primary">
          <Icon aria-hidden className="size-4" strokeWidth={2} />
        </span>
      </div>

      <p className="mt-3 font-mono text-2xl font-bold text-on-surface" data-numeric>
        {value}
      </p>

      {typeof change === "number" ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-label-sm",
            positive ? "text-success-fg" : "text-error",
          )}
        >
          <Trend aria-hidden className="size-3.5" strokeWidth={2} />
          <span data-numeric>
            {positive ? "+" : ""}
            {change}%
          </span>
          {changeLabel ? (
            <span className="text-muted">{changeLabel}</span>
          ) : null}
        </p>
      ) : null}
    </div>
  );
}
