import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface BooksPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: BooksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.books.title };
}

export default async function BooksPage({ params, searchParams }: BooksPageProps) {
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
    queryBooks(toBookQuery(parsed)),
  ]);

  return (
    <>
      <PageHeader
        title={dictionary.books.title}
        subtitle={dictionary.books.subtitle}
        crumbsLabel={dictionary.common.menu}
        crumbs={[
          { label: dictionary.common.home, href: `/${locale}` },
          { label: dictionary.books.title },
        ]}
      />

      <BookCatalogue
        locale={locale}
        dictionary={dictionary}
        categories={categories}
        publishers={publishers}
        bounds={bounds}
        result={result}
        values={parsed.values}
        basePath={`/${locale}/books`}
      />
    </>
  );
}
