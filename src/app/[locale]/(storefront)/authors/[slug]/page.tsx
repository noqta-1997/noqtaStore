import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { authorTone, getAuthorInitials } from "@/components/author/author-card";
import { BookGrid } from "@/components/book/book-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import { getAuthorBySlug, getAuthors, queryBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { buildQueryString, readNumberParam, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface AuthorPageProps {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const authors = await getAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  const resolved = isLocale(locale) ? locale : "ar";
  return { title: author.name[resolved], description: author.bio[resolved] };
}

export default async function AuthorPage({ params, searchParams }: AuthorPageProps) {
  const { locale, slug } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const author = await getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const page = readNumberParam(await searchParams, "page") ?? 1;

  const [dictionary, result] = await Promise.all([
    getDictionary(locale),
    queryBooks({ author: slug, sort: "popular", page, perPage: 10 }),
  ]);

  const t = dictionary.authorsPage;

  const facts = [
    { label: t.country, value: author.country[locale] },
    {
      label: t.booksCount,
      value: formatNumber(author.booksCount, locale),
      numeric: true,
    },
  ];

  return (
    <>
      <section className="border-b-2 border-line bg-surface-low">
        <Container className="space-y-6 py-8 lg:py-10">
          <Breadcrumb
            label={dictionary.common.menu}
            items={[
              { label: dictionary.common.home, href: `/${locale}` },
              { label: t.title, href: `/${locale}/authors` },
              { label: author.name[locale] },
            ]}
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              aria-hidden
              className={cn(
                "flex size-20 shrink-0 items-center justify-center border border-line font-display text-2xl font-extrabold shadow-hard",
                authorTone(author.slug),
              )}
            >
              {getAuthorInitials(author.name[locale])}
            </span>

            <div className="space-y-3">
              <h1 className="text-headline-lg sm:text-[2.5rem] sm:leading-tight">
                {author.name[locale]}
              </h1>
              <p className="max-w-2xl text-body-lg text-on-surface-variant">
                {author.bio[locale]}
              </p>
              <dl className="flex flex-wrap gap-x-8 gap-y-2 pt-1">
                {facts.map((fact) => (
                  <div key={fact.label} className="flex items-baseline gap-2">
                    <dt className="label-mono text-muted">{fact.label}</dt>
                    <dd
                      className="text-body-md font-semibold text-on-surface"
                      {...(fact.numeric ? { "data-numeric": true } : {})}
                    >
                      {fact.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </Container>
      </section>

      <Container className="space-y-6 py-8 lg:py-12">
        <div className="flex items-end justify-between gap-4 border-b-2 border-line pb-4">
          <h2 className="text-headline-md">{t.booksBy}</h2>
          <p className="text-label-md text-muted">
            <span className="font-semibold text-on-surface" data-numeric>
              {formatNumber(result.total, locale)}
            </span>{" "}
            {dictionary.books.resultsLabel}
          </p>
        </div>

        <BookGrid
          books={result.items}
          locale={locale}
          dictionary={dictionary.common}
          priority
        />

        <Pagination
          page={result.page}
          pageCount={result.pageCount}
          buildHref={(next) =>
            `/${locale}/authors/${slug}${buildQueryString({
              page: next > 1 ? next : undefined,
            })}`
          }
          labels={{
            previous: dictionary.common.previous,
            next: dictionary.common.next,
            page: dictionary.common.page,
          }}
          className="pt-2"
        />
      </Container>
    </>
  );
}
