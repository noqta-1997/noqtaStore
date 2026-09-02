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
  sm: "text-body-md",
  md: "text-body-lg",
  lg: "text-headline-md sm:text-headline-lg",
} as const;

/**
 * The reference sets the live price in heavy ink and the struck-through one
 * small and grey beside it, both in the running face — there is no monospace
 * anywhere in it. `data-numeric` still selects tabular figures, so a column
 * of prices in the cart or an invoice still lines up.
 */
export function PriceTag({
  price,
  compareAtPrice,
  locale,
  size = "md",
  className,
}: PriceTagProps) {
  return (
    <p className={cn("flex flex-wrap items-baseline gap-2", className)}>
      <span className={cn("font-bold text-on-surface", sizes[size])} data-numeric>
        {formatPrice(price, locale)}
      </span>
      {compareAtPrice ? (
        <span className="text-label-md text-muted line-through" data-numeric>
          {formatPrice(compareAtPrice, locale)}
        </span>
      ) : null}
    </p>
  );
}
