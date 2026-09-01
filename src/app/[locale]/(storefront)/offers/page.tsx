import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface OffersPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: OffersPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.offersPage.title };
}

export default async function OffersPage({ params, searchParams }: OffersPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

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
          { label: dictionary.common.home, href: `/${locale}` },
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
        basePath={`/${locale}/offers`}
      />
    </>
  );
}
