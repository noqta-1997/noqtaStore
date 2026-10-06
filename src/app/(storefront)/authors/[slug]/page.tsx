import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { authorTone, getAuthorInitials } from "@/components/author/author-card";
import { HandoutGrid } from "@/components/handout/handout-grid";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { getAuthorBySlug, getAuthors, getHandoutsByAuthor } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { readSlug } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { pageMetadata } from "@/lib/seo";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
}

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export async function generateStaticParams() {
  const authors = await getAuthors();
  return authors.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
  const slug = readSlug((await params).slug);
  const author = await getAuthorBySlug(slug);
  if (!author) return {};

  const locale = defaultLocale;
  const dictionary = await getDictionary(locale);

  return pageMetadata({
    title: author.name[locale],
    description: author.bio[locale] || `${dictionary.authorsPage.handoutsBy}: ${author.name[locale]}.`,
    path: `/authors/${author.slug}`,
    image: author.avatarUrl,
  });
}

export default async function AuthorPage({ params }: AuthorPageProps) {
  const slug = readSlug((await params).slug);
  const locale = defaultLocale;

  const author = await getAuthorBySlug(slug);

  if (!author) {
    notFound();
  }

  const [dictionary, handouts] = await Promise.all([
    getDictionary(locale),
    getHandoutsByAuthor(slug),
  ]);

  const t = dictionary.authorsPage;

  const facts = [
    {
      label: t.handoutsCount,
      value: formatNumber(author.handoutsCount, locale),
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
              { label: t.title, href: `/authors` },
              { label: author.name[locale] },
            ]}
          />

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
            <span
              aria-hidden
              className={cn(
                "flex size-20 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold elevation-md",
                authorTone(author.slug),
              )}
            >
              {getAuthorInitials(author.name[locale])}
            </span>

            <div className="space-y-3">
              <h1 className="text-headline-lg sm:text-headline-xl">
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
          priority
        />
      </Container>
    </>
  );
}
