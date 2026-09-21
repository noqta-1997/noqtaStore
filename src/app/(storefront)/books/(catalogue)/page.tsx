import type { Metadata } from "next";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { PageHeader } from "@/components/ui/page-header";
import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import type { SearchParamsRecord } from "@/lib/search-params";

interface BooksPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.books.title };
}

export default async function BooksPage({ searchParams }: BooksPageProps) {
  const locale = defaultLocale;

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
          { label: dictionary.common.home, href: "/" },
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
        basePath={`/books`}
      />
    </>
  );
}
