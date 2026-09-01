import type { BookFilterValues } from "@/components/book/book-filters";
import type { BookQuery, SortKey } from "@/data";
import {
  readBooleanParam,
  readNumberParam,
  readParam,
  type SearchParamsRecord,
} from "@/lib/search-params";
import type { CoverType } from "@/types";

const sortKeys: SortKey[] = [
  "relevance",
  "newest",
  "popular",
  "priceAsc",
  "priceDesc",
  "rating",
];

export interface ParsedBookQuery {
  values: BookFilterValues;
  page: number;
}

/** Turns raw URL params into typed filter values plus the page number. */
export function parseBookQuery(params: SearchParamsRecord): ParsedBookQuery {
  const sort = readParam(params, "sort");
  const cover = readParam(params, "cover");

  return {
    page: readNumberParam(params, "page") ?? 1,
    values: {
      q: readParam(params, "q"),
      category: readParam(params, "category"),
      publisher: readParam(params, "publisher"),
      minPrice: readNumberParam(params, "minPrice"),
      maxPrice: readNumberParam(params, "maxPrice"),
      rating: readNumberParam(params, "rating"),
      cover:
        cover === "hardcover" || cover === "paperback"
          ? (cover as CoverType)
          : undefined,
      inStock: readBooleanParam(params, "inStock"),
      onSale: readBooleanParam(params, "onSale"),
      sort: sortKeys.includes(sort as SortKey) ? sort : undefined,
    },
  };
}

/** Maps parsed filters onto the data-layer query shape. */
export function toBookQuery(
  { values, page }: ParsedBookQuery,
  overrides: Partial<BookQuery> = {},
): BookQuery {
  return {
    q: values.q,
    category: values.category,
    publisher: values.publisher,
    minPrice: values.minPrice,
    maxPrice: values.maxPrice,
    rating: values.rating,
    cover: values.cover,
    inStock: values.inStock,
    onSale: values.onSale,
    sort: values.sort as SortKey | undefined,
    page,
    ...overrides,
  };
}
