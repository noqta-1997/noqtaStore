import { ArrowRight, ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import type { BookWithRelations } from "@/types";

/**
 * Jackets in one pass of the marquee. The row is rendered twice and the
 * track slides by one row, so this number fixes both how much is in view
 * and how far a loop travels — the 48s in `globals.css` was timed against
 * it. A catalogue with fewer titles cycles the ones it has.
 */
const SHOWCASE_SIZE = 12;

interface HeroProps {
  locale: Locale;
  dictionary: Dictionary;
  /** The one title the tagline pill links to. */
  featuredBook: BookWithRelations;
  /** Jackets for the marquee, in the order they enter. */
  showcase: BookWithRelations[];
}

/**
 * Centred copy over a full-bleed row of jackets that never stops sliding.
 *
 * The row is the hero image. Two copies of the same jackets sit in one flex
 * track that moves by exactly one copy's width and then starts over, which
 * the eye cannot tell from a row with no end. It is decoration — every
 * jacket in it is reachable from the shelves further down the page — so the
 * track is hidden from assistive technology rather than read out twice, and
 * the global reduced-motion rule leaves it parked at its first frame. It
 * does not stop for the pointer: nothing in it can be clicked, so a pause
 * would only make the row stutter as the mouse crosses the page.
 */
export function Hero({ locale, dictionary, featuredBook, showcase }: HeroProps) {
  const { hero } = dictionary.home;

  const row = showcase.length
    ? Array.from({ length: SHOWCASE_SIZE }, (_, i) => showcase[i % showcase.length])
    : [];

  return (
    <section aria-labelledby="hero-heading" className="bg-surface py-14 lg:py-24">
      <Container className="mb-12 flex flex-col items-center lg:mb-16">
        <div className="flex max-w-2xl flex-col items-center gap-6 text-center lg:gap-8">
          <div className="flex w-full flex-col items-center gap-5 lg:gap-6">
            {/*
              The reference's "what's new" tagline, with the book of the week
              standing in for the release note. A pill rather than a `Badge`
              because it is a link and 28px tall, not a 22px label.
            */}
            <Link
              href={`/books/${featuredBook.slug}`}
              className={
                "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border " +
                "border-line bg-card px-3 text-body-md text-on-surface elevation-sm " +
                "transition-[background-color,border-color] duration-100 ease-fluent " +
                "hover:border-line-hover hover:bg-card-hover"
              }
            >
              <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-success" />
              <span className="shrink-0 font-semibold">{hero.featuredLabel}</span>
              <span aria-hidden className="shrink-0 text-muted">
                ·
              </span>
              <span className="truncate text-on-surface-variant">
                {featuredBook.title[locale]}
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 rtl:-scale-x-100"
                strokeWidth={1.75}
              />
            </Link>

            <h1 id="hero-heading" className="text-display-lg text-balance">
              {hero.title}{" "}
              <span className="text-primary">{hero.titleHighlight}</span>
            </h1>

            <p className="text-body-lg leading-relaxed text-pretty text-on-surface-variant">
              {hero.subtitle}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
            <Link
              href={`/books`}
              className={buttonStyles({
                size: "lg",
                className: "h-12 rounded-full max-sm:w-full",
              })}
            >
              {hero.primaryCta}
              <ArrowRight aria-hidden className="size-4 rtl:rotate-180" strokeWidth={1.75} />
            </Link>
            <Link
              href={`/categories`}
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
        </div>
      </Container>

      {row.length ? (
        /*
          `overflow-x-clip`, not `overflow-hidden`: hidden would clip the
          jackets' shadows at the top and bottom edges as well, and would
          force the other axis to `auto`. Clip only takes the width, and it
          keeps the track from widening the page.
        */
        <div aria-hidden className="w-full overflow-x-clip">
          <div className="flex w-max animate-marquee will-change-transform">
            <JacketRow jackets={row} locale={locale} eager />
            <JacketRow jackets={row} locale={locale} />
          </div>
        </div>
      ) : null}
    </section>
  );
}

/**
 * One pass of jackets. The trailing `pe-4` matches the `gap-4`, so a copy is
 * exactly as wide as the stride between it and the next one — without it
 * the loop would jump by half a gap every time it reset.
 */
function JacketRow({
  jackets,
  locale,
  eager = false,
}: {
  jackets: BookWithRelations[];
  locale: Locale;
  /** Preload the jackets that are in view at first paint. */
  eager?: boolean;
}) {
  return (
    <div className="flex shrink-0 gap-4 pe-4">
      {jackets.map((book, index) => (
        /* Books repeat within a row when the catalogue is short. */
        <div key={`${book.id}-${index}`} className="w-40 shrink-0 md:w-60">
          <BookCover
            title={book.title[locale]}
            author={book.author.name[locale]}
            seed={book.slug}
            src={book.coverUrl}
            priority={eager && index < 4}
            sizes="(min-width: 768px) 15rem, 10rem"
            className="rounded-lg elevation-md"
          />
        </div>
      ))}
    </div>
  );
}
