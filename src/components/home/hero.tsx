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
import type { BookWithRelations } from "@/types";

interface HeroProps {
  locale: Locale;
  dictionary: Dictionary;
  featuredBook: BookWithRelations;
  stats: {
    booksCount: number;
    authorsCount: number;
    publishersCount: number;
  };
}

export function Hero({ locale, dictionary, featuredBook, stats }: HeroProps) {
  const { hero } = dictionary.home;

  const figures = [
    { value: stats.booksCount, label: hero.stats.books },
    { value: stats.authorsCount, label: hero.stats.authors },
    { value: stats.publishersCount, label: hero.stats.publishers },
  ];

  return (
    <section className="border-b-2 border-line bg-surface">
      <Container className="grid items-center gap-10 py-12 lg:grid-cols-12 lg:gap-12 lg:py-20">
        <div className="space-y-6 lg:col-span-7">
          <Badge tone="outline">{hero.eyebrow}</Badge>

          <h1 className="text-headline-lg sm:text-[2.75rem] sm:leading-[1.15] lg:text-display-lg">
            {hero.title}{" "}
            <span className="border-b-4 border-primary-container text-primary">
              {hero.titleHighlight}
            </span>
          </h1>

          <p className="max-w-xl text-body-md text-on-surface-variant sm:text-body-lg">
            {hero.subtitle}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href={`/${locale}/books`}
              className={buttonStyles({ size: "lg", className: "max-sm:w-full" })}
            >
              {hero.primaryCta}
              <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={2} />
            </Link>
            <Link
              href={`/${locale}/categories`}
              className={buttonStyles({
                variant: "secondary",
                size: "lg",
                className: "max-sm:w-full",
              })}
            >
              <LayoutGrid aria-hidden className="size-4" strokeWidth={2} />
              {hero.secondaryCta}
            </Link>
          </div>

          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t-2 border-line pt-6">
            {figures.map((figure) => (
              <div key={figure.label}>
                <dt className="sr-only">{figure.label}</dt>
                <dd>
                  <span
                    className="block font-mono text-2xl font-semibold text-on-surface sm:text-3xl"
                    data-numeric
                  >
                    {formatNumber(figure.value, locale)}+
                  </span>
                  <span className="mt-1 block text-label-sm text-muted">
                    {figure.label}
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="lg:col-span-5">
          <div className="relative mx-auto max-w-sm lg:max-w-none">
            <div
              aria-hidden
              className="absolute inset-x-8 top-6 bottom-0 rotate-3 border border-line bg-surface-high rtl:-rotate-3"
            />

            <article className="relative border border-line bg-card p-4 shadow-hard sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <Badge tone="primary">{hero.featuredLabel}</Badge>
                <span className="label-mono text-muted">
                  {featuredBook.category.name[locale]}
                </span>
              </div>

              <div className="flex gap-4">
                <div className="w-28 shrink-0 sm:w-32">
                  <BookCover
                    title={featuredBook.title[locale]}
                    author={featuredBook.author.name[locale]}
                    seed={featuredBook.slug}
                    src={featuredBook.coverUrl}
                    priority
                    sizes="(min-width: 640px) 8rem, 7rem"
                    className="border border-line"
                  />
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                  <h2 className="font-display text-xl leading-snug font-bold text-balance">
                    <Link
                      href={`/${locale}/books/${featuredBook.slug}`}
                      className="hover:underline hover:underline-offset-4"
                    >
                      {featuredBook.title[locale]}
                    </Link>
                  </h2>
                  <p className="text-sm text-on-surface-variant">
                    {dictionary.common.by} {featuredBook.author.name[locale]}
                  </p>
                  <Rating
                    value={featuredBook.rating}
                    count={featuredBook.reviewsCount}
                    locale={locale}
                  />
                  <p className="line-clamp-3 text-sm leading-relaxed text-muted">
                    {featuredBook.description[locale]}
                  </p>
                  <PriceTag
                    price={featuredBook.price}
                    compareAtPrice={featuredBook.compareAtPrice}
                    locale={locale}
                    size="lg"
                    className="mt-auto pt-2"
                  />
                </div>
              </div>

              <Link
                href={`/${locale}/books/${featuredBook.slug}`}
                className={buttonStyles({ fullWidth: true, className: "mt-5" })}
              >
                {dictionary.common.addToCart}
              </Link>
            </article>
          </div>
        </div>
      </Container>
    </section>
  );
}
