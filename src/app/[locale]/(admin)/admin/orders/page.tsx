import { Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SortableTh, Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { RowActions } from "@/components/admin/row-actions";
import { TableToolbar, type ToolbarTab } from "@/components/admin/table-toolbar";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusBadge } from "@/components/ui/status-badge";
import { getAdminOrders, getOrderCounts } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  buildQueryString,
  readNumberParam,
  readParam,
  type SearchParamsRecord,
} from "@/lib/search-params";
import type { OrderStatus } from "@/types";

interface AdminOrdersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: AdminOrdersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.orders.title} — ${admin.brand.panel}` };
}

const statuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export default async function AdminOrdersPage({
  params,
  searchParams,
}: AdminOrdersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const term = readParam(raw, "q");
  const rawStatus = readParam(raw, "status");
  const sort = readParam(raw, "sort");
  const status = statuses.includes(rawStatus as OrderStatus) ? rawStatus! : "all";
  const page = readNumberParam(raw, "page") ?? 1;

  const [dictionary, admin, result, counts] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAdminOrders({ q: term, status, page, sort, perPage: 10 }),
    getOrderCounts(),
  ]);

  const t = admin.orders;
  const base = `/${locale}/admin/orders`;

  /* Sorting rides in the query string, so a sorted table is a shareable URL. */
  const sortHref = (next: string) =>
    `${base}${buildQueryString({ q: term, status, sort: next })}`;

  const tabs: ToolbarTab[] = [
    { value: "all", label: admin.common.all, count: counts.all },
    ...statuses.map((entry) => ({
      value: entry,
      label: dictionary.orderStatus[entry],
      count: counts[entry],
    })),
  ].map((tab) => ({
    ...tab,
    href: `${base}${buildQueryString({
      q: term,
      status: tab.value === "all" ? undefined : tab.value,
      sort,
    })}`,
    active: status === tab.value,
  }));

  return (
    <>
      <AdminPageHeader title={t.title} subtitle={t.subtitle} />

      <TableToolbar
        action={base}
        searchLabel={admin.common.search}
        searchPlaceholder={t.searchPlaceholder}
        defaultValue={term}
        hiddenFields={{ status: status === "all" ? undefined : status }}
        tabs={tabs}
      />

      {result.items.length ? (
        <>
          <Table minWidth="58rem">
            <Thead>
              <Tr>
                <Th>{t.table.reference}</Th>
                <Th>{t.table.customer}</Th>
                <SortableTh
                  column="created"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="desc"
                >
                  {t.table.date}
                </SortableTh>
                <Th>{t.table.items}</Th>
                <Th>{t.table.payment}</Th>
                <SortableTh
                  column="total"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="desc"
                >
                  {t.table.total}
                </SortableTh>
                <SortableTh
                  column="status"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="asc"
                >
                  {admin.common.status}
                </SortableTh>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {result.items.map((order) => {
                const itemsCount = order.items.reduce(
                  (total, item) => total + item.quantity,
                  0,
                );

                return (
                  <Tr key={order.id}>
                    <Td>
                      <Link
                        href={`${base}/${order.id}`}
                        className="font-semibold text-on-surface underline-offset-4 hover:underline"
                        data-numeric
                      >
                        {order.reference}
                      </Link>
                    </Td>
                    <Td>
                      <span className="block font-medium text-on-surface">
                        {order.customer?.name}
                      </span>
                      <span
                        className="block text-label-md text-muted"
                        dir="ltr"
                        data-numeric
                      >
                        {order.customer?.phone}
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                      {formatDate(order.createdAt, locale)}
                    </Td>
                    <Td data-numeric>
                      {formatNumber(itemsCount, locale)}
                    </Td>
                    <Td className="text-on-surface-variant">
                      {order.paymentMethod === "cod"
                        ? dictionary.checkout.paymentOptions.codTitle
                        : order.paymentMethod === "wallet"
                          ? dictionary.checkout.paymentOptions.walletTitle
                          : dictionary.checkout.paymentOptions.cardTitle}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold" data-numeric>
                      {formatPrice(order.total, locale)}
                    </Td>
                    <Td>
                      <StatusBadge
                        status={order.status}
                        label={dictionary.orderStatus[order.status]}
                      />
                    </Td>
                    <Td>
                      <RowActions
                        viewHref={`${base}/${order.id}`}
                        labels={{
                          view: admin.common.view,
                          edit: admin.common.edit,
                          delete: admin.common.delete,
                        }}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          <Pagination
            page={result.page}
            pageCount={result.pageCount}
            buildHref={(next) =>
              `${base}${buildQueryString({
                q: term,
                status: status === "all" ? undefined : status,
                page: next > 1 ? next : undefined,
                sort,
              })}`
            }
            labels={{
              previous: dictionary.common.previous,
              next: dictionary.common.next,
              page: dictionary.common.page,
            }}
          />
        </>
      ) : (
        <EmptyState
          icon={Package}
          title={t.empty.title}
          description={t.empty.description}
          actionLabel={admin.common.all}
          actionHref={base}
        />
      )}
    </>
  );
}
