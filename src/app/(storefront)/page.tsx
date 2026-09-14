
import { BookShelf } from "@/components/book/book-shelf";
import { AuthorsSpotlight } from "@/components/home/authors-spotlight";
import { CategoryTiles } from "@/components/home/category-tiles";
import { FeaturesStrip } from "@/components/home/features-strip";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { PromoBanner } from "@/components/home/promo-banner";
import {
  getAuthors,
  getBestsellers,
  getBooksByTag,
  getCategories,
  getHomeSections,
  getNewArrivals,
  getShowcaseBooks,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export default async function HomePage() {
  const locale = defaultLocale;

  /* Read before the catalogue: a section the panel has switched off is
     not queried for, not merely left undrawn. */
  const show = await getHomeSections();

  const [
    dictionary,
    categories,
    featured,
    showcase,
    bestsellers,
    newArrivals,
    authors,
  ] = await Promise.all([
    getDictionary(locale),
    show.categories ? getCategories() : [],
    /* One title: the hero's tagline pill links to it. The jackets it
       scrolls come from the showcase query, not from this tag. */
    show.hero ? getBooksByTag("featured", 1) : [],
    show.hero ? getShowcaseBooks() : [],
    show.bestsellers ? getBestsellers(10) : [],
    show.newArrivals ? getNewArrivals(5) : [],
    show.authors ? getAuthors(6) : [],
  ]);

  return (
    <>
      {show.hero ? (
        <Hero
          locale={locale}
          dictionary={dictionary}
          featuredBook={featured[0]}
          showcase={showcase}
        />
      ) : null}

      {show.features ? (
        <FeaturesStrip dictionary={dictionary.home.features} />
      ) : null}

      {show.bestsellers ? (
        <BookShelf
          title={dictionary.home.bestsellers.title}
          subtitle={dictionary.home.bestsellers.subtitle}
          books={bestsellers}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={`/books?sort=popular`}
          priority
        />
      ) : null}

      {show.categories ? (
        <CategoryTiles
          locale={locale}
          dictionary={dictionary}
          categories={categories}
        />
      ) : null}

      {show.promo ? <PromoBanner dictionary={dictionary.home.promo} /> : null}

      {show.newArrivals ? (
        <BookShelf
          title={dictionary.home.newArrivals.title}
          subtitle={dictionary.home.newArrivals.subtitle}
          books={newArrivals}
          locale={locale}
          dictionary={dictionary.common}
          actionHref={`/books?sort=newest`}
          band
        />
      ) : null}

      {show.authors ? (
        <AuthorsSpotlight
          locale={locale}
          dictionary={dictionary}
          authors={authors}
        />
      ) : null}

      {show.newsletter ? (
        <Newsletter
          dictionary={dictionary.home.newsletter}
          locale={locale}
          toastTitle={dictionary.common.toast.subscribed}
          errorMessages={dictionary.common.actionErrors}
          fallbackError={dictionary.common.toast.actionFailed}
        />
      ) : null}
    </>
  );
}
