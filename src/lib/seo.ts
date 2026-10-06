import type { Metadata } from "next";
import { cache } from "react";

import { getStoreIdentity } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import type { ParsedBookQuery } from "@/lib/book-query";

/** Open Graph's name for the one language the store speaks. */
export const OG_LOCALE = "ar_IQ";

/**
 * The store's own card, `app/opengraph-image.png`. The file convention
 * attaches it only to pages that leave `openGraph` alone; a page that sets
 * any of it has to name the picture again or share without one.
 */
const STORE_CARD = { url: "/opengraph-image.png", width: 1200, height: 630 };

/** The store's name as the settings screen has it, else the shipped copy. */
export const getSiteName = cache(async (): Promise<string> => {
  const [identity, dictionary] = await Promise.all([
    getStoreIdentity(),
    getDictionary(defaultLocale),
  ]);
  return identity.name[defaultLocale] || dictionary.brand.name;
});

/**
 * Cuts a description to what a results page shows, about 160 characters,
 * at a word boundary. The handouts' descriptions are written for the detail
 * page and run to paragraphs; a snippet cut mid-word reads as broken.
 */
export function summarize(text: string, max = 160): string {
  const flat = text.replace(/\s+/g, " ").trim();
  if (flat.length <= max) return flat;

  const cut = flat.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s،,.؛:-]+$/, "")}…`;
}

interface PageSeo {
  title: string;
  description?: string;
  /** The page's own path; it becomes the canonical link and `og:url`. */
  path: string;
  /** An absolute picture for the share card; the store's card otherwise. */
  image?: string;
}

/**
 * The metadata of an indexable page: title, a trimmed description, the
 * canonical link and the share card.
 *
 * `openGraph` is merged shallowly — a page that sets any of it replaces the
 * root layout's whole object — so the fields every card shares are written
 * here again rather than left to the layout.
 */
export async function pageMetadata({ title, description, path, image }: PageSeo): Promise<Metadata> {
  const summary = description ? summarize(description) : undefined;

  return {
    title,
    description: summary,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: OG_LOCALE,
      siteName: await getSiteName(),
      title,
      description: summary,
      url: path,
      images: [image ? { url: image, alt: title } : STORE_CARD],
    },
  };
}

/** For pages that belong to one person or are a step in a flow. */
export const privatePage = {
  robots: { index: false, follow: false },
} satisfies Metadata;

/**
 * Canonical and robots for a filtered listing.
 *
 * A bare listing and its plain pages are indexable, each page its own
 * canonical. Any filter or sort turns the page into one of thousands of
 * combinations of the same titles: those are kept out of the index but
 * still followed, so the titles they link to are found.
 */
export function listingIndexing(basePath: string, { values, page }: ParsedBookQuery): Metadata {
  const filtered = Object.values(values).some(
    (value) => value !== undefined && value !== "" && value !== false,
  );

  if (filtered) {
    return {
      alternates: { canonical: basePath },
      robots: { index: false, follow: true },
    };
  }

  return { alternates: { canonical: page > 1 ? `${basePath}?page=${page}` : basePath } };
}
