import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { HandoutShelf } from "@/components/handout/handout-shelf";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PageHeader } from "@/components/ui/page-header";
import {
  getCategories,
  getCategoryBySlug,
  getPriceBounds,
  getPublishers,
  queryBooks,
  queryHandouts,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import { buildQueryString, type SearchParamsRecord } from "@/lib/search-params";

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const resolved = defaultLocale;
  return {
    title: category.name[resolved],
    description: category.description[resolved],
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const locale = defaultLocale;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const parsed = parseBookQuery(await searchParams);

  /*
   * The handouts of the category answer to the same filters as its books, on
   * a shelf under the catalogue: the first ten, and a link to the handouts
   * listing scoped the same way for the rest.
   */
  const [dictionary, categories, publishers, bounds, result, handouts] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    getPublishers(),
    getPriceBounds(),
    queryBooks(toBookQuery(parsed, { category: slug })),
    queryHandouts(toBookQuery(parsed, { category: slug, page: 1, perPage: 10 })),
  ]);

  const handoutsHref = `/handouts${buildQueryString({ ...parsed.values, category: slug })}`;

  return (
    <>
      <PageHeader
        title={category.name[locale]}
        subtitle={category.description[locale]}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: dictionary.categoriesPage.title, href: `/categories` },
          { label: category.name[locale] },
        ]}
        actions={
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <CategoryIcon name={category.icon} className="size-6" />
          </span>
        }
      />

      <BookCatalogue
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        publishers={publishers}
        bounds={bounds}
        result={result}
        values={{ ...parsed.values, category: slug }}
        basePath={`/categories/${slug}`}
        showCategory={false}
      />

      {handouts.total > 0 ? (
        <HandoutShelf
          title={dictionary.categoriesPage.handoutsTitle}
          subtitle={dictionary.categoriesPage.handoutsSubtitle}
          handouts={handouts.items}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={handoutsHref}
          band
          className="border-t border-line-divider"
        />
      ) : null}
    </>
  );
}
