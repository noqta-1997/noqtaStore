import type { Metadata } from "next";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface OffersPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.offersPage.title };
}

export default async function OffersPage({ searchParams }: OffersPageProps) {
  const locale = defaultLocale;

  const parsed = parseBookQuery(await searchParams);

  const [dictionary, categories, publishers, bounds, result] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    getPublishers(),
    getPriceBounds(),
    queryBooks(toBookQuery(parsed, { onSale: true })),
  ]);

  return (
    <>
      <PageHeader
        title={dictionary.offersPage.title}
        subtitle={dictionary.offersPage.subtitle}
        eyebrow={dictionary.home.promo.eyebrow}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: "/" },
          { label: dictionary.offersPage.title },
        ]}
        actions={<Badge tone="primary">−25%</Badge>}
      />

      <BookCatalogue
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        publishers={publishers}
        bounds={bounds}
        result={result}
        values={{ ...parsed.values, onSale: true }}
        basePath={`/offers`}
      />
    </>
  );
}
