import { Star } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  locale: Locale;
  size?: "sm" | "md";
  className?: string;
}

/** Five-star display with an optional review count. Read-only. */
export function Rating({ value, count, locale, size = "sm", className }: RatingProps) {
  const rounded = Math.round(value);
  const starSize = size === "sm" ? "size-3.5" : "size-4";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${value} / 5`}
      >
        {Array.from({ length: 5 }, (_, index) => (
          <Star
            key={index}
            aria-hidden
            className={cn(
              starSize,
              index < rounded
                ? "fill-primary-container text-line"
                : "fill-transparent text-outline",
            )}
            strokeWidth={2}
          />
        ))}
      </div>
      {typeof count === "number" ? (
        <span className="font-mono text-xs text-muted" data-numeric>
          ({formatCompactNumber(count, locale)})
        </span>
      ) : null}
    </div>
  );
}
