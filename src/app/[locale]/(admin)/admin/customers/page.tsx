import { Eye, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { TableToolbar, type ToolbarTab } from "@/components/admin/table-toolbar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { BlockCustomerButton } from "@/components/admin/block-customer-button";
import { Pagination } from "@/components/ui/pagination";
import { getCustomerCounts, getCustomers } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber, formatPrice } from "@/lib/format";
import {
  buildQueryString,
  readNumberParam,
  readParam,
  type SearchParamsRecord,
} from "@/lib/search-params";

interface AdminCustomersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: AdminCustomersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const admin = await getAdminDictionary(isLocale(locale) ? locale : "ar");

  return { title: `${admin.customers.title} — ${admin.brand.panel}` };
}

export default async function AdminCustomersPage({
  params,
  searchParams,
}: AdminCustomersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const term = readParam(raw, "q");
  const rawStatus = readParam(raw, "status");
  const status =
    rawStatus === "active" || rawStatus === "blocked" ? rawStatus : "all";
  const page = readNumberParam(raw, "page") ?? 1;

  const [dictionary, admin, result, counts] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getCustomers({ q: term, status, page, perPage: 10 }),
    getCustomerCounts(),
  ]);

  const t = admin.customers;
  const base = `/${locale}/admin/customers`;

  const tabs: ToolbarTab[] = [
    { value: "all", label: admin.common.all, count: counts.all },
    { value: "active", label: t.statuses.active, count: counts.active },
    { value: "blocked", label: t.statuses.blocked, count: counts.blocked },
  ].map((tab) => ({
    ...tab,
    href: `${base}${buildQueryString({
      q: term,
      status: tab.value === "all" ? undefined : tab.value,
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
                <Th>{t.table.customer}</Th>
                <Th>{t.table.contact}</Th>
                <Th>{t.table.city}</Th>
                <Th>{t.table.orders}</Th>
                <Th>{t.table.spent}</Th>
                <Th>{t.table.joined}</Th>
                <Th>{admin.common.status}</Th>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {result.items.map((customer) => (
                <Tr key={customer.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <span
                        aria-hidden
                        className="flex size-9 shrink-0 items-center justify-center border border-line bg-surface-high font-display text-sm font-bold"
                      >
                        {customer.name.slice(0, 1)}
                      </span>
                      <Link
                        href={`${base}/${customer.id}`}
                        className="font-semibold text-on-surface underline-offset-4 hover:underline"
                      >
                        {customer.name}
                      </Link>
                    </div>
                  </Td>
                  <Td>
                    <span
                      className="block max-w-48 truncate font-mono text-label-md text-on-surface-variant"
                      dir="ltr"
                    >
                      {customer.email}
                    </span>
                    <span
                      className="block font-mono text-label-sm text-muted"
                      dir="ltr"
                      data-numeric
                    >
                      {customer.phone}
                    </span>
                  </Td>
                  <Td className="text-on-surface-variant">{customer.city[locale]}</Td>
                  <Td className="font-mono" data-numeric>
                    {formatNumber(customer.ordersCount, locale)}
                  </Td>
                  <Td className="font-mono whitespace-nowrap font-semibold" data-numeric>
                    {formatPrice(customer.totalSpent, locale)}
                  </Td>
                  <Td className="whitespace-nowrap text-on-surface-variant" data-numeric>
                    {formatDate(customer.joinedAt, locale)}
                  </Td>
                  <Td>
                    <Badge tone={customer.status === "active" ? "outline" : "muted"}>
                      {customer.status === "active"
                        ? t.statuses.active
                        : t.statuses.blocked}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`${base}/${customer.id}`}
                        aria-label={admin.common.view}
                        title={admin.common.view}
                        className="inline-flex size-9 items-center justify-center border border-transparent text-on-surface transition-colors hover:border-line hover:bg-surface-high"
                      >
                        <Eye aria-hidden className="size-4" strokeWidth={2} />
                      </Link>
                      <BlockCustomerButton
                        customerId={customer.id}
                        blocked={customer.status === "blocked"}
                        label={customer.status === "active" ? t.block : t.unblock}
                        successTitle={dictionary.common.toast.saved}
                        selfBlockMessage={dictionary.common.actionErrors.selfBlock}
                        failureMessage={dictionary.common.toast.actionFailed}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
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
          icon={Users}
          title={t.empty.title}
          description={t.empty.description}
          actionLabel={admin.common.all}
          actionHref={base}
        />
      )}
    </>
  );
}
