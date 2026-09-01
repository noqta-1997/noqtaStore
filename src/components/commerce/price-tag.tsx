import type { Locale } from "@/i18n/config";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface PriceTagProps {
  price: number;
  compareAtPrice?: number;
  locale: Locale;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizes = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-xl sm:text-2xl",
} as const;

export function PriceTag({
  price,
  compareAtPrice,
  locale,
  size = "md",
  className,
}: PriceTagProps) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span
        className={cn("font-mono font-semibold text-on-surface", sizes[size])}
        data-numeric
      >
        {formatPrice(price, locale)}
      </span>
      {compareAtPrice ? (
        <span className="font-mono text-xs text-muted line-through" data-numeric>
          {formatPrice(compareAtPrice, locale)}
        </span>
      ) : null}
    </p>
  );
}
