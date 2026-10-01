import { cache } from "react";

import {
  toAddress,
  toAuthor,
  toHandout,
  toHandoutCategoryWithCount,
  toHandoutReviewWithAuthor,
  toHandoutReviewWithStatus,
  toOrder,
  toPublisher,
} from "@/data/mappers";
import type { Prisma } from "@/generated/prisma/client";
import { escapeLike } from "@/lib/arabic";
import { getCurrentCustomer } from "@/lib/auth";
import {
  homeVisibility,
  resolveShelf,
  type HeroContent,
  type HomeSectionVisibility,
  type ShelfContent,
} from "@/lib/home-sections";
import {
  ancestorsOf,
  buildTree,
  flattenTree,
  rollUp,
  subtreeOf,
} from "@/lib/category-tree";
import { storeDateKey } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import type {
  AdminNotification,
  Author,
  BookTag,
  Localized,
  ContactMessage,
  ContactStatus,
  Coupon,
  NewsletterSubscriber,
  CartLineWithHandout,
  CategoryShare,
  Customer,
  CustomerStatus,
  CustomerSummary,
  HandoutCategory,
  HandoutCategoryNode,
  HandoutReview,
  HandoutReviewWithStatus,
  HandoutWithRelations,
  Order,
  OrderStatus,
  PickOption,
  Publisher,
  ReviewStatus,
} from "@/types";

/**
 * The single access layer over the store's data.
 *
 * Every function returns the shapes the UI has always consumed, so replacing
 * the mock arrays with Postgres did not touch a single component.
 */

/** Commerce rules, kept in one place for the whole storefront. */
export const FREE_SHIPPING_THRESHOLD = 50000;
export const STANDARD_SHIPPING_COST = 5000;
export const EXPRESS_SHIPPING_COST = 10000;
export const HANDOUTS_PER_PAGE = 12;
export const LOW_STOCK_THRESHOLD = 12;

/**
 * Account queries are scoped to the signed-in reader. Callers reach these
 * only through protected routes, so a missing session is a programming
 * error rather than a state the UI has to render.
 */
async function currentCustomerId(): Promise<string> {
  const customer = await getCurrentCustomer();

  if (!customer) {
    throw new Error("No signed-in customer — this query needs a protected route");
  }

  return customer.id;
}

/**
 * The cart and wishlist are reachable without signing in, so they answer with
 * nothing rather than throwing. Every other account query stays protected.
 */
async function optionalCustomerId(): Promise<string | null> {
  return (await getCurrentCustomer())?.id ?? null;
}

/**
 * The storefront's view of the handouts table: every title the panel has not
 * archived. Each read a customer can reach filters on it, counts included;
 * the panel's own table, order history and the sales reports do not, since
 * an archived title is still one the shop has sold.
 */
const handoutOnShelf = { archivedAt: null } satisfies Prisma.HandoutWhereInput;

export type SortKey =
  | "relevance"
  | "newest"
  | "popular"
  | "priceAsc"
  | "priceDesc"
  | "rating";

export interface BookQuery {
  q?: string;
  category?: string;
  author?: string;
  publisher?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

/**
 * The Arabic columns the panel searches by name, per table, and the ids of
 * the rows a term matches over `arabic_key()` — the same comparison the
 * catalogue search makes. The table and its columns come from this list,
 * never from a caller; the term is bound.
 */
const arabicSearchColumns = {
  authors: ['"nameAr"'],
  publishers: ['"nameAr"'],
  customers: ["name"],
  contact_messages: ["name", "subject", "message"],
} as const;

async function idsMatchingArabic(
  table: keyof typeof arabicSearchColumns,
  term: string,
): Promise<string[]> {
  const clauses = arabicSearchColumns[table]
    .map((column) => `arabic_key(${column}) LIKE arabic_key($1) ESCAPE '\\'`)
    .join(" OR ");
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM ${table} WHERE ${clauses}`,
    `%${escapeLike(term)}%`,
  );
  return rows.map((row) => row.id);
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

/*
 * The category tree is a few dozen rows that every page asks something of —
 * the filter, the crumbs, the menus — so a request loads it once and answers
 * the rest from memory. Siblings come back in the order the panel gave them,
 * oldest first among equals; a branch's count is rolled up from below.
 */
const loadHandoutCategoryTree = cache(async (): Promise<HandoutCategoryNode[]> => {
  const rows = await prisma.handoutCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    include: { _count: { select: { handouts: { where: handoutOnShelf } } } },
  });

  return rollUp(buildTree(rows.map(toHandoutCategoryWithCount)), "handoutsCount");
});

const loadHandoutCategoryIndex = cache(async () => {
  const nodes = flattenTree(await loadHandoutCategoryTree());
  return {
    nodes,
    byId: new Map(nodes.map((node) => [node.id, node])),
    bySlug: new Map(nodes.map((node) => [node.slug, node])),
  };
});

/** The handouts' top-level branches, each carrying what hangs under it. */
export async function getHandoutCategoryTree(): Promise<HandoutCategoryNode[]> {
  return loadHandoutCategoryTree();
}

/** Every handout branch, parents before children, siblings in order. */
export async function getHandoutCategories(): Promise<HandoutCategoryNode[]> {
  return (await loadHandoutCategoryIndex()).nodes;
}

/** The branches above a handout category, top-level first. */
export async function getHandoutCategoryAncestors(
  category: HandoutCategory,
): Promise<HandoutCategoryNode[]> {
  const { byId } = await loadHandoutCategoryIndex();
  const node = byId.get(category.id);
  return node ? ancestorsOf(node, byId) : [];
}

async function handoutCategorySubtreeIds(slug: string): Promise<string[]> {
  const node = (await loadHandoutCategoryIndex()).bySlug.get(slug);
  return node ? subtreeOf(node).map((entry) => entry.id) : [];
}

export async function getHandoutCategoryBySlug(
  slug: string,
): Promise<HandoutCategoryNode | undefined> {
  return (await loadHandoutCategoryIndex()).bySlug.get(slug);
}

export async function getHandoutCategoryById(
  id: string,
): Promise<HandoutCategoryNode | undefined> {
  return (await loadHandoutCategoryIndex()).byId.get(id);
}

/** What the teacher has on the shelf. */
const authorInclude = {
  _count: { select: { handouts: { where: handoutOnShelf } } },
} as const;

type AuthorRowWithCounts = Prisma.AuthorGetPayload<{ include: typeof authorInclude }>;

/**
 * Most handouts first, then by name, so equals keep one order between
 * renders: Postgres hands ties back in whatever order the plan produced.
 */
function byTitlesWritten(a: AuthorRowWithCounts, b: AuthorRowWithCounts): number {
  return b._count.handouts - a._count.handouts || a.nameAr.localeCompare(b.nameAr, "ar");
}

export async function getAuthors(limit?: number): Promise<Author[]> {
  const rows = await prisma.author.findMany({ include: authorInclude });
  const ranked = rows.sort(byTitlesWritten);

  return (typeof limit === "number" ? ranked.slice(0, limit) : ranked).map(toAuthor);
}

/**
 * Archived handouts per teacher, press or branch, for the panel's tables. The
 * counts above them are the shelf's, but an archived title still holds its
 * relations, and a row reading 0 that refuses to be deleted has to show why.
 */
export async function getArchivedTitleCounts(
  field: "authorId" | "publisherId" | "categoryId",
): Promise<Map<string, number>> {
  const rows: Record<string, unknown>[] = await prisma.handout.findMany({
    where: { archivedAt: { not: null } },
    select: { [field]: true },
  });

  const counts = new Map<string, number>();
  for (const row of rows) {
    const id = row[field] as string;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Authors in the order their ids were given; a deleted one is skipped. */
export async function getAuthorsByIds(ids: string[]): Promise<Author[]> {
  if (!ids.length) return [];

  const rows = await prisma.author.findMany({
    where: { id: { in: ids } },
    include: authorInclude,
  });
  const byId = new Map(rows.map((row) => [row.id, toAuthor(row)]));

  return ids.flatMap((id) => {
    const author = byId.get(id);
    return author ? [author] : [];
  });
}

/** The spotlight: the panel's picks, or the authors with the most handouts. */
export async function getShelfAuthors(content: ShelfContent): Promise<Author[]> {
  return resolveShelf(content, getAuthorsByIds, getAuthors);
}

/**
 * What the panel's author picker searches through: by name, most handouts
 * first, each with the card's second line — the count — under the name.
 */
export async function searchAuthorPicks(
  term: string,
  handoutsLabel: string,
  exclude: string[] = [],
  limit = 8,
): Promise<PickOption[]> {
  const rows = await prisma.author.findMany({
    where: {
      id: {
        notIn: exclude,
        ...(term.trim() ? { in: await idsMatchingArabic("authors", term.trim()) } : {}),
      },
    },
    include: { _count: { select: { handouts: { where: handoutOnShelf } } } },
    orderBy: [{ handouts: { _count: "desc" } }, { nameAr: "asc" }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.nameAr,
    sublabel: `${row._count.handouts} ${handoutsLabel}`,
    seed: row.slug,
    picture: { kind: "portrait" },
  }));
}

export const getAuthorBySlug = cache(async (slug: string): Promise<Author | undefined> => {
  const row = await prisma.author.findUnique({
    where: { slug },
    include: authorInclude,
  });

  return row ? toAuthor(row) : undefined;
});

export async function getAuthorById(id: string): Promise<Author | undefined> {
  const row = await prisma.author.findUnique({
    where: { id },
    include: authorInclude,
  });

  return row ? toAuthor(row) : undefined;
}

export async function getAuthorIds() {
  const rows = await prisma.author.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

/* ------------------------------------------------------------------ */
/* Handouts                                                            */
/* ------------------------------------------------------------------ */

const handoutInclude = { author: true, category: true, publisher: true } as const;

/**
 * The listing's filters. `BookQuery` keeps the name of the school-book
 * catalogue it was written for; the handouts are what it filters now.
 */
export type HandoutQuery = BookQuery;

export interface HandoutQueryResult {
  items: HandoutWithRelations[];
  total: number;
  page: number;
  pageCount: number;
}

/*
 * Every key breaks ties on `createdAt`. Three seeded handouts with no reviews
 * yet all sort equal on the default key, and Postgres returns equal rows in
 * whatever order it last touched them — the listing reshuffled after a review
 * was published and withdrawn.
 */
const handoutOrderByForSort: Record<SortKey, Prisma.HandoutOrderByWithRelationInput[]> = {
  relevance: [{ reviewsCount: "desc" }, { createdAt: "desc" }],
  popular: [{ reviewsCount: "desc" }, { createdAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  priceAsc: [{ price: "asc" }, { createdAt: "desc" }],
  priceDesc: [{ price: "desc" }, { createdAt: "desc" }],
  rating: [{ rating: "desc" }, { createdAt: "desc" }],
};

/**
 * The ids of the handouts a search term matches.
 *
 * Prisma's `contains` compares letters, and Arabic spells one word several
 * ways: a reader who types «احمد» found nothing by «أحمد». The comparison is
 * made in SQL over `arabic_key()`, the same spelling-blind form the unique
 * keys use (migration 20260917160000_normalized_name_keys), on the title and
 * on the teacher, press and branch names — the term folded the same way. The
 * slug clause answers a Latin-script query. The ids then go into an ordinary
 * `where`, which is what keeps the filters, the count and the pagination.
 */
async function searchHandoutIds(term: string): Promise<string[]> {
  const pattern = `%${escapeLike(term)}%`;
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT h.id
    FROM handouts h
    JOIN authors a ON a.id = h."authorId"
    JOIN publishers p ON p.id = h."publisherId"
    JOIN handout_categories c ON c.id = h."categoryId"
    WHERE arabic_key(h."titleAr") LIKE arabic_key(${pattern}) ESCAPE '\\'
       OR lower(h.slug) LIKE lower(${pattern}) ESCAPE '\\'
       OR arabic_key(a."nameAr") LIKE arabic_key(${pattern}) ESCAPE '\\'
       OR arabic_key(p."nameAr") LIKE arabic_key(${pattern}) ESCAPE '\\'
       OR arabic_key(c."nameAr") LIKE arabic_key(${pattern}) ESCAPE '\\'`;
  return rows.map((row) => row.id);
}

async function handoutWhere(query: HandoutQuery): Promise<Prisma.HandoutWhereInput> {
  const where: Prisma.HandoutWhereInput = { ...handoutOnShelf };

  if (query.q?.trim()) {
    where.id = { in: await searchHandoutIds(query.q.trim()) };
  }

  /* A branch answers for everything under it: the primary stage lists the
     handouts of all six grades, a grade those of both its branches. */
  if (query.category) {
    where.categoryId = { in: await handoutCategorySubtreeIds(query.category) };
  }
  if (query.author) where.author = { slug: query.author };
  if (query.publisher) where.publisher = { slug: query.publisher };
  if (query.inStock) where.stock = { gt: 0 };
  if (query.onSale) where.compareAtPrice = { not: null };
  if (typeof query.rating === "number") where.rating = { gte: query.rating };

  if (typeof query.minPrice === "number" || typeof query.maxPrice === "number") {
    where.price = {
      ...(typeof query.minPrice === "number" ? { gte: query.minPrice } : {}),
      ...(typeof query.maxPrice === "number" ? { lte: query.maxPrice } : {}),
    };
  }

  return where;
}

/** The single entry point behind the listing, category and search pages. */
export async function queryHandouts(query: HandoutQuery = {}): Promise<HandoutQueryResult> {
  const perPage = query.perPage ?? HANDOUTS_PER_PAGE;
  const where = await handoutWhere(query);

  const total = await prisma.handout.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);

  const rows = await prisma.handout.findMany({
    where,
    include: handoutInclude,
    orderBy: handoutOrderByForSort[query.sort ?? "relevance"],
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { items: rows.map(toHandout), total, page, pageCount };
}

export async function getHandoutPriceBounds() {
  const result = await prisma.handout.aggregate({
    where: handoutOnShelf,
    _min: { price: true },
    _max: { price: true },
  });

  return { min: result._min.price ?? 0, max: result._max.price ?? 0 };
}

/**
 * The by-slug read is memoised per request: a detail page asks three times
 * — the segment layout that decides 404, `generateMetadata`, and the page —
 * and one row is enough for all of them.
 */
export const getHandoutBySlug = cache(
  async (slug: string): Promise<HandoutWithRelations | undefined> => {
    const row = await prisma.handout.findUnique({
      where: { slug, ...handoutOnShelf },
      include: handoutInclude,
    });
    return row ? toHandout(row) : undefined;
  },
);

export async function getHandoutById(id: string): Promise<HandoutWithRelations | undefined> {
  const row = await prisma.handout.findUnique({ where: { id }, include: handoutInclude });
  return row ? toHandout(row) : undefined;
}

/**
 * Handouts in the order their ids were given — the order the panel picked
 * them in. An id whose handout has since gone is skipped rather than left as
 * a hole, so a hand-picked list shortens instead of breaking.
 */
export async function getHandoutsByIds(ids: string[]): Promise<HandoutWithRelations[]> {
  if (!ids.length) return [];

  const rows = await prisma.handout.findMany({
    where: { ...handoutOnShelf, id: { in: ids } },
    include: handoutInclude,
  });
  const byId = new Map(rows.map((row) => [row.id, toHandout(row)]));

  return ids.flatMap((id) => {
    const handout = byId.get(id);
    return handout ? [handout] : [];
  });
}

export async function getHandoutsByTag(
  tag: BookTag,
  limit?: number,
): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: { ...handoutOnShelf, tags: { has: tag } },
    include: handoutInclude,
    orderBy: handoutOrderByForSort.popular,
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return rows.map(toHandout);
}

/**
 * The jackets the home hero slides past. Real artwork leads — a cover that
 * someone took the trouble to upload is what a showcase is for — and the
 * typographic placeholders fill in behind it, the most-reviewed titles first
 * in both halves.
 */
export async function getShowcaseHandouts(limit = 12): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: handoutOnShelf,
    include: handoutInclude,
    orderBy: [
      { coverUrl: { sort: "desc", nulls: "last" } },
      { reviewsCount: "desc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });

  return rows.map(toHandout);
}

/**
 * The title the hero's tagline pill links to: the panel's pick while it is
 * still in the catalogue, otherwise the most-reviewed handout tagged featured.
 */
export async function getHeroFeaturedHandout(
  content: HeroContent,
): Promise<HandoutWithRelations | undefined> {
  if (content.featuredHandoutId) {
    const picked = await getHandoutById(content.featuredHandoutId);
    if (picked && !picked.archived) return picked;
  }

  const [tagged] = await getHandoutsByTag("featured", 1);
  return tagged;
}

/**
 * The hero's jackets: the panel's picks, in its order, while any of them are
 * still in the catalogue; otherwise the showcase ranking.
 */
export async function getHeroShowcase(content: HeroContent): Promise<HandoutWithRelations[]> {
  if (content.showcaseIds.length) {
    const picked = await getHandoutsByIds(content.showcaseIds);
    if (picked.length) return picked;
  }

  return getShowcaseHandouts();
}

/**
 * What the panel's hero pickers search through. The same clauses as the
 * catalogue search, ranked the way the showcase is — real artwork first — so
 * that with nothing typed the list opens on the jackets most worth showing.
 */
export async function searchHandoutPicks(
  term: string,
  exclude: string[] = [],
  limit = 8,
): Promise<PickOption[]> {
  const rows = await prisma.handout.findMany({
    where: { AND: [await handoutWhere({ q: term }), { id: { notIn: exclude } }] },
    include: { author: true },
    orderBy: [{ coverUrl: { sort: "desc", nulls: "last" } }, { reviewsCount: "desc" }],
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    label: row.titleAr,
    sublabel: row.author.nameAr,
    seed: row.slug,
    picture: { kind: "jacket", src: row.coverUrl ?? undefined },
  }));
}

export async function getHandoutSlugs(): Promise<string[]> {
  const rows = await prisma.handout.findMany({ where: handoutOnShelf, select: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getRelatedHandouts(
  handout: HandoutWithRelations,
  limit = 5,
): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: { ...handoutOnShelf, categoryId: handout.categoryId, id: { not: handout.id } },
    include: handoutInclude,
    orderBy: { reviewsCount: "desc" },
    take: limit,
  });

  return rows.map(toHandout);
}

/*
 * The author and publisher pages list their handouts whole, without pages:
 * a teacher's or a press's handouts are a handful.
 */
export async function getHandoutsByAuthor(
  authorSlug: string,
): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: { ...handoutOnShelf, author: { slug: authorSlug } },
    include: handoutInclude,
    orderBy: handoutOrderByForSort.popular,
  });

  return rows.map(toHandout);
}

export async function getHandoutsByPublisher(
  publisherSlug: string,
): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: { ...handoutOnShelf, publisher: { slug: publisherSlug } },
    include: handoutInclude,
    orderBy: handoutOrderByForSort.newest,
  });

  return rows.map(toHandout);
}

export async function getReviewsByHandout(handoutId: string): Promise<HandoutReview[]> {
  const rows = await prisma.handoutReview.findMany({
    where: { handoutId, status: "published" },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toHandoutReviewWithAuthor);
}

/* ------------------------------------------------------------------ */
/* Account — the signed-in reader                                      */
/* ------------------------------------------------------------------ */

export async function getCustomer(): Promise<Customer> {
  const row = await prisma.customer.findUniqueOrThrow({
    where: { id: await currentCustomerId() },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      /* What the wishlist page shows: an archived title's row is kept, for
         the day it comes back, but is not on the page, so not in the count. */
      _count: {
        select: {
          orders: true,
          handoutWishlist: { where: { handout: handoutOnShelf } },
        },
      },
    },
  });

  const bought = await prisma.handoutOrderItem.aggregate({
    _sum: { quantity: true },
    where: { order: { customerId: row.id, status: { not: "cancelled" } } },
  });

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birthDate?.toISOString().slice(0, 10) ?? "",
    memberSince: storeDateKey(row.createdAt),
    status: row.status,
    preferences: {
      newsletter: row.newsletterOptIn,
      offers: row.offersOptIn,
    },
    addresses: row.addresses.map(toAddress),
    stats: {
      orders: row._count.orders,
      wishlist: row._count.handoutWishlist,
      copiesBought: bought._sum.quantity ?? 0,
    },
  };
}

export async function getHandoutCart(): Promise<CartLineWithHandout[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.handoutCartItem.findMany({
    where: { customerId, handout: handoutOnShelf },
    include: { handout: { include: handoutInclude } },
  });

  return rows.map((row) => {
    const handout = toHandout(row.handout);
    return {
      handoutId: row.handoutId,
      quantity: row.quantity,
      handout,
      lineTotal: handout.price * row.quantity,
    };
  });
}

/** Just the number the header badge shows; cheap enough to call per request. */
export async function getCartCount(): Promise<number> {
  const customerId = await optionalCustomerId();
  if (!customerId) return 0;

  const cart = await prisma.handoutCartItem.aggregate({
    _sum: { quantity: true },
    where: { customerId },
  });

  return cart._sum.quantity ?? 0;
}

/** The saved ids, for the hearts the catalogue renders statically. */
export async function getWishlistIds(): Promise<string[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.handoutWishlistItem.findMany({
    where: { customerId },
    select: { handoutId: true },
  });

  return rows.map((row) => row.handoutId);
}

export async function getHandoutWishlist(): Promise<HandoutWithRelations[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.handoutWishlistItem.findMany({
    where: { customerId, handout: handoutOnShelf },
    include: { handout: { include: handoutInclude } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => toHandout(row.handout));
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { customerId: await currentCustomerId() },
    include: { handoutItems: true, timeline: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toOrder);
}

/** Scoped to the signed-in reader: one customer cannot open another's order. */
export async function getOrderById(id: string): Promise<Order | undefined> {
  const row = await prisma.order.findFirst({
    where: {
      customerId: await currentCustomerId(),
      OR: [{ id }, { reference: id }],
    },
    include: { handoutItems: true, timeline: true },
  });

  return row ? toOrder(row) : undefined;
}

/** The lines of an order joined with their handouts, for detail and summary views. */
export async function getOrderHandoutItems(order: Order) {
  const rows = await prisma.handoutOrderItem.findMany({
    where: { orderId: order.id },
    include: { handout: { include: handoutInclude } },
  });

  return rows.map((row) => ({
    handoutId: row.handoutId,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    // As they read when the order was placed, not as the handout reads now.
    title: { ar: row.titleAr },
    authorName: { ar: row.authorNameAr },
    handout: toHandout(row.handout),
    lineTotal: row.unitPrice * row.quantity,
  }));
}

/** The signed-in reader's own handout reviews, joined with their handouts. */
export async function getCustomerHandoutReviews() {
  const rows = await prisma.handoutReview.findMany({
    where: { customerId: await currentCustomerId() },
    include: {
      customer: { select: { name: true } },
      handout: { include: handoutInclude },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...toHandoutReviewWithStatus(row),
    handout: toHandout(row.handout),
  }));
}

export async function getAddressById(id: string) {
  const row = await prisma.address.findFirst({
    where: { id, customerId: await currentCustomerId() },
  });
  return row ? toAddress(row) : undefined;
}

export async function getAddressIds() {
  const rows = await prisma.address.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export interface AdminListQuery {
  q?: string;
  status?: string;
  page?: number;
  perPage?: number;
  /** Column key from the URL. Unknown values fall back to the default. */
  sort?: string;
}

/**
 * Sorting for the admin tables.
 *
 * The key arrives from a query string, so it is looked up in a fixed map
 * rather than passed to Prisma: an unrecognised value falls back to the
 * table's default ordering instead of reaching the database.
 */
export type AdminSortDirection = "asc" | "desc";

function adminOrderBy<T>(
  map: Record<string, T>,
  key: string | undefined,
  fallback: T,
): T {
  // `Object.hasOwn`, not a plain lookup: `?sort=constructor` would otherwise
  // reach through to Object.prototype and hand Prisma something that is not
  // an ordering at all.
  return key && Object.hasOwn(map, key) ? map[key] : fallback;
}

const handoutAdminSort: Record<string, Prisma.HandoutOrderByWithRelationInput> = {
  "title-asc": { titleAr: "asc" },
  "title-desc": { titleAr: "desc" },
  "price-asc": { price: "asc" },
  "price-desc": { price: "desc" },
  "stock-asc": { stock: "asc" },
  "stock-desc": { stock: "desc" },
  "rating-asc": { rating: "asc" },
  "rating-desc": { rating: "desc" },
  "created-asc": { createdAt: "asc" },
  "created-desc": { createdAt: "desc" },
};

const orderAdminSort: Record<string, Prisma.OrderOrderByWithRelationInput> = {
  "created-asc": { createdAt: "asc" },
  "created-desc": { createdAt: "desc" },
  "total-asc": { total: "asc" },
  "total-desc": { total: "desc" },
  "status-asc": { status: "asc" },
  "status-desc": { status: "desc" },
};

const customerAdminSort: Record<string, Prisma.CustomerOrderByWithRelationInput> = {
  "name-asc": { name: "asc" },
  "name-desc": { name: "desc" },
  "created-asc": { createdAt: "asc" },
  "created-desc": { createdAt: "desc" },
};

const handoutReviewAdminSort: Record<string, Prisma.HandoutReviewOrderByWithRelationInput> = {
  "created-asc": { createdAt: "asc" },
  "created-desc": { createdAt: "desc" },
  "rating-asc": { rating: "asc" },
  "rating-desc": { rating: "desc" },
};

function paginationOf(total: number, query: AdminListQuery, fallback = 10) {
  const perPage = query.perPage ?? fallback;
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);

  return { perPage, pageCount, page, skip: (page - 1) * perPage };
}

function monthKey(date: Date) {
  return date.toISOString().slice(0, 7);
}

/**
 * Revenue and order counts per month for the last twelve months.
 *
 * Buckets are built in UTC because `monthKey` reads the UTC month: mixing
 * local-time boundaries with UTC keys shifts every bucket by one month in
 * any timezone east of Greenwich.
 */
export async function getSalesSeries() {
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));

  const rows = await prisma.order.findMany({
    where: { createdAt: { gte: from }, status: { not: "cancelled" } },
    select: { createdAt: true, total: true },
  });

  const buckets = new Map<string, { revenue: number; orders: number }>();
  for (let index = 0; index < 12; index += 1) {
    const date = new Date(
      Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + index, 1),
    );
    buckets.set(monthKey(date), { revenue: 0, orders: 0 });
  }

  for (const row of rows) {
    const bucket = buckets.get(monthKey(row.createdAt));
    if (!bucket) continue;
    bucket.revenue += row.total;
    bucket.orders += 1;
  }

  return [...buckets.entries()].map(([month, value]) => ({ month, ...value }));
}

/** Order lines of non-cancelled orders — the basis of every sales report. */
async function soldHandoutItems() {
  return prisma.handoutOrderItem.findMany({
    where: { order: { status: { not: "cancelled" } } },
    select: {
      quantity: true,
      unitPrice: true,
      handoutId: true,
      handout: { select: { categoryId: true } },
    },
  });
}

/** The five best sellers, for the dashboard, the reports page and the CSV export. */
export async function getTopHandouts() {
  const rows = await soldHandoutItems();
  const totals = new Map<string, { sold: number; revenue: number }>();

  for (const row of rows) {
    const entry = totals.get(row.handoutId) ?? { sold: 0, revenue: 0 };
    entry.sold += row.quantity;
    entry.revenue += row.quantity * row.unitPrice;
    totals.set(row.handoutId, entry);
  }

  const top = [...totals.entries()].sort((a, b) => b[1].sold - a[1].sold).slice(0, 5);

  const handouts = await prisma.handout.findMany({
    where: { id: { in: top.map(([handoutId]) => handoutId) } },
    include: handoutInclude,
  });

  return top.flatMap(([handoutId, value]) => {
    const handout = handouts.find((entry) => entry.id === handoutId);
    return handout
      ? [{ handoutId, sold: value.sold, revenue: value.revenue, handout: toHandout(handout) }]
      : [];
  });
}

/** Sold copies and revenue of one handout, for its admin page. */
export async function getHandoutSales(handoutId: string) {
  const rows = await prisma.handoutOrderItem.findMany({
    where: { handoutId, order: { status: { not: "cancelled" } } },
    select: { quantity: true, unitPrice: true },
  });

  return rows.reduce(
    (totals, row) => ({
      sold: totals.sold + row.quantity,
      revenue: totals.revenue + row.quantity * row.unitPrice,
    }),
    { sold: 0, revenue: 0 },
  );
}

/**
 * Sales by branch. Each branch's share includes the branches under it, so a
 * stage answers for its grades. "top" is the dashboard's view — the top-level
 * branches, largest first; "all" is every branch in tree order.
 */
export async function getHandoutCategoryShares(
  scope: "top" | "all" = "top",
): Promise<Array<CategoryShare & { category: HandoutCategoryNode }>> {
  const [rows, roots] = await Promise.all([soldHandoutItems(), loadHandoutCategoryTree()]);

  const own = new Map<string, number>();
  let grandTotal = 0;

  for (const row of rows) {
    const value = row.quantity * row.unitPrice;
    own.set(row.handout.categoryId, (own.get(row.handout.categoryId) ?? 0) + value);
    grandTotal += value;
  }

  const shareOf = (node: HandoutCategoryNode): number => {
    const value = subtreeOf(node).reduce((sum, entry) => sum + (own.get(entry.id) ?? 0), 0);
    return grandTotal ? Math.round((value / grandTotal) * 100) : 0;
  };

  const nodes = scope === "top" ? roots : flattenTree(roots);
  const shares = nodes.map((category) => ({
    categoryId: category.id,
    share: shareOf(category),
    category,
  }));

  return scope === "top" ? shares.sort((a, b) => b.share - a.share) : shares;
}

export async function getAdminStats() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );

  const [thisMonth, lastMonth, customersCount, titlesCount, customersBefore] =
    await Promise.all([
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: { createdAt: { gte: monthStart }, status: { not: "cancelled" } },
      }),
      prisma.order.aggregate({
        _sum: { total: true },
        _count: true,
        where: {
          createdAt: { gte: previousStart, lt: monthStart },
          status: { not: "cancelled" },
        },
      }),
      prisma.customer.count(),
      prisma.handout.count({ where: handoutOnShelf }),
      prisma.customer.count({ where: { createdAt: { lt: monthStart } } }),
    ]);

  const change = (current: number, previous: number) =>
    previous ? Math.round(((current - previous) / previous) * 1000) / 10 : 0;

  return {
    revenue: {
      value: thisMonth._sum.total ?? 0,
      change: change(thisMonth._sum.total ?? 0, lastMonth._sum.total ?? 0),
    },
    orders: {
      value: thisMonth._count,
      change: change(thisMonth._count, lastMonth._count),
    },
    customers: {
      value: customersCount,
      change: change(customersCount, customersBefore),
    },
    titles: { value: titlesCount, change: 0 },
  };
}

export async function getLowStockHandouts(limit = 5): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: handoutOnShelf,
    include: handoutInclude,
    orderBy: { stock: "asc" },
    take: limit,
  });

  return rows.map(toHandout);
}

function toCustomerSummary(
  row: {
    id: string;
    name: string;
    email: string;
    phone: string;
    city: string | null;
    createdAt: Date;
    status: CustomerStatus;
  },
  totals: { ordersCount: number; totalSpent: number },
): CustomerSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    city: { ar: row.city ?? "" },
    ordersCount: totals.ordersCount,
    totalSpent: totals.totalSpent,
    joinedAt: storeDateKey(row.createdAt),
    status: row.status,
  };
}

async function customerTotals(customerIds: string[]) {
  const grouped = await prisma.order.groupBy({
    by: ["customerId"],
    where: { customerId: { in: customerIds }, status: { not: "cancelled" } },
    _count: { _all: true },
    _sum: { total: true },
  });

  return new Map(
    grouped.map((row) => [
      row.customerId,
      { ordersCount: row._count._all, totalSpent: row._sum.total ?? 0 },
    ]),
  );
}

const orderStatuses: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export async function getAdminOrders(query: AdminListQuery = {}) {
  const where: Prisma.OrderWhereInput = {};

  if (query.status && orderStatuses.includes(query.status as OrderStatus)) {
    where.status = query.status as OrderStatus;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { reference: { contains: term, mode: "insensitive" } },
      { customerId: { in: await idsMatchingArabic("customers", term) } },
      { customer: { phone: { contains: term } } },
    ];
  }

  const total = await prisma.order.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.order.findMany({
    where,
    include: { handoutItems: true, timeline: true, customer: true },
    orderBy: adminOrderBy(orderAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });

  const totals = await customerTotals(rows.map((row) => row.customerId));

  return {
    items: rows.map((row) => ({
      ...toOrder(row),
      customerId: row.customerId,
      customer: toCustomerSummary(
        row.customer,
        totals.get(row.customerId) ?? { ordersCount: 0, totalSpent: 0 },
      ),
    })),
    total,
    page,
    pageCount,
  };
}

export async function getAdminOrderById(id: string) {
  const row = await prisma.order.findUnique({
    where: { id },
    include: { handoutItems: true, timeline: true, customer: true },
  });

  if (!row) return undefined;

  const totals = await customerTotals([row.customerId]);

  return {
    ...toOrder(row),
    customerId: row.customerId,
    customer: toCustomerSummary(
      row.customer,
      totals.get(row.customerId) ?? { ordersCount: 0, totalSpent: 0 },
    ),
  };
}

export async function getAdminOrderIds() {
  const rows = await prisma.order.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function getOrderCounts() {
  const grouped = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));

  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    pending: byStatus.get("pending") ?? 0,
    processing: byStatus.get("processing") ?? 0,
    shipped: byStatus.get("shipped") ?? 0,
    delivered: byStatus.get("delivered") ?? 0,
    cancelled: byStatus.get("cancelled") ?? 0,
  };
}

export async function getCustomers(query: AdminListQuery = {}) {
  const where: Prisma.CustomerWhereInput = {};

  if (query.status === "active" || query.status === "blocked") {
    where.status = query.status;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { id: { in: await idsMatchingArabic("customers", term) } },
      { email: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
    ];
  }

  const total = await prisma.customer.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.customer.findMany({
    where,
    orderBy: adminOrderBy(customerAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });
  const totals = await customerTotals(rows.map((row) => row.id));

  const items = rows
    .map((row) =>
      toCustomerSummary(row, totals.get(row.id) ?? { ordersCount: 0, totalSpent: 0 }),
    )
    .sort((a, b) => b.totalSpent - a.totalSpent);

  return { items, total, page, pageCount };
}

export async function getCustomerById(id: string): Promise<CustomerSummary | undefined> {
  const row = await prisma.customer.findUnique({ where: { id } });
  if (!row) return undefined;

  const totals = await customerTotals([row.id]);
  return toCustomerSummary(row, totals.get(row.id) ?? { ordersCount: 0, totalSpent: 0 });
}

export async function getCustomerIds() {
  const rows = await prisma.customer.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function getCustomerCounts() {
  const grouped = await prisma.customer.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));

  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    active: byStatus.get("active") ?? 0,
    blocked: byStatus.get("blocked") ?? 0,
  };
}

/** Every order placed by one customer, newest first. */
export async function getOrdersByCustomer(customerId: string) {
  const rows = await prisma.order.findMany({
    where: { customerId },
    include: { handoutItems: true, timeline: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toOrder);
}

const reviewStatuses: ReviewStatus[] = ["pending", "published", "rejected"];

/** The review moderation queue. */
export async function getAdminHandoutReviews(query: AdminListQuery = {}) {
  const where: Prisma.HandoutReviewWhereInput = {};

  if (query.status && reviewStatuses.includes(query.status as ReviewStatus)) {
    where.status = query.status as ReviewStatus;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { customerId: { in: await idsMatchingArabic("customers", term) } },
      { handoutId: { in: await searchHandoutIds(term) } },
    ];
  }

  const total = await prisma.handoutReview.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.handoutReview.findMany({
    where,
    include: { customer: { select: { name: true } }, handout: true },
    orderBy: adminOrderBy(handoutReviewAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });

  const items: HandoutReviewWithStatus[] = rows.map(toHandoutReviewWithStatus);
  return { items, total, page, pageCount };
}

export async function getHandoutReviewCounts() {
  const grouped = await prisma.handoutReview.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));

  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    pending: byStatus.get("pending") ?? 0,
    published: byStatus.get("published") ?? 0,
    rejected: byStatus.get("rejected") ?? 0,
  };
}

/** The handout table's tabs: stock levels of what is on sale, then the archive. */
export type StockFilter = "all" | "inStock" | "low" | "out" | "archived";

/** Handout listing for the admin table — searchable and stock-aware. */
export async function getAdminHandouts(
  query: AdminListQuery & { stock?: StockFilter } = {},
) {
  const where: Prisma.HandoutWhereInput = await handoutWhere({ q: query.q });

  if (query.stock === "archived") where.archivedAt = { not: null };
  else if (query.stock === "inStock") where.stock = { gt: LOW_STOCK_THRESHOLD };
  else if (query.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };
  else if (query.stock === "out") where.stock = 0;

  const total = await prisma.handout.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.handout.findMany({
    where,
    include: handoutInclude,
    orderBy: adminOrderBy(handoutAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });

  return { items: rows.map(toHandout), total, page, pageCount };
}

export async function getHandoutStockCounts() {
  const [all, inStock, low, out, archived] = await Promise.all([
    prisma.handout.count({ where: handoutOnShelf }),
    prisma.handout.count({ where: { ...handoutOnShelf, stock: { gt: LOW_STOCK_THRESHOLD } } }),
    prisma.handout.count({ where: { ...handoutOnShelf, stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.handout.count({ where: { ...handoutOnShelf, stock: 0 } }),
    prisma.handout.count({ where: { archivedAt: { not: null } } }),
  ]);

  return { all, inStock, low, out, archived };
}

/* ------------------------------------------------------------------ */
/* Publishers                                                          */
/* ------------------------------------------------------------------ */

/** What the press has on the shelf. */
const publisherInclude = {
  _count: { select: { handouts: { where: handoutOnShelf } } },
} as const;

export async function getPublishers(): Promise<Publisher[]> {
  const rows = await prisma.publisher.findMany({
    include: publisherInclude,
    orderBy: [{ handouts: { _count: "desc" } }, { nameAr: "asc" }],
  });

  return rows.map(toPublisher);
}

export const getPublisherBySlug = cache(async (slug: string): Promise<Publisher | null> => {
  const row = await prisma.publisher.findUnique({
    where: { slug },
    include: publisherInclude,
  });

  return row ? toPublisher(row) : null;
});

export async function getPublisherById(id: string): Promise<Publisher | null> {
  const row = await prisma.publisher.findUnique({
    where: { id },
    include: publisherInclude,
  });

  return row ? toPublisher(row) : null;
}

/** Publishers in the order their ids were given — the panel's order, like `getHandoutsByIds`. */
export async function getPublishersByIds(ids: string[]): Promise<Publisher[]> {
  if (!ids.length) return [];

  const rows = await prisma.publisher.findMany({
    where: { id: { in: ids } },
    include: publisherInclude,
  });
  const byId = new Map(rows.map((row) => [row.id, toPublisher(row)]));

  return ids.flatMap((id) => {
    const publisher = byId.get(id);
    return publisher ? [publisher] : [];
  });
}

type PublisherRowWithCounts = Prisma.PublisherGetPayload<{
  include: typeof publisherInclude;
}>;

/**
 * Most handouts first, then by name, so equals keep one order between
 * renders: Postgres hands ties back in whatever order the plan produced.
 */
function byCatalogueSize(a: PublisherRowWithCounts, b: PublisherRowWithCounts): number {
  return b._count.handouts - a._count.handouts || a.nameAr.localeCompare(b.nameAr, "ar");
}

/** The publishers with the most titles, leaving out any with nothing to shelve. */
export async function getFeaturedPublishers(limit?: number): Promise<Publisher[]> {
  const rows = await prisma.publisher.findMany({ include: publisherInclude });

  const ranked = rows.filter((row) => row._count.handouts > 0).sort(byCatalogueSize);

  return (typeof limit === "number" ? ranked.slice(0, limit) : ranked).map(toPublisher);
}

/** The publishers section: the panel's picks, or the presses with the most titles. */
export async function getShelfPublishers(content: ShelfContent): Promise<Publisher[]> {
  return resolveShelf(content, getPublishersByIds, getFeaturedPublishers);
}

/** One publisher's shelf on the home page; it may be empty. */
export interface PublisherShelf {
  publisher: Publisher;
  handouts: HandoutWithRelations[];
}

/**
 * Each publisher's latest handouts, up to `size`, in the order the
 * publishers were given. Fetched from the publisher side so that one query
 * serves every shelf, however many presses the panel shows; the nested rows
 * carry the same relations the catalogue's do.
 */
export async function getPublisherShelves(
  publishers: Publisher[],
  size: number,
): Promise<PublisherShelf[]> {
  if (!publishers.length) return [];

  const rows = await prisma.publisher.findMany({
    where: { id: { in: publishers.map((publisher) => publisher.id) } },
    include: {
      handouts: {
        where: handoutOnShelf,
        include: handoutInclude,
        orderBy: { createdAt: "desc" },
        take: size,
      },
    },
  });
  const byId = new Map(rows.map((row) => [row.id, row]));

  return publishers.flatMap((publisher) => {
    const row = byId.get(publisher.id);
    return row
      ? [{ publisher, handouts: row.handouts.map(toHandout) }]
      : [];
  });
}

/**
 * What the publisher picker searches through, ranked the way the section's
 * own rule is, so that with nothing typed the list opens on the presses the
 * rule would show, each with its handout count under the name.
 */
export async function searchPublisherPicks(
  term: string,
  handoutsLabel: string,
  exclude: string[] = [],
  limit = 8,
): Promise<PickOption[]> {
  const rows = await prisma.publisher.findMany({
    where: {
      id: {
        notIn: exclude,
        ...(term.trim() ? { in: await idsMatchingArabic("publishers", term.trim()) } : {}),
      },
    },
    include: publisherInclude,
  });

  return rows
    .sort(byCatalogueSize)
    .slice(0, limit)
    .map((row) => ({
      id: row.id,
      label: row.nameAr,
      sublabel: `${row._count.handouts} ${handoutsLabel}`,
      seed: row.slug,
      picture: { kind: "mark" },
    }));
}

/* ------------------------------------------------------------------ */
/* Store settings                                                      */
/* ------------------------------------------------------------------ */

/** Every saved setting as a flat map; absent keys fall back to the constants. */
export async function getStoreSettings(): Promise<Record<string, string>> {
  const rows = await prisma.storeSetting.findMany();

  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

export interface StoreIdentity {
  name: Localized;
  tagline: Localized;
  email: string;
  phone: string;
  address: string;
}

/**
 * The store's own name and contact details. Every field is empty until the
 * settings screen fills it, so callers fall back to the shipped copy.
 */
export async function getStoreIdentity(): Promise<StoreIdentity> {
  const settings = await getStoreSettings();

  return {
    name: { ar: settings.nameAr ?? "" },
    tagline: { ar: settings.taglineAr ?? "" },
    email: settings.email ?? "",
    phone: settings.phone ?? "",
    address: settings.address ?? "",
  };
}

/** The payment method the checkout page preselects. */
export async function getDefaultPaymentMethod(): Promise<string> {
  const settings = await getStoreSettings();
  return settings.paymentDefault || "cod";
}

export interface ShippingRules {
  standardCost: number;
  expressCost: number;
  freeThreshold: number;
  estimatedDays: string;
  enablePickup: boolean;
}

/**
 * The shipping numbers actually charged. The admin screen writes them, and
 * the constants above are the defaults until it does.
 */
export async function getShippingRules(): Promise<ShippingRules> {
  const settings = await getStoreSettings();

  const money = (key: string, fallback: number) => {
    const parsed = Number(settings[key]);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  };

  return {
    standardCost: money("standardCost", STANDARD_SHIPPING_COST),
    expressCost: money("expressCost", EXPRESS_SHIPPING_COST),
    freeThreshold: money("freeThreshold", FREE_SHIPPING_THRESHOLD),
    estimatedDays: settings.estimatedDays || "2-5",
    enablePickup: settings.enablePickup !== "false",
  };
}

/**
 * Which of the home page's sections the store is showing. A section is on
 * until the settings screen switches it off, so a store that has never
 * opened that tab renders the whole page.
 */
export async function getHomeSections(): Promise<HomeSectionVisibility> {
  return homeVisibility(await getStoreSettings());
}

/* ------------------------------------------------------------------ */
/* Messages and subscribers                                            */
/* ------------------------------------------------------------------ */

const contactStatuses: ContactStatus[] = ["new", "read"];

export async function getContactMessages(query: AdminListQuery = {}) {
  const where: Prisma.ContactMessageWhereInput = {};

  if (query.status && contactStatuses.includes(query.status as ContactStatus)) {
    where.status = query.status as ContactStatus;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { id: { in: await idsMatchingArabic("contact_messages", term) } },
      { email: { contains: term, mode: "insensitive" } },
    ];
  }

  const total = await prisma.contactMessage.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.contactMessage.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
  });

  const items: ContactMessage[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    subject: row.subject,
    message: row.message,
    status: row.status,
    createdAt: storeDateKey(row.createdAt),
  }));

  return { items, total, page, pageCount };
}

export async function getContactMessageCounts() {
  const grouped = await prisma.contactMessage.groupBy({
    by: ["status"],
    _count: { _all: true },
  });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));

  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    new: byStatus.get("new") ?? 0,
    read: byStatus.get("read") ?? 0,
  };
}

export async function getNewsletterSubscribers(query: AdminListQuery = {}) {
  const where: Prisma.NewsletterSubscriberWhereInput = query.q?.trim()
    ? { email: { contains: query.q.trim(), mode: "insensitive" } }
    : {};

  const total = await prisma.newsletterSubscriber.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.newsletterSubscriber.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip,
    take: perPage,
  });

  const items: NewsletterSubscriber[] = rows.map((row) => ({
    email: row.email,
    locale: row.locale,
    createdAt: storeDateKey(row.createdAt),
  }));

  return { items, total, page, pageCount };
}

/* ------------------------------------------------------------------ */
/* Coupons                                                             */
/* ------------------------------------------------------------------ */

function toCoupon(row: {
  id: string;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minSubtotal: number;
  active: boolean;
  expiresAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
}): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    minSubtotal: row.minSubtotal,
    active: row.active,
    expiresAt: row.expiresAt ? storeDateKey(row.expiresAt) : "",
    usageLimit: row.usageLimit,
    usedCount: row.usedCount,
  };
}

export async function getCoupons(): Promise<Coupon[]> {
  const rows = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return rows.map(toCoupon);
}

export async function getCouponById(id: string): Promise<Coupon | null> {
  const row = await prisma.coupon.findUnique({ where: { id } });

  return row ? toCoupon(row) : null;
}

/* ------------------------------------------------------------------ */
/* Manager notifications                                               */
/* ------------------------------------------------------------------ */

/** How many rows of each kind the bell lists before it stops. */
const NOTIFICATIONS_PER_KIND = 5;

/**
 * What is waiting for the manager right now, limited to the kinds the
 * settings screen has switched on. The count is the true outstanding total,
 * not a tally of unread messages: acting on something removes it from here.
 */
export async function getAdminNotifications(): Promise<{
  items: AdminNotification[];
  total: number;
}> {
  const settings = await getStoreSettings();
  const wants = (key: string) => settings[key] !== "false";

  const [orders, handoutReviews, handouts, orderTotal, handoutReviewTotal, stockTotal] =
    await Promise.all([
      wants("notifyOrders")
        ? prisma.order.findMany({
            where: { status: "pending" },
            include: { customer: { select: { name: true } } },
            orderBy: { createdAt: "desc" },
            take: NOTIFICATIONS_PER_KIND,
          })
        : [],
      wants("notifyReviews")
        ? prisma.handoutReview.findMany({
            where: { status: "pending" },
            include: {
              customer: { select: { name: true } },
              handout: { select: { titleAr: true } },
            },
            orderBy: { createdAt: "desc" },
            take: NOTIFICATIONS_PER_KIND,
          })
        : [],
      wants("notifyStock")
        ? prisma.handout.findMany({
            where: { ...handoutOnShelf, stock: { lte: LOW_STOCK_THRESHOLD } },
            orderBy: { stock: "asc" },
            take: NOTIFICATIONS_PER_KIND,
          })
        : [],
      wants("notifyOrders")
        ? prisma.order.count({ where: { status: "pending" } })
        : 0,
      wants("notifyReviews")
        ? prisma.handoutReview.count({ where: { status: "pending" } })
        : 0,
      wants("notifyStock")
        ? prisma.handout.count({ where: { ...handoutOnShelf, stock: { lte: LOW_STOCK_THRESHOLD } } })
        : 0,
    ]);

  const items: AdminNotification[] = [
    ...orders.map((order) => ({
      id: `order-${order.id}`,
      kind: "order" as const,
      label: order.reference,
      detail: order.customer.name,
      href: `/admin/orders/${order.id}`,
      at: order.createdAt.toISOString(),
    })),
    ...handoutReviews.map((review) => ({
      id: `handout-review-${review.id}`,
      kind: "review" as const,
      label: review.handout.titleAr,
      detail: review.customer.name,
      href: `/admin/handout-reviews?status=pending`,
      at: review.createdAt.toISOString(),
    })),
    ...handouts.map((handout) => ({
      id: `stock-${handout.id}`,
      kind: "stock" as const,
      label: handout.titleAr,
      detail: String(handout.stock),
      href: `/admin/handouts/${handout.id}`,
      at: handout.updatedAt.toISOString(),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return {
    items,
    total: orderTotal + handoutReviewTotal + stockTotal,
  };
}
