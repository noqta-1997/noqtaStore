import { ArrowRight, Check, User } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { PrintButton } from "@/components/ui/print-button";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { BookCover } from "@/components/book/book-cover";
import { OrderSummary } from "@/components/commerce/order-summary";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminOrderById, getOrderItems } from "@/data";
import { ActionForm } from "@/components/ui/action-form";
import { updateOrderStatus } from "@/app/actions/admin";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/types";

interface AdminOrderPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AdminOrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const [admin, order] = await Promise.all([
    getAdminDictionary(defaultLocale),
    getAdminOrderById(id),
  ]);

  return {
    title: `${admin.orderDetails.title} ${order?.reference ?? ""} — ${admin.brand.panel}`,
  };
}

const statuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { id } = await params;
  const locale = defaultLocale;

  const order = await getAdminOrderById(id);

  if (!order) {
    notFound();
  }

  const [dictionary, admin, items] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getOrderItems(order),
  ]);

  const t = admin.orderDetails;

  const contact = [
    { label: admin.settings.account.email, value: order.customer?.email ?? "", ltr: true },
    { label: admin.settings.account.phone, value: order.customer?.phone ?? "", ltr: true },
    {
      label: t.customerSince,
      value: order.customer ? formatDate(order.customer.joinedAt, locale) : "",
      ltr: false,
    },
    {
      label: t.totalOrders,
      value: order.customer ? formatNumber(order.customer.ordersCount, locale) : "",
      ltr: false,
    },
  ];

  return (
    <>
      <Link
        href={`/admin/orders`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={1.75} />
        {admin.orders.title}
      </Link>

      <AdminPageHeader
        title={`${t.title} ${order.reference}`}
        subtitle={`${admin.orders.table.date}: ${formatDate(order.createdAt, locale)}`}
        actions={
          <>
            <StatusBadge
              status={order.status}
              label={dictionary.orderStatus[order.status]}
              className="self-center"
            />
            <PrintButton label={t.printInvoice} />
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-4 min-w-0 lg:col-span-8">
          <Panel title={t.items} flush>
            <Table minWidth="34rem" className="border-0">
              <Thead>
                <Tr>
                  <Th>{admin.books.table.book}</Th>
                  <Th>{admin.books.table.price}</Th>
                  <Th>{dictionary.common.quantity}</Th>
                  <Th>{dictionary.common.total}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {items.map((item) => (
                  <Tr key={item.bookId}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="w-9 shrink-0">
                          <BookCover
                            title={item.book.title[locale]}
                            author={item.book.author.name[locale]}
                            seed={item.book.slug}
                            src={item.book.coverUrl}
                            sizes="2.25rem"
                            className="rounded-md elevation-sm"
                            compact
                          />
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`/admin/books/${item.bookId}`}
                            className="block max-w-56 truncate font-semibold underline-offset-4 hover:underline"
                          >
                            {item.book.title[locale]}
                          </Link>
                          <span className="block text-label-md text-muted">
                            {item.book.author.name[locale]}
                          </span>
                        </span>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap" data-numeric>
                      {formatPrice(item.unitPrice, locale)}
                    </Td>
                    <Td data-numeric>
                      {formatNumber(item.quantity, locale)}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold" data-numeric>
                      {formatPrice(item.lineTotal, locale)}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Panel>

          <Panel title={t.timeline}>
            <ol>
              {order.timeline.map((entry, index) => (
                <li key={entry.status} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-full",
                        entry.done ? "bg-success text-on-success" : "bg-surface-low text-muted",
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
                    <p className="text-label-md text-muted" data-numeric>
                      {formatDate(entry.date, locale)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </Panel>
        </div>

        <div className="space-y-4 min-w-0 lg:col-span-4">
          <Panel title={t.updateStatus}>
            <ActionForm
              className="space-y-3"
              action={updateOrderStatus}
              successTitle={dictionary.common.toast.statusUpdated}
              fallbackError={dictionary.common.toast.actionFailed}
              errorMessages={{
                forbidden: dictionary.common.actionErrors.forbidden,
                notFound: dictionary.common.actionErrors.notFound,
                // Reviving a cancelled order takes the copies back off the
                // shelf, and the shelf may no longer have them.
                outOfStock: dictionary.common.outOfStock,
              }}
            >
              <input type="hidden" name="orderId" value={order.id} />
              <label htmlFor="orderStatus" className="sr-only">
                {t.updateStatus}
              </label>
              <Select id="orderStatus" name="status" defaultValue={order.status}>
                {statuses.map((entry) => (
                  <option key={entry} value={entry}>
                    {dictionary.orderStatus[entry]}
                  </option>
                ))}
              </Select>
              <Button type="submit" fullWidth>
                {admin.common.saveChanges}
              </Button>
              <p className="text-label-md text-muted">{t.statusHint}</p>
            </ActionForm>
          </Panel>

          <Panel
            title={t.customer}
            action={
              <Link
                href={`/admin/customers/${order.customerId}`}
                className="text-label-md text-primary underline-offset-4 hover:underline"
              >
                {t.viewCustomer}
              </Link>
            }
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span
                  aria-hidden
                  className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary-container font-display text-body-lg font-bold text-on-primary-container"
                >
                  {order.customer?.name.slice(0, 1) ?? <User className="size-4" />}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-on-surface">{order.customer?.name}</p>
                  <p className="text-label-md text-muted">
                    {order.customer?.city[locale]}
                  </p>
                </div>
              </div>

              <dl className="space-y-3 border-t border-line-divider pt-4">
                {contact.map((entry) => (
                  <div key={entry.label} className="flex items-baseline justify-between gap-3">
                    <dt className="label-mono text-muted">{entry.label}</dt>
                    <dd
                      className="min-w-0 truncate text-label-md text-on-surface"
                      {...(entry.ltr ? { dir: "ltr", "data-numeric": true } : {})}
                    >
                      {entry.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </Panel>

          <Panel title={t.shippingAddress}>
            <address className="space-y-1 text-body-md not-italic text-on-surface-variant">
              <span className="block font-semibold text-on-surface">
                {order.address.fullName}
              </span>
              <span className="block">
                {order.address.governorate[locale]}، {order.address.city[locale]}
              </span>
              <span className="block">{order.address.line[locale]}</span>
              <span className="block" dir="ltr" data-numeric>
                {order.address.phone}
              </span>
            </address>
          </Panel>

          <OrderSummary
            title={t.summary}
            locale={locale}
            dictionary={dictionary.common}
            totals={{
              subtotal: order.subtotal,
              shipping: order.shippingCost,
              discount: order.discount,
              total: order.total,
            }}
          />
        </div>
      </div>
    </>
  );
}
