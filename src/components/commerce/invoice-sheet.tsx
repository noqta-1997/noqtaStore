import { Mail, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { CSSProperties } from "react";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import { noqtaBrand } from "@/theme/noqta-brand";
import { noqtaPaperLight } from "@/theme/noqta-paper";
import type { Localized, Order } from "@/types";

import logoLight from "../../../public/images/logo.png";

interface InvoiceLine {
  id: string;
  title: Localized;
  authorName: Localized;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface InvoiceSheetProps {
  order: Order;
  items: InvoiceLine[];
  store: { name: string; tagline: string; address: string; phone: string; email: string };
  dictionary: Dictionary;
  locale: Locale;
}

/*
 * Light values, always. A reader on the dark theme still prints on white
 * paper, so the sheet reads the ramps directly instead of the theme tokens,
 * which would follow the toggle onto the page.
 */
const palette = {
  "--inv-brand": noqtaBrand[80],
  "--inv-brand-ink": noqtaBrand[50],
  "--inv-page": noqtaPaperLight.paper50,
  "--inv-band": noqtaPaperLight.paper150,
  "--inv-ink": noqtaPaperLight.ink900,
  "--inv-muted": noqtaPaperLight.ink600,
} as CSSProperties;

/*
 * The sheet is one page whatever the order, so the line bands tighten as the
 * order grows: roomy with the author under each title, then without it, then
 * in a smaller size, and last smaller still with the terms dropped to make
 * room. Measured with two lines of order notes, the worst case, each tier is
 * used only up to the count it holds; the last holds 18, and an order past
 * that loses its final lines to the page edge rather than run to a second.
 */
const densities = {
  roomy: { upTo: 4, spacing: "border-spacing-y-[3mm]", cell: "py-[3.2mm]", text: "", author: true, terms: true },
  dense: { upTo: 9, spacing: "border-spacing-y-[1.5mm]", cell: "py-[1.8mm]", text: "", author: false, terms: true },
  tight: { upTo: 12, spacing: "border-spacing-y-[0.8mm]", cell: "py-[1mm]", text: "text-[9pt]", author: false, terms: true },
  packed: { upTo: Infinity, spacing: "border-spacing-y-[0.5mm]", cell: "py-[0.6mm]", text: "text-[8pt]", author: false, terms: false },
};

/**
 * The invoice as printed: one A4 sheet, laid out after a classic banded
 * invoice — ruled masthead, billing pair, a filled header row over tinted
 * line bands, totals, terms, ruled footer.
 *
 * It is in the order page's DOM but hidden on screen; the print rules in
 * globals.css hide everything else when it is present, so the print dialog's
 * "save as PDF" is what the download button hands the reader.
 */
export function InvoiceSheet({ order, items, store, dictionary, locale }: InvoiceSheetProps) {
  const t = dictionary.invoice;
  const rows = Object.values(densities).find((tier) => items.length <= tier.upTo)!;

  const payment =
    dictionary.checkout.paymentOptions[
      order.paymentMethod === "cod"
        ? "codTitle"
        : order.paymentMethod === "wallet"
          ? "walletTitle"
          : "cardTitle"
    ];

  const totals = [
    { label: dictionary.common.subtotal, value: formatPrice(order.subtotal, locale) },
    {
      label: dictionary.common.shipping,
      value:
        order.shippingCost === 0
          ? dictionary.common.free
          : formatPrice(order.shippingCost, locale),
    },
    ...(order.discount > 0
      ? [{ label: dictionary.common.discount, value: `− ${formatPrice(order.discount, locale)}` }]
      : []),
  ];

  const customerLines = [
    `${order.address.governorate[locale]}، ${order.address.city[locale]}`,
    order.address.line[locale],
  ].filter(Boolean);

  return (
    <div
      data-invoice
      style={palette}
      className="hidden h-[297mm] w-[210mm] flex-col overflow-hidden bg-(--inv-page) px-[16mm] py-[14mm] text-[10.5pt] text-(--inv-ink) [print-color-adjust:exact] print:flex"
    >
      {/* Masthead */}
      <div className="flex items-center gap-[6mm] border-y border-(--inv-brand-ink) py-[4mm]">
        <div className="flex items-center gap-[3mm]">
          <Image
            src={logoLight}
            alt=""
            loading="eager"
            className="h-[13mm] w-auto object-contain"
          />
          <div className="leading-tight">
            <p className="text-[15pt] font-bold text-(--inv-brand-ink)">{store.name}</p>
            {store.tagline ? (
              <p className="mt-[1mm] text-[8.5pt] text-(--inv-muted)">{store.tagline}</p>
            ) : null}
          </div>
        </div>

        <span aria-hidden className="h-[11mm] w-px bg-(--inv-brand-ink)" />

        <p className="text-[36pt] font-bold leading-none text-(--inv-brand-ink)">
          {t.title}
          <span className="text-(--inv-brand)">.</span>
        </p>

        <dl className="ms-auto space-y-[1.5mm] whitespace-nowrap text-[9pt]">
          <div className="flex justify-between gap-[4mm]">
            <dt className="text-(--inv-muted)">{t.number}</dt>
            <dd dir="ltr" className="font-bold" data-numeric>
              {order.reference}
            </dd>
          </div>
          <div className="flex justify-between gap-[4mm]">
            <dt className="text-(--inv-muted)">{t.date}</dt>
            <dd data-numeric>{formatDate(order.createdAt, locale)}</dd>
          </div>
        </dl>
      </div>

      {/* Billing */}
      <div className="mt-[7mm] grid grid-cols-2 gap-[10mm]">
        <div>
          <p className="text-[12pt] font-bold text-(--inv-brand-ink)">{t.billTo}:</p>
          <div className="mt-[2mm] space-y-[1mm] leading-snug text-(--inv-muted)">
            <p className="text-(--inv-ink)">{order.address.fullName}</p>
            {customerLines.map((line) => (
              <p key={line}>{line}</p>
            ))}
            <p dir="ltr" className="text-end" data-numeric>
              {order.address.phone}
            </p>
          </div>
        </div>
        <div>
          <p className="text-[12pt] font-bold text-(--inv-brand-ink)">{t.billFrom}:</p>
          <div className="mt-[2mm] space-y-[1mm] leading-snug text-(--inv-muted)">
            <p className="text-(--inv-ink)">{store.name}</p>
            {store.address ? <p>{store.address}</p> : null}
            {store.phone ? (
              <p dir="ltr" className="text-end" data-numeric>
                {store.phone}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Lines — separate borders give the gap between bands. */}
      <table
        className={cn("mt-[6mm] w-full border-separate border-spacing-x-0", rows.spacing)}
      >
        <thead>
          <tr className="bg-(--inv-brand) text-[11pt] text-white">
            <th className="px-[5mm] py-[3mm] text-start font-bold">{t.item}</th>
            <th className="w-[32mm] py-[3mm] text-center font-bold">{t.price}</th>
            <th className="w-[20mm] py-[3mm] text-center font-bold">{t.quantity}</th>
            <th className="w-[34mm] px-[5mm] py-[3mm] text-end font-bold">{t.total}</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const cell = rows.cell;

            return (
              <tr key={item.id} className={cn("bg-(--inv-band)", rows.text)}>
                <td className={cn("px-[5mm]", cell)}>
                  <span className="block leading-snug">{item.title[locale]}</span>
                  {rows.author && item.authorName[locale] ? (
                    <span className="block text-[8.5pt] text-(--inv-muted)">
                      {dictionary.common.by} {item.authorName[locale]}
                    </span>
                  ) : null}
                </td>
                <td className={cn("whitespace-nowrap text-center", cell)} data-numeric>
                  {formatPrice(item.unitPrice, locale)}
                </td>
                <td className={cn("text-center", cell)} data-numeric>
                  {formatNumber(item.quantity, locale)}
                </td>
                <td className={cn("whitespace-nowrap px-[5mm] text-end", cell)} data-numeric>
                  {formatPrice(item.lineTotal, locale)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Payment and totals */}
      <div className="mt-[4mm] flex items-start justify-between gap-[10mm]">
        <div className="max-w-[80mm] space-y-[3mm]">
          <div>
            <p className="text-[11pt] font-bold text-(--inv-brand-ink)">{t.paymentMethod}:</p>
            <p className="mt-[1mm] text-(--inv-muted)">{payment}</p>
          </div>
          <div>
            <p className="text-[11pt] font-bold text-(--inv-brand-ink)">{t.shippingMethod}:</p>
            <p className="mt-[1mm] text-(--inv-muted)">
              {dictionary.checkout.shippingOptions.standardTitle}
            </p>
          </div>
          {order.notes ? (
            <div>
              <p className="text-[11pt] font-bold text-(--inv-brand-ink)">{t.notes}:</p>
              <p className="mt-[1mm] line-clamp-2 whitespace-pre-line text-(--inv-muted)">
                {order.notes}
              </p>
            </div>
          ) : null}
        </div>

        <dl className="w-[74mm] text-[10.5pt]">
          {totals.map((row) => (
            <div key={row.label} className="flex justify-between gap-[4mm] px-[5mm] py-[1.8mm]">
              <dt className="text-(--inv-muted)">{row.label}</dt>
              <dd className="whitespace-nowrap" data-numeric>
                {row.value}
              </dd>
            </div>
          ))}
          <div className="mt-[2mm] flex justify-between gap-[4mm] border-t border-(--inv-brand-ink) px-[5mm] pt-[3mm] text-[13pt] font-bold text-(--inv-brand-ink)">
            <dt>{dictionary.common.total}</dt>
            <dd className="whitespace-nowrap" data-numeric>
              {formatPrice(order.total, locale)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Terms */}
      {rows.terms ? (
        <div className="mt-[6mm]">
          <p className="text-[11pt] font-bold text-(--inv-brand-ink)">{t.terms}:</p>
          <p className="mt-[1.5mm] text-[9pt] leading-relaxed text-(--inv-muted)">{t.termsBody}</p>
        </div>
      ) : null}

      {/* Footer, pinned to the foot of the sheet */}
      <div className="mt-auto flex items-center justify-between gap-[6mm] border-y border-(--inv-brand-ink) py-[4mm] text-[9pt] text-(--inv-muted)">
        {[
          { icon: Mail, value: store.email, ltr: true },
          { icon: MapPin, value: store.address, ltr: false },
          { icon: Phone, value: store.phone, ltr: true },
        ]
          .filter((entry) => entry.value)
          .map(({ icon: Icon, value, ltr }) => (
            <span key={value} className="flex items-center gap-[2mm]">
              <Icon aria-hidden className="size-[4mm] shrink-0 text-(--inv-brand)" strokeWidth={1.75} />
              <span {...(ltr ? { dir: "ltr", "data-numeric": true } : {})}>{value}</span>
            </span>
          ))}
      </div>
    </div>
  );
}
