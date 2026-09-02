import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SummaryTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

interface OrderSummaryProps {
  title: string;
  totals: SummaryTotals;
  locale: Locale;
  dictionary: Dictionary["common"];
  /** Rendered above the totals — coupon field, item list, etc. */
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** The money box shared by the cart, checkout and order pages. */
export function OrderSummary({
  title,
  totals,
  locale,
  dictionary,
  children,
  footer,
  className,
}: OrderSummaryProps) {
  const rows = [
    { label: dictionary.subtotal, value: formatPrice(totals.subtotal, locale) },
    {
      label: dictionary.shipping,
      value:
        totals.shipping === 0
          ? dictionary.free
          : formatPrice(totals.shipping, locale),
      accent: totals.shipping === 0,
    },
    ...(totals.discount > 0
      ? [
          {
            label: dictionary.discount,
            value: `− ${formatPrice(totals.discount, locale)}`,
            accent: true,
          },
        ]
      : []),
  ];

  return (
    <section className={cn("rounded-md border border-line bg-card", className)}>
      <h2 className="border-b border-line px-5 py-4 text-headline-md">{title}</h2>

      {children ? (
        <div className="border-b border-line px-5 py-4">{children}</div>
      ) : null}

      <dl className="space-y-3 px-5 py-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-body-md text-on-surface-variant">{row.label}</dt>
            <dd
              className={cn(
                "font-mono text-body-md font-medium",
                row.accent ? "text-success-fg" : "text-on-surface",
              )}
              data-numeric
            >
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex items-baseline justify-between gap-3 border-t border-line px-5 py-4">
        <span className="text-body-lg font-semibold text-on-surface">
          {dictionary.total}
        </span>
        <span className="font-mono text-xl font-bold text-on-surface" data-numeric>
          {formatPrice(totals.total, locale)}
        </span>
      </div>

      {footer ? <div className="px-5 pb-5">{footer}</div> : null}
    </section>
  );
}
