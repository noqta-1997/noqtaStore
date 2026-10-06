import type { Metadata } from "next";

import { AuthorsSpotlight } from "@/components/home/authors-spotlight";
import { FeaturesStrip } from "@/components/home/features-strip";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { PublisherShelves } from "@/components/home/publisher-shelves";
import { JsonLd } from "@/components/seo/json-ld";
import {
  getHeroFeaturedHandout,
  getHeroShowcase,
  getPublisherShelves,
  getShelfAuthors,
  getShelfPublishers,
  getStoreIdentity,
  getStoreSettings,
  type StoreIdentity,
} from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import {
  applyHomeTexts,
  homeVisibility,
  PUBLISHER_SHELF_SIZE,
  readHeroContent,
  readShelfContent,
} from "@/lib/home-sections";
import { absoluteUrl } from "@/lib/site";

/** Catalogue content is re-fetched at most every five minutes. */
export const revalidate = 300;

/** The home page is the canonical "/"; its title is the root layout's. */
export const metadata: Metadata = { alternates: { canonical: "/" } };

/**
 * Who runs the store, for the knowledge panel and the site name above a
 * result: an `OnlineStore` (Google's organisation markup takes it) and the
 * `WebSite` it publishes. Fields the settings screen has left empty are
 * left out rather than sent blank.
 */
function storeData(identity: StoreIdentity, name: string, description: string) {
  const home = absoluteUrl("/");

  return {
    "@graph": [
      {
        "@type": "OnlineStore",
        "@id": `${home}#store`,
        name,
        url: home,
        logo: absoluteUrl("/icon.png"),
        description,
        ...(identity.email ? { email: identity.email } : {}),
        ...(identity.phone ? { telephone: identity.phone } : {}),
        address: {
          "@type": "PostalAddress",
          addressCountry: "IQ",
          ...(identity.address ? { streetAddress: identity.address } : {}),
        },
      },
      {
        "@type": "WebSite",
        "@id": `${home}#website`,
        name,
        url: home,
        inLanguage: "ar",
        publisher: { "@id": `${home}#store` },
      },
    ],
  };
}

export default async function HomePage() {
  const locale = defaultLocale;

  /* The panel's settings are read before the catalogue: a section it has
     switched off is not queried for, not merely left undrawn, and a section
     it has hand-picked is fetched by those picks. */
  const settings = await getStoreSettings();
  const show = homeVisibility(settings);
  const hero = readHeroContent(settings);

  const [shipped, identity, featured, showcase, publisherShelves, authors] = await Promise.all([
    getDictionary(locale),
    getStoreIdentity(),
    /* One title: the hero's tagline pill links to it. The jackets it
       scrolls are a separate list, not this tag. */
    show.hero ? getHeroFeaturedHandout(hero) : undefined,
    show.hero ? getHeroShowcase(hero) : [],
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
  const name = identity.name[locale] || shipped.brand.name;
  const tagline = identity.tagline[locale] || shipped.brand.tagline;

  return (
    <>
      <JsonLd data={storeData(identity, name, shipped.footer.about)} />

      {/* The hero carries the page's heading; with it switched off the page
          would have none, and a page without an h1 has no stated subject. */}
      {show.hero ? null : <h1 className="sr-only">{`${name} — ${tagline}`}</h1>}

      {show.hero ? (
        <Hero
          locale={locale}
          dictionary={dictionary}
          featuredHandout={featured}
          showcase={showcase}
          primaryHref={hero.primaryHref}
          secondaryHref={hero.secondaryHref}
        />
      ) : null}

      {show.features ? (
        <FeaturesStrip dictionary={dictionary.home.features} />
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
