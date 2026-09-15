import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { BranchStrip } from "@/components/category/branch-strip";
import { HandoutShelf } from "@/components/handout/handout-shelf";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PageHeader } from "@/components/ui/page-header";
import {
  getCategories,
  getCategoryAncestors,
  getCategoryBySlug,
  getHandoutCategoryBySlug,
  getPriceBounds,
  getPublishers,
  queryBooks,
  queryHandouts,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import { buildQueryString, type SearchParamsRecord } from "@/lib/search-params";
import { readSlug } from "@/lib/slug";

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
  const slug = readSlug((await params).slug);
  const category = await getCategoryBySlug(slug);
  if (!category) return {};

  const resolved = defaultLocale;
  return {
    title: category.name[resolved],
    description: category.description[resolved],
  };
}

/**
 * One branch of the tree at any depth. The crumbs walk down from the top;
 * the branches below, if any, sit as chips above the catalogue; and the
 * catalogue itself lists everything filed here or anywhere under here.
 */
export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const slug = readSlug((await params).slug);
  const locale = defaultLocale;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const parsed = parseBookQuery(await searchParams);

  /*
   * The handouts have a tree of their own, seeded alike: when a branch of it
   * answers to the same slug, its handouts get a shelf under the books, to
   * the same filters — the first ten, and a link to the handouts listing
   * scoped the same way for the rest.
   */
  const [dictionary, trail, categories, publishers, bounds, result, twin] = await Promise.all([
    getDictionary(locale),
    getCategoryAncestors(category),
    getCategories(),
    getPublishers(),
    getPriceBounds(),
    queryBooks(toBookQuery(parsed, { category: slug })),
    getHandoutCategoryBySlug(slug),
  ]);
  const handouts = twin
    ? await queryHandouts(toBookQuery(parsed, { category: slug, page: 1, perPage: 10 }))
    : null;

  const handoutsHref = `/handouts${buildQueryString({ ...parsed.values, category: slug })}`;
  const t = dictionary.categoriesPage;

  return (
    <>
      <PageHeader
        title={category.name[locale]}
        subtitle={category.description[locale]}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: t.title, href: `/categories` },
          ...trail.map((ancestor) => ({
            label: ancestor.name[locale],
            href: `/categories/${ancestor.slug}`,
          })),
          { label: category.name[locale] },
        ]}
        actions={
          <span className="flex size-14 items-center justify-center rounded-full bg-primary-fixed text-primary">
            <CategoryIcon name={category.icon} className="size-6" />
          </span>
        }
      />

      {category.children.length ? (
        <BranchStrip
          branches={category.children}
          locale={locale}
          title={t.branches}
          subtitle={t.branchesSubtitle}
          countLabel={dictionary.home.categories.count}
        />
      ) : null}

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

      {handouts && handouts.total > 0 ? (
        <HandoutShelf
          title={t.handoutsTitle}
          subtitle={t.handoutsSubtitle}
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
