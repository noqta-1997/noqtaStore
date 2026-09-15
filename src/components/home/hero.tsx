import { ArrowRight, ArrowUpRight, LayoutGrid } from "lucide-react";
import Link from "next/link";

import { HeroShowcase, type HeroSlide } from "@/components/home/hero-showcase";
import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { localeDirection, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { cn } from "@/lib/utils";
import type { BookWithRelations } from "@/types";

interface HeroProps {
  locale: Locale;
  dictionary: Dictionary;
  /** The one title the tagline pill links to; without one there is no pill. */
  featuredBook?: BookWithRelations;
  /** Jackets for the showcase, in the order they play. */
  showcase: BookWithRelations[];
  primaryHref: string;
  secondaryHref: string;
}

/**
 * Copy on the left, a jacket on the right, and under both a strip of
 * thumbnails that picks the jacket and a line about the one that is showing.
 *
 * The copy is server-rendered here and handed to the showcase as children,
 * so the client bundle carries the three strips and nothing of the text; the
 * page stays a Server Component. Without any jackets — an empty catalogue —
 * the copy stands alone, centred, as it always did.
 */
export function Hero({
  locale,
  dictionary,
  featuredBook,
  showcase,
  primaryHref,
  secondaryHref,
}: HeroProps) {
  const { hero } = dictionary.home;

  const slides: HeroSlide[] = showcase.map((book) => ({
    id: book.id,
    slug: book.slug,
    title: book.title[locale],
    author: book.author.name[locale],
    authorSlug: book.author.slug,
    coverUrl: book.coverUrl,
    description: book.description[locale],
  }));

  const copy = (
    <div
      className={cn(
        "flex h-full w-full flex-col justify-center gap-5",
        slides.length
          ? "max-lg:items-center max-lg:text-center lg:min-h-108 lg:items-start"
          : "mx-auto max-w-2xl items-center text-center",
      )}
    >
      {/*
        The reference's "what's new" tagline, with the book of the week
        standing in for the release note. A pill rather than a `Badge`
        because it is a link and 28px tall, not a 22px label.
      */}
      {featuredBook ? (
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
          <span className="truncate text-on-surface-variant">{featuredBook.title[locale]}</span>
          <ArrowUpRight aria-hidden className="size-4 shrink-0 rtl:-scale-x-100" strokeWidth={1.75} />
        </Link>
      ) : null}

      <h1 id="hero-heading" className="text-display-md text-balance">
        {hero.title} <span className="text-primary">{hero.titleHighlight}</span>
      </h1>

      <p className="max-w-xl text-body-lg leading-relaxed text-pretty text-on-surface-variant">
        {hero.subtitle}
      </p>

      <div className="flex flex-wrap items-center justify-center gap-4 lg:justify-start">
        {/*
          The reference's shine: a diagonal band of light that sweeps across
          the fill once on hover. It is drawn on `::before` and moved with
          `background-position`, so nothing about the button's own paint or
          its label changes; the band runs with the writing direction.
        */}
        <Link
          href={primaryHref}
          className={buttonStyles({
            size: "lg",
            className:
              "group relative h-12 overflow-hidden rounded-full " +
              "before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] " +
              "before:bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.45)_50%,transparent_75%,transparent_100%)] " +
              "before:bg-[length:250%_250%] before:bg-no-repeat before:bg-[position:200%_0] " +
              "before:transition-[background-position] before:duration-1000 before:ease-fluent " +
              "hover:before:bg-[position:-100%_0] " +
              "rtl:before:bg-[position:-100%_0] rtl:hover:before:bg-[position:200%_0]",
          })}
        >
          {hero.primaryCta}
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
            strokeWidth={1.75}
          />
        </Link>
        {/* The reference's second action is the brand tint, not a neutral. */}
        <Link
          href={secondaryHref}
          className={buttonStyles({
            variant: "subtle",
            size: "lg",
            className:
              "h-12 rounded-full bg-primary-fixed text-on-primary-fixed " +
              "hover:bg-primary-fixed-hover hover:text-on-primary-fixed active:bg-primary-fixed-pressed",
          })}
        >
          <LayoutGrid aria-hidden className="size-4" strokeWidth={1.75} />
          {hero.secondaryCta}
        </Link>
      </div>
    </div>
  );

  return (
    <section aria-labelledby="hero-heading" className="bg-surface py-12 sm:py-16 lg:py-24">
      <Container>
        {slides.length ? (
          <HeroShowcase
            slides={slides}
            dir={localeDirection[locale]}
            labels={{ region: hero.showcase, slide: hero.slide, thumbnails: hero.thumbnails }}
          >
            {copy}
          </HeroShowcase>
        ) : (
          copy
        )}
      </Container>
    </section>
  );
}
