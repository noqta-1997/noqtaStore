import { Building2 } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookGrid } from "@/components/book/book-grid";
import { HandoutGrid } from "@/components/handout/handout-grid";
import { publisherTone } from "@/components/publisher/publisher-card";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Pagination } from "@/components/ui/pagination";
import {
  getHandoutsByPublisher,
  getPublisherBySlug,
  getPublishers,
  queryBooks,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber, formatYear } from "@/lib/format";
import {
  buildQueryString,
  readNumberParam,
  type SearchParamsRecord,
} from "@/lib/search-params";
import { cn } from "@/lib/utils";

interface PublisherPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const publishers = await getPublishers();
  return publishers.map((publisher) => ({ slug: publisher.slug }));
}

export async function generateMetadata({ params }: PublisherPageProps): Promise<Metadata> {
  const { slug } = await params;
  const publisher = await getPublisherBySlug(slug);
  if (!publisher) return {};

  const resolved = defaultLocale;
  return {
    title: publisher.name[resolved],
    description: publisher.description[resolved] || undefined,
  };
}

export default async function PublisherPage({
  params,
  searchParams,
}: PublisherPageProps) {
  const { slug } = await params;
  const locale = defaultLocale;

  const publisher = await getPublisherBySlug(slug);

  if (!publisher) {
    notFound();
  }

  const page = readNumberParam(await searchParams, "page") ?? 1;

  const [dictionary, result, handouts] = await Promise.all([
    getDictionary(locale),
    queryBooks({ publisher: slug, sort: "newest", page, perPage: 10 }),
    getHandoutsByPublisher(slug),
  ]);

  const t = dictionary.publishersPage;

  const facts = [
    ...(publisher.country[locale]
      ? [{ label: t.country, value: publisher.country[locale] }]
      : []),
    ...(publisher.foundedYear
      ? [
          {
            label: t.founded,
            value: formatYear(publisher.foundedYear, locale),
            numeric: true,
          },
        ]
      : []),
    {
      label: t.booksCount,
      value: formatNumber(publisher.booksCount, locale),
      numeric: true,
    },
  ];

  return (
    <>
      <section className="border-b border-line-divider bg-surface-low">
        <Container className="space-y-6 py-8 lg:py-10">
          <Breadcrumb
            label={dictionary.common.menu}
            items={[
              { label: dictionary.common.home, href: "/" },
              { label: t.title, href: `/publishers` },
              { label: publisher.name[locale] },
            ]}
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              aria-hidden
              className={cn(
                "flex size-20 shrink-0 items-center justify-center rounded-full elevation-md",
                publisherTone(publisher.slug),
              )}
            >
              <Building2 className="size-9" strokeWidth={1.75} />
            </span>

            <div className="space-y-3">
              <h1 className="text-headline-lg sm:text-headline-xl">
                {publisher.name[locale]}
              </h1>

              {publisher.description[locale] ? (
                <p className="max-w-2xl text-body-lg text-on-surface-variant">
                  {publisher.description[locale]}
                </p>
              ) : null}

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
        <div className="flex items-end justify-between gap-4 border-b border-line-divider pb-4">
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
            `/publishers/${slug}${buildQueryString({
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

      {handouts.length ? (
        <div className="border-t border-line-divider bg-surface-low">
          <Container className="space-y-6 py-8 lg:py-12">
            <div className="flex items-end justify-between gap-4 border-b border-line-divider pb-4">
              <h2 className="text-headline-md">{t.handoutsBy}</h2>
              <p className="text-label-md text-muted">
                <span className="font-semibold text-on-surface" data-numeric>
                  {formatNumber(handouts.length, locale)}
                </span>{" "}
                {dictionary.handouts.resultsLabel}
              </p>
            </div>

            <HandoutGrid
              handouts={handouts}
              locale={locale}
              dictionary={dictionary.common}
            />
          </Container>
        </div>
      ) : null}
    </>
  );
}
