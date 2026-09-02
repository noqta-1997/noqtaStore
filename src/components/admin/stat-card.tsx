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
    <div className={cn("rounded-xl border border-line bg-card p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <span className="text-label-md font-semibold text-muted">{label}</span>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-fixed text-primary">
          <Icon aria-hidden className="size-4" strokeWidth={1.75} />
        </span>
      </div>

      <p className="mt-3 font-display text-headline-xl text-on-surface" data-numeric>
        {value}
      </p>

      {typeof change === "number" ? (
        <p
          className={cn(
            "mt-2 flex items-center gap-1.5 text-label-md",
            positive ? "text-success-fg" : "text-error",
          )}
        >
          <Trend aria-hidden className="size-3.5" strokeWidth={1.75} />
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
