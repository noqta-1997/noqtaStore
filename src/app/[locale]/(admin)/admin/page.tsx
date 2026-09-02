import { BookOpen, Coins, Package, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { AreaChart, ShareBars } from "@/components/admin/charts";
import { Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { BookCover } from "@/components/book/book-cover";
import { StatusBadge } from "@/components/ui/status-badge";
import {
  getAdminOrders,
  getAdminStats,
  getCategoryShares,
  getLowStockBooks,
  getSalesSeries,
  getTopBooks,
} from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import {
  formatCompactPrice,
  formatDate,
  formatMonth,
  formatNumber,
  formatPrice,
} from "@/lib/format";

interface DashboardPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.dashboard.title} — ${admin.brand.panel}` };
}

export default async function AdminDashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, admin, stats, series, top, shares, lowStock, recent] =
    await Promise.all([
      getDictionary(locale),
      getAdminDictionary(locale),
      getAdminStats(),
      getSalesSeries(),
      getTopBooks(),
      getCategoryShares(),
      getLowStockBooks(5),
      getAdminOrders({ perPage: 5 }),
    ]);

  const t = admin.dashboard;

  const cards = [
    {
      icon: Coins,
      label: t.stats.revenue,
      value: formatCompactPrice(stats.revenue.value, locale),
      change: stats.revenue.change,
    },
    {
      icon: Package,
      label: t.stats.orders,
      value: formatNumber(stats.orders.value, locale),
      change: stats.orders.change,
    },
    {
      icon: Users,
      label: t.stats.customers,
      value: formatNumber(stats.customers.value, locale),
      change: stats.customers.change,
    },
    {
      icon: BookOpen,
      label: t.stats.books,
      value: formatNumber(stats.books.value, locale),
      change: stats.books.change,
    },
  ];

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <StatCard
            key={card.label}
            icon={card.icon}
            label={card.label}
            value={card.value}
            change={card.change}
            changeLabel={admin.common.vsLastMonth}
          />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          title={t.revenueChart.title}
          subtitle={t.revenueChart.subtitle}
          className="min-w-0 lg:col-span-8"
        >
          <AreaChart
            caption={t.revenueChart.title}
            data={series.map((point) => ({
              label: formatMonth(point.month, locale),
              value: point.revenue,
              display: formatPrice(point.revenue, locale),
            }))}
          />
        </Panel>

        <Panel
          title={t.categoryShare.title}
          subtitle={t.categoryShare.subtitle}
          className="min-w-0 lg:col-span-4"
        >
          <ShareBars
            caption={t.categoryShare.title}
            data={shares.map((share) => ({
              label: share.category.name[locale],
              value: share.share,
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          title={t.recentOrders.title}
          subtitle={t.recentOrders.subtitle}
          flush
          className="min-w-0 lg:col-span-7"
          action={
            <Link
              href={`/${locale}/admin/orders`}
              className="text-label-md text-primary underline-offset-4 hover:underline"
            >
              {t.recentOrders.viewAll}
            </Link>
          }
        >
          <Table minWidth="34rem" className="border-0">
            <Thead>
              <Tr>
                <Th>{admin.orders.table.reference}</Th>
                <Th>{admin.orders.table.customer}</Th>
                <Th>{admin.orders.table.total}</Th>
                <Th>{admin.common.status}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {recent.items.map((order) => (
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
                  <Td className="text-on-surface-variant">{order.customer?.name}</Td>
                  <Td className="font-mono" data-numeric>
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
        </Panel>

        <Panel
          title={t.topBooks.title}
          subtitle={t.topBooks.subtitle}
          className="min-w-0 lg:col-span-5"
        >
          <ol className="space-y-4">
            {top.map((entry, index) => (
              <li key={entry.bookId} className="flex items-center gap-3">
                <span
                  className="flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-surface-low font-mono text-label-sm"
                  data-numeric
                >
                  {index + 1}
                </span>
                <span className="w-9 shrink-0">
                  <BookCover
                    title={entry.book.title[locale]}
                    author={entry.book.author.name[locale]}
                    seed={entry.book.slug}
                    src={entry.book.coverUrl}
                    sizes="2.25rem"
                    className="border border-line"
                  />
                </span>
                <span className="min-w-0 flex-1">
                  <Link
                    href={`/${locale}/admin/books/${entry.bookId}`}
                    className="block truncate text-sm font-semibold text-on-surface underline-offset-4 hover:underline"
                  >
                    {entry.book.title[locale]}
                  </Link>
                  <span className="block font-mono text-label-sm text-muted" data-numeric>
                    {formatNumber(entry.sold, locale)} {t.topBooks.sold}
                  </span>
                </span>
                <span className="shrink-0 font-mono text-label-md text-on-surface" data-numeric>
                  {formatCompactPrice(entry.revenue, locale)}
                </span>
              </li>
            ))}
          </ol>
        </Panel>
      </div>

      <Panel title={t.lowStock.title} subtitle={t.lowStock.subtitle} flush>
        <Table minWidth="34rem" className="border-0">
          <Thead>
            <Tr>
              <Th>{admin.books.table.book}</Th>
              <Th>{admin.books.table.category}</Th>
              <Th>{admin.books.table.price}</Th>
              <Th>{t.lowStock.remaining}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {lowStock.map((book) => (
              <Tr key={book.id}>
                <Td>
                  <Link
                    href={`/${locale}/admin/books/${book.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {book.title[locale]}
                  </Link>
                </Td>
                <Td className="text-on-surface-variant">{book.category.name[locale]}</Td>
                <Td className="font-mono" data-numeric>
                  {formatPrice(book.price, locale)}
                </Td>
                <Td>
                  <span
                    className="label-mono inline-flex border border-line bg-error-container px-2 py-1 text-on-error-container"
                    data-numeric
                  >
                    {formatNumber(book.stock, locale)}
                  </span>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Panel>

      <p className="text-label-sm text-muted">
        {admin.common.today}: <span data-numeric>{formatDate("2026-08-29", locale)}</span>
      </p>
    </>
  );
}
