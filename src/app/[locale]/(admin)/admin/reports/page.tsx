import { Coins, Download, Package, Repeat, Receipt } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { BarChart, ShareBars } from "@/components/admin/charts";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { buttonStyles } from "@/components/ui/button";
import {
  getAdminStats,
  getCategoryShares,
  getSalesSeries,
  getTopBooks,
} from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary } from "@/i18n/get-dictionary";
import {
  formatCompactPrice,
  formatMonth,
  formatNumber,
  formatPrice,
} from "@/lib/format";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface ReportsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: ReportsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.reports.title} — ${admin.brand.panel}` };
}

const ranges = ["last30", "last90", "year", "all"] as const;
type Range = (typeof ranges)[number];

/** How many months of the series each range covers. */
const rangeMonths: Record<Range, number> = {
  last30: 1,
  last90: 3,
  year: 12,
  all: 12,
};

export default async function ReportsPage({ params, searchParams }: ReportsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const rawRange = readParam(await searchParams, "range");
  const range = (ranges.includes(rawRange as Range) ? rawRange : "year") as Range;

  const [admin, stats, series, shares, top] = await Promise.all([
    getAdminDictionary(locale),
    getAdminStats(),
    getSalesSeries(),
    getCategoryShares(),
    getTopBooks(),
  ]);

  const t = admin.reports;
  const base = `/${locale}/admin/reports`;
  const window = series.slice(-rangeMonths[range]);

  const revenue = window.reduce((total, point) => total + point.revenue, 0);
  const orders = window.reduce((total, point) => total + point.orders, 0);
  const averageOrder = orders ? Math.round(revenue / orders) : 0;

  const cards = [
    {
      icon: Coins,
      label: t.cards.revenue,
      value: formatCompactPrice(revenue, locale),
      change: stats.revenue.change,
    },
    {
      icon: Package,
      label: t.cards.orders,
      value: formatNumber(orders, locale),
      change: stats.orders.change,
    },
    {
      icon: Receipt,
      label: t.cards.avgOrder,
      value: formatPrice(averageOrder, locale),
      change: 2.4,
    },
    {
      icon: Repeat,
      label: t.cards.returning,
      value: "38%",
      change: 1.8,
    },
  ];

  return (
    <>
      <AdminPageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <a
            href={`/api/admin/reports/csv?locale=${locale}`}
            download
            className={buttonStyles({ variant: "secondary", size: "md" })}
          >
            <Download aria-hidden className="size-4" strokeWidth={2} />
            {t.exportCsv}
          </a>
        }
      />

      <nav className="flex flex-wrap gap-px">
        {ranges.map((entry) => (
          <Link
            key={entry}
            href={`${base}${entry === "year" ? "" : `?range=${entry}`}`}
            aria-current={range === entry ? "page" : undefined}
            className={cn(
              "border border-line px-3 py-2 text-label-md transition-colors",
              range === entry
                ? "bg-primary-container font-semibold text-on-primary-container"
                : "bg-card text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
            )}
          >
            {t.ranges[entry]}
          </Link>
        ))}
      </nav>

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

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t.salesByMonth.title} subtitle={t.salesByMonth.subtitle}>
          <BarChart
            data={series.map((point) => ({
              label: formatMonth(point.month, locale),
              value: point.revenue,
              display: formatPrice(point.revenue, locale),
            }))}
          />
        </Panel>

        <Panel title={t.ordersByMonth.title} subtitle={t.ordersByMonth.subtitle}>
          <BarChart
            data={series.map((point) => ({
              label: formatMonth(point.month, locale),
              value: point.orders,
              display: formatNumber(point.orders, locale),
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel
          title={t.topCategories.title}
          subtitle={t.topCategories.subtitle}
          className="min-w-0 lg:col-span-5"
        >
          <ShareBars
            data={shares.map((share) => ({
              label: share.category.name[locale],
              value: share.share,
            }))}
          />
        </Panel>

        <Panel
          title={t.topBooks.title}
          subtitle={t.topBooks.subtitle}
          flush
          className="min-w-0 lg:col-span-7"
        >
          <Table minWidth="30rem" className="border-0">
            <Thead>
              <Tr>
                <Th>{admin.books.table.book}</Th>
                <Th>{admin.dashboard.topBooks.sold}</Th>
                <Th>{admin.dashboard.topBooks.revenue}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {top.map((entry) => (
                <Tr key={entry.bookId}>
                  <Td>
                    <Link
                      href={`/${locale}/admin/books/${entry.bookId}`}
                      className="block max-w-56 truncate font-semibold underline-offset-4 hover:underline"
                    >
                      {entry.book.title[locale]}
                    </Link>
                    <span className="block text-label-sm text-muted">
                      {entry.book.category.name[locale]}
                    </span>
                  </Td>
                  <Td className="font-mono" data-numeric>
                    {formatNumber(entry.sold, locale)}
                  </Td>
                  <Td className="font-mono whitespace-nowrap font-semibold" data-numeric>
                    {formatPrice(entry.revenue, locale)}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Panel>
      </div>
    </>
  );
}
