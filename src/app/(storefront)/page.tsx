
import { BookShelf } from "@/components/book/book-shelf";
import { AuthorsSpotlight } from "@/components/home/authors-spotlight";
import { CategoryTiles } from "@/components/home/category-tiles";
import { FeaturesStrip } from "@/components/home/features-strip";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { PromoBanner } from "@/components/home/promo-banner";
import { PublisherShelves } from "@/components/home/publisher-shelves";
import {
  getHeroFeaturedBook,
  getHeroShowcase,
  getPublisherShelves,
  getShelfAuthors,
  getShelfBooks,
  getShelfCategories,
  getShelfPublishers,
  getStoreSettings,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  applyHomeTexts,
  homeVisibility,
  PUBLISHER_SHELF_SIZE,
  readHeroContent,
  readPromoContent,
  readShelfContent,
} from "@/lib/home-sections";

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export default async function HomePage() {
  const locale = defaultLocale;

  /* The panel's settings are read before the catalogue: a section it has
     switched off is not queried for, not merely left undrawn, and a section
     it has hand-picked is fetched by those picks. */
  const settings = await getStoreSettings();
  const show = homeVisibility(settings);
  const hero = readHeroContent(settings);

  const [
    shipped,
    categories,
    featured,
    showcase,
    bestsellers,
    newArrivals,
    publisherShelves,
    authors,
  ] = await Promise.all([
    getDictionary(locale),
    show.categories ? getShelfCategories(readShelfContent(settings, "categories")) : [],
    /* One title: the hero's tagline pill links to it. The jackets it
       scrolls are a separate list, not this tag. */
    show.hero ? getHeroFeaturedBook(hero) : undefined,
    show.hero ? getHeroShowcase(hero) : [],
    show.bestsellers ? getShelfBooks("bestsellers", readShelfContent(settings, "bestsellers")) : [],
    show.newArrivals ? getShelfBooks("newArrivals", readShelfContent(settings, "newArrivals")) : [],
    /* Which presses first, then their titles: the second query needs the
       first's answer, so the pair is one step of the parallel fetch. */
    show.publishers
      ? getShelfPublishers(readShelfContent(settings, "publishers")).then((publishers) =>
          getPublisherShelves(publishers, PUBLISHER_SHELF_SIZE),
        )
      : [],
    show.authors ? getShelfAuthors(readShelfContent(settings, "authors")) : [],
  ]);

  /* The sections read their copy from the dictionary as they always did;
     what changes is that the panel's rewrites are laid over it first. */
  const dictionary = { ...shipped, home: applyHomeTexts(shipped.home, settings) };

  return (
    <>
      {show.hero ? (
        <Hero
          locale={locale}
          dictionary={dictionary}
          featuredBook={featured}
          showcase={showcase}
          primaryHref={hero.primaryHref}
          secondaryHref={hero.secondaryHref}
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

      {show.promo ? (
        <PromoBanner dictionary={dictionary.home.promo} {...readPromoContent(settings)} />
      ) : null}

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

      {show.publishers ? (
        <PublisherShelves
          shelves={publisherShelves}
          locale={locale}
          dictionary={dictionary}
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
