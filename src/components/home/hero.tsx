import { ArrowRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Rating } from "@/components/ui/rating";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookWithRelations } from "@/types";

interface HeroProps {
  locale: Locale;
  dictionary: Dictionary;
  featuredBook: BookWithRelations;
  /**
   * Jackets shown fanned out behind the featured one. Optional, because the
   * hero has always needed exactly one book to render and still does — these
   * are decoration drawn from real rows, never a second data requirement.
   */
  companions?: BookWithRelations[];
  stats: {
    booksCount: number;
    authorsCount: number;
    publishersCount: number;
  };
}

/**
 * The reference's opening: a serif headline holding the left half, and on the
 * right three jackets on tinted plates with the middle one raised.
 *
 * The featured book keeps everything it carried before — its category, title,
 * author, rating, price and the link through to its page — but that detail
 * now sits under the fan as a caption instead of inside a bordered card, so
 * the jackets are what the eye lands on.
 */
export function Hero({
  locale,
  dictionary,
  featuredBook,
  companions = [],
  stats,
}: HeroProps) {
  const { hero } = dictionary.home;

  const figures = [
    { value: stats.booksCount, label: hero.stats.books },
    { value: stats.authorsCount, label: hero.stats.authors },
    { value: stats.publishersCount, label: hero.stats.publishers },
  ];

  /* Two side jackets at most; fewer if the catalogue has fewer to give. */
  const [beforeBook, afterBook] = companions.slice(0, 2);

  return (
    <section className="bg-surface">
      <Container className="grid items-center gap-12 py-14 lg:grid-cols-12 lg:gap-10 lg:py-24">
        <div className="space-y-6 lg:col-span-6">
          <Badge tone="gold">{hero.eyebrow}</Badge>

          <h1 className="text-display-lg">
            {hero.title}{" "}
            <span className="text-primary">{hero.titleHighlight}</span>
          </h1>

          <p className="max-w-xl text-body-lg leading-relaxed text-on-surface-variant">
            {hero.subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/${locale}/books`}
              className={buttonStyles({
                size: "lg",
                className: "h-12 rounded-full max-sm:w-full",
              })}
            >
              {hero.primaryCta}
              <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
            <Link
              href={`/${locale}/categories`}
              className={buttonStyles({
                variant: "secondary",
                size: "lg",
                className: "h-12 rounded-full max-sm:w-full",
              })}
            >
              <LayoutGrid aria-hidden className="size-4" strokeWidth={1.75} />
              {hero.secondaryCta}
            </Link>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-line-divider pt-6">
            {figures.map((figure) => (
              <div key={figure.label}>
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span
                    className="block font-display text-2xl font-bold text-on-surface sm:text-3xl"
                    data-numeric
                  >
                    {formatNumber(figure.value, locale)}+
                  </span>
                  <span className="mt-1 block text-label-md text-muted">
                    {figure.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-6">
          <div className="mx-auto max-w-lg lg:max-w-none">
            {/*
              The featured jacket comes first in the source and is placed in
              the middle with `order`. Reading order has to match what is
              actually on screen: the two side jackets are hidden below `sm`,
              so with them first in the source the page's first book link was
              an invisible one on a phone.
            */}
            <div className="flex items-end justify-center gap-3 sm:gap-5">
              <div className="order-2 w-40 shrink-0 rounded-2xl bg-primary-fixed p-4 elevation-lg sm:w-52 sm:p-5">
                <Link
                  href={`/${locale}/books/${featuredBook.slug}`}
                  aria-label={featuredBook.title[locale]}
                  className="block"
                >
                  <BookCover
                    title={featuredBook.title[locale]}
                    author={featuredBook.author.name[locale]}
                    seed={featuredBook.slug}
                    src={featuredBook.coverUrl}
                    priority
                    sizes="(min-width: 640px) 13rem, 10rem"
                    className="rounded-lg elevation-md"
                  />
                </Link>
              </div>

              {beforeBook ? (
                <FannedJacket book={beforeBook} locale={locale} className="order-1" />
              ) : null}

              {afterBook ? (
                <FannedJacket book={afterBook} locale={locale} className="order-3" />
              ) : null}
            </div>

            <div className="mx-auto mt-8 max-w-sm space-y-2 text-center">
              <span className="block text-label-md text-muted">
                {hero.featuredLabel} · {featuredBook.category.name[locale]}
              </span>

              <h2 className="text-headline-md">
                <Link
                  href={`/${locale}/books/${featuredBook.slug}`}
                  className="hover:text-primary hover:underline hover:underline-offset-4"
                >
                  {featuredBook.title[locale]}
                </Link>
              </h2>

              <p className="text-body-md text-on-surface-variant">
                {dictionary.common.by} {featuredBook.author.name[locale]}
              </p>

              <div className="flex items-center justify-center gap-4">
                <Rating
                  value={featuredBook.rating}
                  count={featuredBook.reviewsCount}
                  locale={locale}
                />
                <PriceTag
                  price={featuredBook.price}
                  compareAtPrice={featuredBook.compareAtPrice}
                  locale={locale}
                />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

/** A side jacket in the fan: smaller, dimmed, and linked like any other. */
function FannedJacket({
  book,
  locale,
  className,
}: {
  book: BookWithRelations;
  locale: Locale;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "hidden w-28 shrink-0 rounded-xl bg-surface-low p-3 elevation-sm sm:block sm:w-36",
        className,
      )}
    >
      <Link
        href={`/${locale}/books/${book.slug}`}
        aria-label={book.title[locale]}
        className="block"
      >
        <BookCover
          title={book.title[locale]}
          author={book.author.name[locale]}
          seed={book.slug}
          src={book.coverUrl}
          sizes="9rem"
          className="rounded-md elevation-sm"
        />
      </Link>
    </div>
  );
}
