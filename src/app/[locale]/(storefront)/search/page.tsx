import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCatalogue } from "@/components/book/book-catalogue";
import { SearchBar } from "@/components/layout/search-bar";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getCategories, getPriceBounds, getPublishers, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import { readParam, type SearchParamsRecord } from "@/lib/search-params";

interface SearchPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.searchPage.title };
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const raw = await searchParams;
  const term = readParam(raw, "q") ?? "";
  const parsed = parseBookQuery(raw);

  const [dictionary, categories, publishers, bounds, result] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    getPublishers(),
    getPriceBounds(),
    term ? queryBooks(toBookQuery(parsed)) : Promise.resolve(null),
  ]);

  const t = dictionary.searchPage;

  return (
    <>
      <section className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-4 py-8 lg:py-10">
          <h1 className="text-headline-lg">{t.title}</h1>

          <SearchBar
            action={`/${locale}/search`}
            label={dictionary.common.search}
            placeholder={t.placeholder}
            defaultValue={term}
            size="lg"
            className="max-w-2xl"
          />

          {term ? (
            <p className="text-body-md text-on-surface-variant">
              {t.resultsFor}{" "}
              <span className="font-semibold text-on-surface">“{term}”</span>
              {result ? (
                <>
                  {" — "}
                  <span data-numeric>{result.total}</span>{" "}
                  {dictionary.books.resultsLabel}
                </>
              ) : null}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="label-mono text-muted">{t.suggestions}</span>
              {categories.slice(0, 5).map((category) => (
                <Link
                  key={category.id}
                  href={`/${locale}/search?q=${encodeURIComponent(category.name[locale])}`}
                  className="rounded-xl border border-line bg-card px-3 py-1.5 text-label-md text-on-surface transition-colors hover:bg-state-hover"
                >
                  {category.name[locale]}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {result && result.total > 0 ? (
        <BookCatalogue
          locale={locale}
          dictionary={dictionary}
          categories={categories}
        publishers={publishers}
          bounds={bounds}
          result={result}
          values={{ ...parsed.values, q: term }}
          basePath={`/${locale}/search`}
        />
      ) : (
        <Container className="py-10 lg:py-16">
          <EmptyState
            icon={SearchX}
            title={t.empty.title}
            description={t.empty.description}
            actionLabel={t.empty.action}
            actionHref={`/${locale}/books`}
          />
        </Container>
      )}
    </>
  );
}
