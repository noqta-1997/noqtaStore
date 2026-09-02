import { SearchX } from "lucide-react";

import { BookFilters, type BookFilterValues } from "@/components/book/book-filters";
import { BookGrid } from "@/components/book/book-grid";
import { FilterSheet } from "@/components/book/filter-sheet";
import { SortSelect } from "@/components/book/sort-select";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import type { BookQueryResult, SortKey } from "@/data";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { buildQueryString } from "@/lib/search-params";
import type { Category, Publisher } from "@/types";

interface BookCatalogueProps {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  publishers: Publisher[];
  bounds: { min: number; max: number };
  result: BookQueryResult;
  values: BookFilterValues;
  /** Path the filter form posts to, e.g. `/ar/books`. */
  basePath: string;
  showCategory?: boolean;
}

/**
 * Filters + toolbar + grid + pagination.
 * Shared by the listing, category, author, search and offers pages.
 */
export function BookCatalogue({
  locale,
  dictionary,
  categories,
  publishers,
  bounds,
  result,
  values,
  basePath,
  showCategory = true,
}: BookCatalogueProps) {
  const t = dictionary.books;
  const sort = (values.sort ?? "relevance") as SortKey;

  const sortOptions = [
    { value: "relevance", label: t.sortOptions.relevance },
    { value: "newest", label: t.sortOptions.newest },
    { value: "popular", label: t.sortOptions.popular },
    { value: "priceAsc", label: t.sortOptions.priceAsc },
    { value: "priceDesc", label: t.sortOptions.priceDesc },
    { value: "rating", label: t.sortOptions.rating },
  ];

  const buildHref = (page: number) =>
    `${basePath}${buildQueryString({
      q: values.q,
      category: showCategory ? values.category : undefined,
      publisher: values.publisher,
      minPrice: values.minPrice,
      maxPrice: values.maxPrice,
      rating: values.rating,
      cover: values.cover,
      inStock: values.inStock,
      onSale: values.onSale,
      sort: values.sort,
      page: page > 1 ? page : undefined,
    })}`;

  const filters = (
    <BookFilters
      action={basePath}
      resetHref={basePath}
      locale={locale}
      dictionary={dictionary}
      categories={categories}
      publishers={publishers}
      values={values}
      bounds={bounds}
      showCategory={showCategory}
    />
  );

  return (
    <Container className="grid gap-6 py-8 lg:grid-cols-12 lg:gap-8 lg:py-12">
      <aside className="hidden lg:col-span-3 lg:block">
        <div className="sticky top-44">{filters}</div>
      </aside>

      <div className="space-y-6 lg:col-span-9">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-line bg-card px-4 py-3">
          <p className="text-label-md text-muted">
            <span className="font-semibold text-on-surface" data-numeric>
              {formatNumber(result.total, locale)}
            </span>{" "}
            {t.resultsLabel}
          </p>
          <SortSelect
            value={sort}
            label={dictionary.common.sort}
            options={sortOptions}
          />
        </div>

        <FilterSheet
          labels={{
            open: t.openFilters,
            title: t.filtersTitle,
            close: dictionary.common.close,
          }}
        >
          {filters}
        </FilterSheet>

        {result.items.length ? (
          <>
            <BookGrid
              books={result.items}
              locale={locale}
              dictionary={dictionary.common}
              columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
              priority
            />
            <Pagination
              page={result.page}
              pageCount={result.pageCount}
              buildHref={buildHref}
              labels={{
                previous: dictionary.common.previous,
                next: dictionary.common.next,
                page: dictionary.common.page,
              }}
              className="pt-2"
            />
          </>
        ) : (
          <EmptyState
            icon={SearchX}
            title={t.empty.title}
            description={t.empty.description}
            actionLabel={t.empty.action}
            actionHref={basePath}
          />
        )}
      </div>
    </Container>
  );
}
