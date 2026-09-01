import { ArrowRight, Ban, Coins, Package, Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getCustomerById, getOrdersByCustomer } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";

interface AdminCustomerPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminCustomerPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const [admin, customer] = await Promise.all([
    getAdminDictionary(isLocale(locale) ? locale : "ar"),
    getCustomerById(id),
  ]);

  return {
    title: `${customer?.name ?? admin.customerDetails.title} — ${admin.brand.panel}`,
  };
}

export default async function AdminCustomerPage({ params }: AdminCustomerPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const customer = await getCustomerById(id);

  if (!customer) {
    notFound();
  }

  const [dictionary, admin, orders] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getOrdersByCustomer(customer.id),
  ]);

  const t = admin.customerDetails;
  const averageOrder = customer.ordersCount
    ? Math.round(customer.totalSpent / customer.ordersCount)
    : 0;

  const contact = [
    { label: admin.settings.account.email, value: customer.email, ltr: true },
    { label: admin.settings.account.phone, value: customer.phone, ltr: true },
    { label: admin.customers.table.city, value: customer.city[locale], ltr: false },
    {
      label: t.stats.joined,
      value: formatDate(customer.joinedAt, locale),
      ltr: false,
    },
  ];

  return (
    <>
      <Link
        href={`/${locale}/admin/customers`}
        className="inline-flex items-center gap-2 text-label-md text-on-surface underline-offset-4 hover:underline"
      >
        <ArrowRight aria-hidden className="size-4 rotate-180 rtl:rotate-0" strokeWidth={2} />
        {t.backToList}
      </Link>

      <AdminPageHeader
        title={customer.name}
        subtitle={t.title}
        actions={
          <>
            <Badge tone={customer.status === "active" ? "outline" : "muted"}>
              {customer.status === "active"
                ? admin.customers.statuses.active
                : admin.customers.statuses.blocked}
            </Badge>
            <Button variant="secondary" size="md">
              <Ban aria-hidden className="size-4" strokeWidth={2} />
              {customer.status === "active"
                ? admin.customers.block
                : admin.customers.unblock}
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Package}
          label={t.stats.orders}
          value={formatNumber(customer.ordersCount, locale)}
        />
        <StatCard
          icon={Coins}
          label={t.stats.spent}
          value={formatPrice(customer.totalSpent, locale)}
        />
        <StatCard
          icon={Receipt}
          label={t.stats.average}
          value={formatPrice(averageOrder, locale)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel title={t.contact} className="lg:col-span-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex size-12 shrink-0 items-center justify-center border border-line bg-inverse-surface font-display text-lg font-bold text-inverse-on-surface"
              >
                {customer.name.slice(0, 1)}
              </span>
              <p className="font-display text-lg font-bold text-on-surface">
                {customer.name}
              </p>
            </div>

            <dl className="divide-y divide-outline-variant border-t border-outline-variant">
              {contact.map((entry) => (
                <div
                  key={entry.label}
                  className="flex items-baseline justify-between gap-3 py-3"
                >
                  <dt className="label-mono shrink-0 text-muted">{entry.label}</dt>
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

        <Panel title={t.ordersTitle} flush className="lg:col-span-8">
          {orders.length ? (
            <Table minWidth="34rem" className="border-0">
              <Thead>
                <Tr>
                  <Th>{admin.orders.table.reference}</Th>
                  <Th>{admin.orders.table.date}</Th>
                  <Th>{admin.orders.table.total}</Th>
                  <Th>{admin.common.status}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {orders.map((order) => (
                  <Tr key={order.id}>
                    <Td>
                      <Link
                        href={`/${locale}/admin/orders/${order.id}`}
                        className="font-mono font-semibold underline-offset-4 hover:underline"
                        data-numeric
                      >
                        {order.reference}
                      </Link>
                    </Td>
                    <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                      {formatDate(order.createdAt, locale)}
                    </Td>
                    <Td className="font-mono whitespace-nowrap font-semibold" data-numeric>
                      {formatPrice(order.total, locale)}
                    </Td>
                    <Td>
                      <StatusBadge
                        status={order.status}
                        label={dictionary.orderStatus[order.status]}
                      />
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          ) : (
            <p className="p-5 text-body-md text-muted">{t.noOrders}</p>
          )}
        </Panel>
      </div>
    </>
  );
}
