import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, getCategoryBySlug, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface CategoryPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const resolved = isLocale(locale) ? locale : "ar";
  return {
    title: category.name[resolved],
    description: category.description[resolved],
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const parsed = parseBookQuery(await searchParams);

  const [dictionary, categories, publishers, bounds, result] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    getPublishers(),
    getPriceBounds(),
    queryBooks(toBookQuery(parsed, { category: slug })),
  ]);

  return (
    <>
      <PageHeader
        title={category.name[locale]}
        subtitle={category.description[locale]}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: dictionary.categoriesPage.title, href: `/${locale}/categories` },
          { label: category.name[locale] },
        ]}
        actions={
          <span className="flex size-14 items-center justify-center border border-line bg-card text-primary">
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
        basePath={`/${locale}/categories/${slug}`}
        showCategory={false}
      />
    </>
  );
}
