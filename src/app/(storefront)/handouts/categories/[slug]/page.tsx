import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { HandoutBranchStrip } from "@/components/handout/handout-branch-strip";
import { HandoutCatalogue } from "@/components/handout/handout-catalogue";
import { CategoryIcon } from "@/components/ui/category-icon";
import { PageHeader } from "@/components/ui/page-header";
import {
  getHandoutCategories,
  getHandoutCategoryAncestors,
  getHandoutCategoryBySlug,
  getHandoutPriceBounds,
  getPublishers,
  queryHandouts,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";
import { readSlug } from "@/lib/slug";

interface HandoutCategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const categories = await getHandoutCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({
  params,
}: HandoutCategoryPageProps): Promise<Metadata> {
  const slug = readSlug((await params).slug);
  const category = await getHandoutCategoryBySlug(slug);
  if (!category) return {};

  const resolved = defaultLocale;
  return {
    title: category.name[resolved],
    description: category.description[resolved],
  };
}

/**
 * One branch of the handouts' tree at any depth — the books' branch page over
 * the other table: crumbs down from the top, the branches below as chips, and
 * a catalogue of everything filed here or anywhere under here.
 */
export default async function HandoutCategoryPage({
  params,
  searchParams,
}: HandoutCategoryPageProps) {
  const slug = readSlug((await params).slug);
  const locale = defaultLocale;

  const category = await getHandoutCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  const parsed = parseBookQuery(await searchParams);

  const [dictionary, trail, categories, publishers, bounds, result] = await Promise.all([
    getDictionary(locale),
    getHandoutCategoryAncestors(category),
    getHandoutCategories(),
    getPublishers(),
    getHandoutPriceBounds(),
    queryHandouts(toBookQuery(parsed, { category: slug })),
  ]);

  const t = dictionary.handoutCategoriesPage;

  return (
    <>
      <PageHeader
        title={category.name[locale]}
        subtitle={category.description[locale]}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: dictionary.handouts.title, href: "/handouts" },
          { label: t.title, href: `/handouts/categories` },
          ...trail.map((ancestor) => ({
            label: ancestor.name[locale],
            href: `/handouts/categories/${ancestor.slug}`,
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
        <HandoutBranchStrip
          branches={category.children}
          locale={locale}
          title={t.branches}
          subtitle={t.branchesSubtitle}
          countLabel={t.count}
        />
      ) : null}

      <HandoutCatalogue
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        publishers={publishers}
        bounds={bounds}
        result={result}
        values={{ ...parsed.values, category: slug }}
        basePath={`/handouts/categories/${slug}`}
        showCategory={false}
      />
    </>
  );
}
