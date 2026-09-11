import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusBadge } from "@/components/ui/status-badge";
import { getOrders } from "@/data";
import { ReorderButton } from "@/components/commerce/reorder-button";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface OrdersPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.orders.title };
}

export default async function OrdersPage({
  searchParams,
}: OrdersPageProps) {
  const locale = defaultLocale;

  const [dictionary, allOrders] = await Promise.all([
    getDictionary(locale),
    getOrders(),
  ]);
  const orders = isEmptyPreview(await searchParams) ? [] : allOrders;
  const t = dictionary.account.orders;

  if (!orders.length) {
    return (
      <EmptyState
        icon={Package}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/books`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md">{t.title}</h2>
        <p className="text-body-md text-muted">{t.subtitle}</p>
      </header>

      <ul className="space-y-4">
        {orders.map((order) => {
          const itemsCount = order.items.reduce(
            (total, item) => total + item.quantity,
            0,
          );

          return (
            <li key={order.id} className="rounded-xl border border-line bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="label-mono text-muted">{t.orderNumber}</span>
                  <span
                    className="text-body-md font-semibold text-on-surface"
                    data-numeric
                  >
                    {order.reference}
                  </span>
                </div>
                <StatusBadge
                  status={order.status}
                  label={dictionary.orderStatus[order.status]}
                />
              </div>

              <dl className="grid gap-4 px-5 py-4 sm:grid-cols-3">
                <div>
                  <dt className="label-mono text-muted">{t.date}</dt>
                  <dd className="mt-1 text-body-md text-on-surface" data-numeric>
                    {formatDate(order.createdAt, locale)}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted">{t.items}</dt>
                  <dd className="mt-1 text-body-md text-on-surface">
                    <span data-numeric>{formatNumber(itemsCount, locale)}</span>{" "}
                    {t.itemsCount}
                  </dd>
                </div>
                <div>
                  <dt className="label-mono text-muted">{t.totalLabel}</dt>
                  <dd
                    className="mt-1 text-body-md font-semibold text-on-surface"
                    data-numeric
                  >
                    {formatPrice(order.total, locale)}
                  </dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 border-t border-line-divider px-5 py-4">
                <Link
                  href={`/account/orders/${order.id}`}
                  className={buttonStyles({ size: "sm" })}
                >
                  {t.details}
                </Link>
                <ReorderButton
                  orderId={order.id}
                  label={t.reorder}
                  successTitle={dictionary.common.toast.reordered}
                  signInMessage={dictionary.common.toast.signInRequired}
                  errorMessages={dictionary.common.actionErrors}
                  fallbackError={dictionary.common.toast.actionFailed}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
