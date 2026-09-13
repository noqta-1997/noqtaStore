import { NotebookText, Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { SortableTh, Table, Tbody, Td, Th, Thead, Tr } from "@/components/admin/data-table";
import { RowActions } from "@/components/admin/row-actions";
import { deleteHandout } from "@/app/actions/admin";
import { TableToolbar, type ToolbarTab } from "@/components/admin/table-toolbar";
import { BookCover } from "@/components/book/book-cover";
import { buttonStyles } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { Rating } from "@/components/ui/rating";
import {
  getAdminHandouts,
  getHandoutStockCounts,
  LOW_STOCK_THRESHOLD,
  type StockFilter,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatNumber, formatPrice } from "@/lib/format";
import { buildQueryString, readNumberParam, readParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface AdminHandoutsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const admin = await getAdminDictionary(defaultLocale);

  return { title: `${admin.handouts.title} — ${admin.brand.panel}` };
}

const stockFilters: StockFilter[] = ["all", "inStock", "low", "out"];

export default async function AdminHandoutsPage({
  searchParams,
}: AdminHandoutsPageProps) {
  const locale = defaultLocale;

  const raw = await searchParams;
  const term = readParam(raw, "q");
  const rawStock = readParam(raw, "stock");
  const stock = (stockFilters.includes(rawStock as StockFilter)
    ? rawStock
    : "all") as StockFilter;
  const page = readNumberParam(raw, "page") ?? 1;
  const sort = readParam(raw, "sort");

  const [dictionary, admin, result, counts] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAdminHandouts({ q: term, stock, page, sort, perPage: 10 }),
    getHandoutStockCounts(),
  ]);

  const t = admin.handouts;
  const base = `/admin/handouts`;

  /* Sorting is a query param, so a sorted table stays a shareable URL.
     Changing the column drops the page back to the first. */
  const sortHref = (next: string) =>
    `${base}${buildQueryString({
      q: term,
      stock: stock === "all" ? undefined : stock,
      sort: next,
    })}`;

  const tabs: ToolbarTab[] = [
    { value: "all", label: admin.common.all, count: counts.all },
    { value: "inStock", label: t.stockStatus.inStock, count: counts.inStock },
    { value: "low", label: t.stockStatus.low, count: counts.low },
    { value: "out", label: t.stockStatus.out, count: counts.out },
  ].map((tab) => ({
    ...tab,
    href: `${base}${buildQueryString({
      q: term,
      stock: tab.value === "all" ? undefined : tab.value,
      sort,
    })}`,
    active: stock === tab.value,
  }));

  return (
    <>
      <AdminPageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <Link href={`${base}/new`} className={buttonStyles({ size: "md" })}>
            <Plus aria-hidden className="size-4" strokeWidth={1.75} />
            {t.add}
          </Link>
        }
      />

      <TableToolbar
        action={base}
        searchLabel={admin.common.search}
        searchPlaceholder={t.searchPlaceholder}
        defaultValue={term}
        hiddenFields={{ stock: stock === "all" ? undefined : stock }}
        tabs={tabs}
      />

      {result.items.length ? (
        <>
          <Table minWidth="60rem">
            <Thead>
              <Tr>
                <SortableTh column="title" current={sort} buildHref={sortHref}>
                  {t.table.handout}
                </SortableTh>
                <Th>{t.table.author}</Th>
                <Th>{t.table.category}</Th>
                <SortableTh column="price" current={sort} buildHref={sortHref}>
                  {t.table.price}
                </SortableTh>
                <SortableTh column="stock" current={sort} buildHref={sortHref}>
                  {t.table.stock}
                </SortableTh>
                <SortableTh
                  column="rating"
                  current={sort}
                  buildHref={sortHref}
                  defaultDirection="desc"
                >
                  {t.table.rating}
                </SortableTh>
                <Th className="text-end">{admin.common.actions}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {result.items.map((handout) => {
                const out = handout.stock === 0;
                const low = !out && handout.stock <= LOW_STOCK_THRESHOLD;

                return (
                  <Tr key={handout.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <span className="w-9 shrink-0">
                          <BookCover
                            title={handout.title[locale]}
                            author={handout.author.name[locale]}
                            seed={handout.slug}
                            src={handout.coverUrl}
                            sizes="2.25rem"
                            className="rounded-md elevation-sm"
                            compact
                          />
                        </span>
                        <span className="min-w-0">
                          <Link
                            href={`${base}/${handout.id}`}
                            className="block max-w-64 truncate font-semibold text-on-surface underline-offset-4 hover:underline"
                          >
                            {handout.title[locale]}
                          </Link>
                        </span>
                      </div>
                    </Td>
                    <Td className="text-on-surface-variant">{handout.author.name[locale]}</Td>
                    <Td className="text-on-surface-variant">{handout.category.name[locale]}</Td>
                    <Td className="whitespace-nowrap" data-numeric>
                      {formatPrice(handout.price, locale)}
                    </Td>
                    <Td>
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-label-md font-semibold",
                          out && "border-line bg-error-container text-on-error-container",
                          low && "border-line bg-primary-fixed text-on-primary-fixed",
                          !out && !low && "border-outline bg-surface-low text-on-surface",
                        )}
                        data-numeric
                      >
                        {formatNumber(handout.stock, locale)}
                      </span>
                    </Td>
                    <Td>
                      <Rating value={handout.rating} locale={locale} />
                    </Td>
                    <Td>
                      <RowActions
                        viewHref={`${base}/${handout.id}`}
                        editHref={`${base}/${handout.id}/edit`}
                        itemName={handout.title[locale]}
                        labels={{
                          view: admin.common.view,
                          edit: admin.common.edit,
                          delete: admin.common.delete,
                        }}
                        fallbackError={dictionary.common.toast.actionFailed}
                        errorMessages={{
                          inUse: dictionary.common.actionErrors.inUse,
                          forbidden: dictionary.common.actionErrors.forbidden,
                        }}
                        deleteAction={deleteHandout.bind(null, handout.id)}
                        confirm={{
                          title: dictionary.common.confirm.deleteTitle,
                          description: dictionary.common.confirm.deleteDescription,
                          confirm: dictionary.common.confirm.confirm,
                          cancel: dictionary.common.confirm.cancel,
                          done: dictionary.common.toast.deleted,
                          trigger: admin.common.delete,
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
                stock: stock === "all" ? undefined : stock,
                sort,
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
          icon={NotebookText}
          title={t.empty.title}
          description={t.empty.description}
          actionLabel={admin.common.all}
          actionHref={base}
        />
      )}
    </>
  );
}
