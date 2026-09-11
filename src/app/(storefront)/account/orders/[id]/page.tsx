import { ArrowRight, Check, LifeBuoy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/book/book-cover";
import { OrderSummary } from "@/components/commerce/order-summary";
import { StatusBadge } from "@/components/ui/status-badge";
import { Surface, surfaceTitleStyles } from "@/components/ui/surface";
import { getOrderById, getOrderItems } from "@/data";
import { PrintButton } from "@/components/ui/print-button";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: OrderDetailsPageProps): Promise<Metadata> {
  const { id } = await params;
  const dictionary = await getDictionary(defaultLocale);
  const order = await getOrderById(id);

  return {
    title: order
      ? `${dictionary.account.orderDetails.title} ${order.reference}`
      : dictionary.account.orderDetails.title,
  };
}

export default async function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const order = await getOrderById(id);

  if (!order) {
    notFound();
  }

  const [dictionary, items] = await Promise.all([
    getDictionary(locale),
    getOrderItems(order),
  ]);

  const t = dictionary.account.orderDetails;

  const facts = [
    {
      label: t.shippingAddress,
      value: `${order.address.fullName} — ${order.address.governorate[locale]}، ${order.address.city[locale]}، ${order.address.line[locale]}`,
    },
    {
      label: t.paymentMethod,
      value: dictionary.checkout.paymentOptions[
        order.paymentMethod === "cod"
          ? "codTitle"
          : order.paymentMethod === "wallet"
            ? "walletTitle"
            : "cardTitle"
      ],
    },
    {
      label: t.shippingMethod,
      value: dictionary.checkout.shippingOptions[
        order.shippingMethod === "standard"
          ? "standardTitle"
          : order.shippingMethod === "express"
            ? "expressTitle"
            : "pickupTitle"
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href={`/account/orders`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {dictionary.account.orders.title}
      </Link>

      <Surface
        as="header"
        className="flex flex-wrap items-center justify-between gap-4 p-5"
      >
        <div className="space-y-1">
          <h2 className="text-headline-md" data-numeric>
            {order.reference}
          </h2>
          <p className="text-label-md text-muted">
            {t.placedOn}{" "}
            <span data-numeric>{formatDate(order.createdAt, locale)}</span>
          </p>
        </div>
        <StatusBadge
          status={order.status}
          label={dictionary.orderStatus[order.status]}
        />
      </Surface>

      <Surface as="section">
        <h3 className={surfaceTitleStyles()}>{t.timeline}</h3>
        <ol className="space-y-0 p-5">
          {order.timeline.map((entry, index) => (
            <li key={entry.status} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full",
                    entry.done
                      ? "bg-success text-on-success"
                      : "bg-surface-low text-muted",
                  )}
                >
                  {entry.done ? (
                    <Check aria-hidden className="size-4" strokeWidth={2.5} />
                  ) : (
                    <span className="size-2 rounded-full bg-outline" />
                  )}
                </span>
                {index < order.timeline.length - 1 ? (
                  <span
                    aria-hidden
                    className={cn(
                      "w-px flex-1",
                      entry.done ? "bg-success" : "bg-outline-variant",
                    )}
                  />
                ) : null}
              </div>

              <div className={cn("pb-6", index === order.timeline.length - 1 && "pb-0")}>
                <p
                  className={cn(
                    "text-body-md font-semibold",
                    entry.done ? "text-on-surface" : "text-muted",
                  )}
                >
                  {dictionary.orderStatus[entry.status]}
                </p>
                <p className="text-label-sm text-muted" data-numeric>
                  {formatDate(entry.date, locale)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Surface>

      <div className="grid gap-6 lg:grid-cols-12">
        <Surface as="section" className="lg:col-span-7">
          <h3 className={surfaceTitleStyles()}>{t.itemsTitle}</h3>
          <ul className="divide-y divide-line-divider">
            {items.map((item) => (
              <li key={item.bookId} className="flex items-center gap-4 p-5">
                <span className="w-14 shrink-0">
                  <BookCover
                    title={item.book.title[locale]}
                    author={item.book.author.name[locale]}
                    seed={item.book.slug}
                    src={item.book.coverUrl}
                    sizes="3.5rem"
                    className="border border-line"
                    compact
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/books/${item.book.slug}`}
                    className="block font-display text-base font-bold underline-offset-4 hover:underline"
                  >
                    {item.book.title[locale]}
                  </Link>
                  <span className="block text-label-md text-muted">
                    {dictionary.common.by} {item.book.author.name[locale]}
                  </span>
                  <span className="mt-1 block text-label-sm text-muted" data-numeric>
                    {formatPrice(item.unitPrice, locale)} × {item.quantity}
                  </span>
                </span>
                <span className="shrink-0 text-body-md font-semibold" data-numeric>
                  {formatPrice(item.lineTotal, locale)}
                </span>
              </li>
            ))}
          </ul>
        </Surface>

        <div className="space-y-6 lg:col-span-5">
          <OrderSummary
            title={dictionary.checkout.orderSummary}
            locale={locale}
            dictionary={dictionary.common}
            totals={{
              subtotal: order.subtotal,
              shipping: order.shippingCost,
              discount: order.discount,
              total: order.total,
            }}
            footer={
              <PrintButton label={t.downloadInvoice} icon="download" fullWidth />
            }
          />

          <Surface as="section" className="p-5">
            <dl className="space-y-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="label-mono text-muted">{fact.label}</dt>
                  <dd className="mt-1 text-body-md leading-relaxed text-on-surface">
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Surface>

          <Surface
            as="section"
            appearance="filled-alternative"
            className="flex items-center gap-3 p-5"
          >
            <LifeBuoy aria-hidden className="size-5 shrink-0 text-primary" strokeWidth={1.75} />
            <div className="min-w-0">
              <p className="text-body-md text-on-surface">{t.needHelp}</p>
              <Link
                href={`/contact`}
                className="text-label-md text-primary underline underline-offset-4"
              >
                {t.contactSupport}
              </Link>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  );
}
