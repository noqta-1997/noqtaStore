
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
  getNewArrivals,
  getStoreStats,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

export default async function HomePage() {
  const locale = defaultLocale;

  const [
    dictionary,
    categories,
    featured,
    bestsellers,
    newArrivals,
    authors,
    stats,
  ] = await Promise.all([
    getDictionary(locale),
    getCategories(),
    /* Three rather than one: the hero fans the two extras out behind the
       featured jacket. Same query, same tag — only the limit moved. */
    getBooksByTag("featured", 3),
    getBestsellers(10),
    getNewArrivals(5),
    getAuthors(6),
    getStoreStats(),
  ]);

  return (
    <>
      <Hero
        locale={locale}
        dictionary={dictionary}
        featuredBook={featured[0]}
        companions={featured.slice(1)}
        stats={stats}
      />

      <FeaturesStrip dictionary={dictionary.home.features} />

      <BookShelf
        title={dictionary.home.bestsellers.title}
        subtitle={dictionary.home.bestsellers.subtitle}
        books={bestsellers}
        locale={locale}
        dictionary={dictionary.common}
        actionHref={`/books?sort=popular`}
        priority
      />

      <CategoryTiles
        locale={locale}
        dictionary={dictionary}
        categories={categories}
      />

      <PromoBanner dictionary={dictionary.home.promo} />

      <BookShelf
        title={dictionary.home.newArrivals.title}
        subtitle={dictionary.home.newArrivals.subtitle}
        books={newArrivals}
        locale={locale}
        dictionary={dictionary.common}
        actionHref={`/books?sort=newest`}
        band
      />

      <AuthorsSpotlight
        locale={locale}
        dictionary={dictionary}
        authors={authors}
      />

      <Newsletter
        dictionary={dictionary.home.newsletter}
        locale={locale}
        toastTitle={dictionary.common.toast.subscribed}
        errorMessages={dictionary.common.actionErrors}
        fallbackError={dictionary.common.toast.actionFailed}
      />
    </>
  );
}
