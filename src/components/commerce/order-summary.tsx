import type { ReactNode } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { Surface, surfaceTitleStyles } from "@/components/ui/surface";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface SummaryTotals {
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
}

/** The five words the totals block needs — not the whole `common` dictionary. */
export interface SummaryLabels {
  subtotal: string;
  shipping: string;
  discount: string;
  total: string;
  free: string;
}

export function summaryLabels(dictionary: Dictionary["common"]): SummaryLabels {
  return {
    subtotal: dictionary.subtotal,
    shipping: dictionary.shipping,
    discount: dictionary.discount,
    total: dictionary.total,
    free: dictionary.free,
  };
}

interface SummaryTotalsProps {
  totals: SummaryTotals;
  locale: Locale;
  labels: SummaryLabels;
}

/**
 * The lines under the money box: subtotal, shipping, any discount, and the
 * total. Split from the box so the checkout can draw it from the browser,
 * where the shipping line follows the method the reader picks; the cart
 * and the order pages draw it once, on the server, through `OrderSummary`.
 * No `"use client"` here — it is plain markup either side can render.
 */
export function SummaryTotalRows({ totals, locale, labels }: SummaryTotalsProps) {
  const rows = [
    { label: labels.subtotal, value: formatPrice(totals.subtotal, locale) },
    {
      label: labels.shipping,
      value:
        totals.shipping === 0
          ? labels.free
          : formatPrice(totals.shipping, locale),
      accent: totals.shipping === 0,
    },
    ...(totals.discount > 0
      ? [
          {
            label: labels.discount,
            value: `− ${formatPrice(totals.discount, locale)}`,
            accent: true,
          },
        ]
      : []),
  ];

  return (
    <>
      <dl className="space-y-3 px-5 py-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-body-md text-on-surface-variant">{row.label}</dt>
            <dd
              className={cn(
                "text-body-md font-medium",
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
          {labels.total}
        </span>
        <span className="text-headline-md font-bold text-on-surface" data-numeric>
          {formatPrice(totals.total, locale)}
        </span>
      </div>
    </>
  );
}

interface OrderSummaryProps {
  title: string;
  /** Drawn on the server. The checkout passes `totalsSlot` instead. */
  totals?: SummaryTotals;
  /** Replaces the server-drawn rows with a component that keeps them live. */
  totalsSlot?: ReactNode;
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
  totalsSlot,
  locale,
  dictionary,
  children,
  footer,
  className,
}: OrderSummaryProps) {
  return (
    <Surface as="section" className={className}>
      <h2 className={surfaceTitleStyles()}>{title}</h2>

      {children ? (
        <div className="border-b border-line px-5 py-4">{children}</div>
      ) : null}

      {totalsSlot ??
        (totals ? (
          <SummaryTotalRows
            totals={totals}
            locale={locale}
            labels={summaryLabels(dictionary)}
          />
        ) : null)}

      {footer ? <div className="px-5 pb-5">{footer}</div> : null}
    </Surface>
  );
}
