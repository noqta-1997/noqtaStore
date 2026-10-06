import type { MetadataRoute } from "next";

import { getSitemapRecords, type SitemapRecord } from "@/data/sitemap";
import { absoluteUrl } from "@/lib/site";

/** Rebuilt at most hourly: a new handout reaches it within the hour. */
export const revalidate = 3600;

/** The pages whose words change only when the code does. */
const fixedPages = [
  "/about",
  "/faq",
  "/contact",
  "/shipping",
  "/returns",
  "/privacy",
  "/terms",
  "/careers",
];

/**
 * Every page a search engine should find: the shop's listings and every
 * handout, branch, teacher and press on the shelf. Account, cart, checkout,
 * search and the panel are absent on purpose — `robots.ts` and their own
 * `noindex` keep them out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { handouts, categories, authors, publishers } = await getSitemapRecords();

  const newest = handouts[0]?.updatedAt;

  const records = (base: string, rows: SitemapRecord[], priority: number) =>
    rows.map((row) => ({
      url: absoluteUrl(`${base}/${row.slug}`),
      lastModified: row.updatedAt,
      priority,
      ...(row.images.length ? { images: row.images } : {}),
    }));

  return [
    { url: absoluteUrl("/"), lastModified: newest, priority: 1 },
    { url: absoluteUrl("/handouts"), lastModified: newest, priority: 0.9 },
    { url: absoluteUrl("/handouts/categories"), priority: 0.7 },
    { url: absoluteUrl("/authors"), priority: 0.7 },
    { url: absoluteUrl("/publishers"), priority: 0.7 },
    ...records("/handouts", handouts, 0.8),
    ...records("/handouts/categories", categories, 0.6),
    ...records("/authors", authors, 0.6),
    ...records("/publishers", publishers, 0.5),
    ...fixedPages.map((path) => ({ url: absoluteUrl(path), priority: 0.3 })),
  ];
}
