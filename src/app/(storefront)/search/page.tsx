import { SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { HandoutShelf } from "@/components/handout/handout-shelf";
import { SearchBar } from "@/components/layout/search-bar";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/empty-state";
import { getHandoutCategoryTree, queryHandouts } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { parseBookQuery, toBookQuery } from "@/lib/book-query";
import { buildQueryString, readParam, type SearchParamsRecord } from "@/lib/search-params";

interface SearchPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  // A results page is a query, not a page: followed for the titles it
  // links to, never listed itself.
  return { title: dictionary.searchPage.title, robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const locale = defaultLocale;

  const raw = await searchParams;
  const term = readParam(raw, "q") ?? "";
  const parsed = parseBookQuery(raw);

  /*
   * The term and filters give a shelf of the first ten handouts and a link to
   * the listing, which takes the same query string and pages the rest.
   */
  const [dictionary, tree, handouts] = await Promise.all([
    getDictionary(locale),
    getHandoutCategoryTree(),
    term
      ? queryHandouts(toBookQuery(parsed, { page: 1, perPage: 10 }))
      : Promise.resolve(null),
  ]);

  const t = dictionary.searchPage;
  const branches = tree.slice(0, 5);
  const handoutsTotal = handouts?.total ?? 0;
  const handoutsHref = `/handouts${buildQueryString({ ...parsed.values, q: term })}`;

  return (
    <>
      <section className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-4 py-8 lg:py-10">
          <h1 className="text-headline-lg">{t.title}</h1>

          <SearchBar
            id="search-query"
            action={`/search`}
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
              {handouts ? (
                <>
                  {" — "}
                  <span data-numeric>{handoutsTotal}</span> {t.handoutsCount}
                </>
              ) : null}
            </p>
          ) : (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="label-mono text-muted">{t.suggestions}</span>
              {branches.map((category) => (
                <Link
                  key={category.id}
                  href={`/search?q=${encodeURIComponent(category.name[locale])}`}
                  className="rounded-xl border border-line bg-card px-3 py-1.5 text-label-md text-on-surface transition-colors hover:bg-state-hover"
                >
                  {category.name[locale]}
                </Link>
              ))}
            </div>
          )}
        </Container>
      </section>

      {handouts && handoutsTotal > 0 ? (
        <HandoutShelf
          title={t.handoutsTitle}
          subtitle={t.handoutsSubtitle}
          handouts={handouts.items}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={handoutsHref}
          priority
        />
      ) : null}

      {!handoutsTotal ? (
        <Container className="py-10 lg:py-16">
          <EmptyState
            icon={SearchX}
            title={t.empty.title}
            description={t.empty.description}
            actionLabel={t.empty.action}
            actionHref={`/handouts`}
          />
        </Container>
      ) : null}
    </>
  );
}
