import { Star } from "lucide-react";

import type { Locale } from "@/i18n/config";
import { formatCompactNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  count?: number;
  locale: Locale;
  size?: "sm" | "md";
  /** The reference's card form: one amber star and the figure beside it. */
  compact?: boolean;
  className?: string;
}

/**
 * Five-star display with an optional review count. Read-only.
 *
 * The stars are amber now rather than brand orange — in the reference the
 * rating is the one thing on a card that is *not* the call to action, and
 * giving it the action colour was making every card compete with itself.
 */
export function Rating({
  value,
  count,
  locale,
  size = "sm",
  compact = false,
  className,
}: RatingProps) {
  const rounded = Math.round(value);
  const starSize = size === "sm" ? "size-3.5" : "size-4";

  if (compact) {
    return (
      <span
        className={cn("inline-flex items-center gap-1", className)}
        role="img"
        aria-label={`${value} / 5`}
      >
        <Star
          aria-hidden
          className={cn(starSize, "fill-gold text-gold")}
          strokeWidth={0}
        />
        <span className="text-label-md font-semibold text-on-surface" data-numeric>
          {value}
        </span>
      </span>
    );
  }

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
                ? "fill-gold text-gold"
                : "fill-transparent text-outline",
            )}
            strokeWidth={index < rounded ? 0 : 1.75}
          />
        ))}
      </div>
      {typeof count === "number" ? (
        <span className="text-label-md text-muted" data-numeric>
          ({formatCompactNumber(count, locale)})
        </span>
      ) : null}
    </div>
  );
}
