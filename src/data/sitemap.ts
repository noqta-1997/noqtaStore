import { prisma } from "@/lib/prisma";

/** A page the sitemap lists: its slug, when it last changed, its pictures. */
export interface SitemapRecord {
  slug: string;
  updatedAt: Date;
  images: string[];
}

/** Matches `handoutOnShelf` in `./index`: archived titles are off the shop. */
const onShelf = { archivedAt: null } as const;

/**
 * Everything the sitemap lists, in one round of queries.
 *
 * A teacher's or a press's page counts as changed when any of their titles
 * did — the page is mostly that list — so their date is the later of their
 * own row and their newest handout. Teachers and presses with nothing on the
 * shelf are left out: their pages exist, but an empty list is not a page
 * worth sending a crawler to.
 */
export async function getSitemapRecords() {
  const [handouts, categories, authors, publishers] = await Promise.all([
    prisma.handout.findMany({
      where: onShelf,
      select: { slug: true, updatedAt: true, coverUrl: true },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.handoutCategory.findMany({
      select: { slug: true, updatedAt: true },
      orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }],
    }),
    prisma.author.findMany({
      where: { handouts: { some: onShelf } },
      select: {
        slug: true,
        updatedAt: true,
        avatarUrl: true,
        handouts: {
          where: onShelf,
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    }),
    prisma.publisher.findMany({
      where: { handouts: { some: onShelf } },
      select: {
        slug: true,
        updatedAt: true,
        handouts: {
          where: onShelf,
          select: { updatedAt: true },
          orderBy: { updatedAt: "desc" },
          take: 1,
        },
      },
    }),
  ]);

  const latest = (own: Date, titles: { updatedAt: Date }[]) =>
    titles[0] && titles[0].updatedAt > own ? titles[0].updatedAt : own;

  return {
    handouts: handouts.map<SitemapRecord>((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt,
      images: row.coverUrl ? [row.coverUrl] : [],
    })),
    categories: categories.map<SitemapRecord>((row) => ({
      slug: row.slug,
      updatedAt: row.updatedAt,
      images: [],
    })),
    authors: authors.map<SitemapRecord>((row) => ({
      slug: row.slug,
      updatedAt: latest(row.updatedAt, row.handouts),
      images: row.avatarUrl ? [row.avatarUrl] : [],
    })),
    publishers: publishers.map<SitemapRecord>((row) => ({
      slug: row.slug,
      updatedAt: latest(row.updatedAt, row.handouts),
      images: [],
    })),
  };
}
