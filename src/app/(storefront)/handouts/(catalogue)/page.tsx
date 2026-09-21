import type { Metadata } from "next";

import { HandoutCatalogue } from "@/components/handout/handout-catalogue";
import { PageHeader } from "@/components/ui/page-header";
import { getHandoutCategories, getHandoutPriceBounds, getPublishers, queryHandouts } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface HandoutsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.handouts.title };
}

export default async function HandoutsPage({ searchParams }: HandoutsPageProps) {
  const locale = defaultLocale;

  // The handouts listing takes the same query string as the books listing.
  const parsed = parseBookQuery(await searchParams);

  const [dictionary, categories, publishers, bounds, result] = await Promise.all([
    getDictionary(locale),
    getHandoutCategories(),
    getPublishers(),
    getHandoutPriceBounds(),
    queryHandouts(toBookQuery(parsed)),
  ]);

  return (
    <>
      <PageHeader
        title={dictionary.handouts.title}
        subtitle={dictionary.handouts.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: dictionary.handouts.title },
        ]}
      />

      <HandoutCatalogue
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        publishers={publishers}
        bounds={bounds}
        result={result}
        values={parsed.values}
        basePath={`/handouts`}
      />
    </>
  );
}
