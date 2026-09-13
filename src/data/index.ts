import {
  toAddress,
  toAuthor,
  toBook,
  toCategoryWithCount,
  toHandout,
  toOrder,
  toPublisher,
  toReviewWithAuthor,
  toReviewWithStatus,
} from "@/data/mappers";
import type { Prisma } from "@/generated/prisma/client";
import { getCurrentCustomer } from "@/lib/auth";
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
  BookWithRelations,
  CartLineWithBook,
  Category,
  CoverType,
  Customer,
  CustomerStatus,
  CustomerSummary,
  HandoutWithRelations,
  Order,
  OrderStatus,
  Publisher,
  Review,
  ReviewStatus,
  ReviewWithStatus,
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
export const BOOKS_PER_PAGE = 12;
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

const bookInclude = { author: true, category: true, publisher: true } as const;

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
  cover?: CoverType;
  inStock?: boolean;
  onSale?: boolean;
  sort?: SortKey;
  page?: number;
  perPage?: number;
}

export interface BookQueryResult {
  items: BookWithRelations[];
  total: number;
  page: number;
  pageCount: number;
}

const orderByForSort: Record<SortKey, Prisma.BookOrderByWithRelationInput> = {
  relevance: { reviewsCount: "desc" },
  popular: { reviewsCount: "desc" },
  newest: { createdAt: "desc" },
  priceAsc: { price: "asc" },
  priceDesc: { price: "desc" },
  rating: { rating: "desc" },
};

function bookWhere(query: BookQuery): Prisma.BookWhereInput {
  const where: Prisma.BookWhereInput = {};

  if (query.q?.trim()) {
    const term = query.q.trim();
    /*
     * The English columns were dropped with the English site, so a search for
     * a Latin-script title no longer matches on the title itself. The ISBN
     * clause is what still answers those queries, and the seeded slugs are
     * Latin too — a reader who types "1984" or an ISBN still finds the book.
     */
    where.OR = [
      { titleAr: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      { isbn: { contains: term } },
      { publisher: { nameAr: { contains: term, mode: "insensitive" } } },
      { author: { nameAr: { contains: term, mode: "insensitive" } } },
      { category: { nameAr: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (query.category) where.category = { slug: query.category };
  if (query.author) where.author = { slug: query.author };
  if (query.publisher) where.publisher = { slug: query.publisher };
  if (query.cover) where.coverType = query.cover;
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

/** The single entry point behind listing, category, search and offers pages. */
export async function queryBooks(query: BookQuery = {}): Promise<BookQueryResult> {
  const perPage = query.perPage ?? BOOKS_PER_PAGE;
  const where = bookWhere(query);

  const total = await prisma.book.count({ where });
  const pageCount = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(Math.max(query.page ?? 1, 1), pageCount);

  const rows = await prisma.book.findMany({
    where,
    include: bookInclude,
    orderBy: orderByForSort[query.sort ?? "relevance"],
    skip: (page - 1) * perPage,
    take: perPage,
  });

  return { items: rows.map(toBook), total, page, pageCount };
}

export async function getPriceBounds() {
  const result = await prisma.book.aggregate({
    _min: { price: true },
    _max: { price: true },
  });

  return { min: result._min.price ?? 0, max: result._max.price ?? 0 };
}

/* ------------------------------------------------------------------ */
/* Catalogue                                                           */
/* ------------------------------------------------------------------ */

export async function getCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    orderBy: { books: { _count: "desc" } },
    include: { _count: { select: { books: true } } },
  });

  return rows.map(toCategoryWithCount);
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { books: true } } },
  });

  return row ? toCategoryWithCount(row) : undefined;
}

export async function getCategoryById(id: string): Promise<Category | undefined> {
  const row = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });

  return row ? toCategoryWithCount(row) : undefined;
}

export async function getCategoryIds() {
  const rows = await prisma.category.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function getAuthors(limit?: number): Promise<Author[]> {
  const rows = await prisma.author.findMany({
    orderBy: { books: { _count: "desc" } },
    include: { _count: { select: { books: true } } },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return rows.map(toAuthor);
}

export async function getAuthorBySlug(slug: string): Promise<Author | undefined> {
  const row = await prisma.author.findUnique({
    where: { slug },
    include: { _count: { select: { books: true } } },
  });

  return row ? toAuthor(row) : undefined;
}

export async function getAuthorById(id: string): Promise<Author | undefined> {
  const row = await prisma.author.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });

  return row ? toAuthor(row) : undefined;
}

export async function getAuthorIds() {
  const rows = await prisma.author.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function getBooks(limit?: number): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    include: bookInclude,
    orderBy: { createdAt: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return rows.map(toBook);
}

export async function getBooksByTag(
  tag: BookTag,
  limit?: number,
): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    where: { tags: { has: tag } },
    include: bookInclude,
    orderBy: { reviewsCount: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return rows.map(toBook);
}

export async function getNewArrivals(limit = 8): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    include: bookInclude,
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map(toBook);
}

export async function getBestsellers(limit = 10): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    where: { tags: { has: "bestseller" } },
    include: bookInclude,
    orderBy: { reviewsCount: "desc" },
    take: limit,
  });

  return rows.map(toBook);
}

export async function getDiscountedBooks(limit?: number): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    where: { compareAtPrice: { not: null } },
    include: bookInclude,
    orderBy: { createdAt: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return rows.map(toBook);
}

export async function getBookBySlug(
  slug: string,
): Promise<BookWithRelations | undefined> {
  const row = await prisma.book.findUnique({ where: { slug }, include: bookInclude });
  return row ? toBook(row) : undefined;
}

export async function getBookById(id: string): Promise<BookWithRelations | undefined> {
  const row = await prisma.book.findUnique({ where: { id }, include: bookInclude });
  return row ? toBook(row) : undefined;
}

export async function getBookSlugs(): Promise<string[]> {
  const rows = await prisma.book.findMany({ select: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getBookIds(): Promise<string[]> {
  const rows = await prisma.book.findMany({ select: { id: true } });
  return rows.map((row) => row.id);
}

export async function getRelatedBooks(
  book: BookWithRelations,
  limit = 5,
): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    where: { categoryId: book.categoryId, id: { not: book.id } },
    include: bookInclude,
    orderBy: { reviewsCount: "desc" },
    take: limit,
  });

  return rows.map(toBook);
}

/* ------------------------------------------------------------------ */
/* Handouts                                                            */
/* ------------------------------------------------------------------ */

/*
 * The lecture-note catalogue (ملازم) is the book catalogue over again: the same
 * columns, the same filters, the same sort keys, read from its own table. It
 * is copied rather than parameterised on purpose — the two are meant to be
 * managed apart, and a shared query would be the first thing to couple them.
 */

const handoutInclude = { author: true, category: true, publisher: true } as const;

/** Same filter set as the books listing; the two forms are interchangeable. */
export type HandoutQuery = BookQuery;

export interface HandoutQueryResult {
  items: HandoutWithRelations[];
  total: number;
  page: number;
  pageCount: number;
}

const handoutOrderByForSort: Record<SortKey, Prisma.HandoutOrderByWithRelationInput> = {
  relevance: { reviewsCount: "desc" },
  popular: { reviewsCount: "desc" },
  newest: { createdAt: "desc" },
  priceAsc: { price: "asc" },
  priceDesc: { price: "desc" },
  rating: { rating: "desc" },
};

function handoutWhere(query: HandoutQuery): Prisma.HandoutWhereInput {
  const where: Prisma.HandoutWhereInput = {};

  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { titleAr: { contains: term, mode: "insensitive" } },
      { slug: { contains: term, mode: "insensitive" } },
      { isbn: { contains: term } },
      { publisher: { nameAr: { contains: term, mode: "insensitive" } } },
      { author: { nameAr: { contains: term, mode: "insensitive" } } },
      { category: { nameAr: { contains: term, mode: "insensitive" } } },
    ];
  }

  if (query.category) where.category = { slug: query.category };
  if (query.author) where.author = { slug: query.author };
  if (query.publisher) where.publisher = { slug: query.publisher };
  if (query.cover) where.coverType = query.cover;
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

/** The single entry point behind the handouts listing. */
export async function queryHandouts(query: HandoutQuery = {}): Promise<HandoutQueryResult> {
  const perPage = query.perPage ?? HANDOUTS_PER_PAGE;
  const where = handoutWhere(query);

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
    _min: { price: true },
    _max: { price: true },
  });

  return { min: result._min.price ?? 0, max: result._max.price ?? 0 };
}

export async function getHandoutBySlug(
  slug: string,
): Promise<HandoutWithRelations | undefined> {
  const row = await prisma.handout.findUnique({ where: { slug }, include: handoutInclude });
  return row ? toHandout(row) : undefined;
}

export async function getHandoutById(id: string): Promise<HandoutWithRelations | undefined> {
  const row = await prisma.handout.findUnique({ where: { id }, include: handoutInclude });
  return row ? toHandout(row) : undefined;
}

export async function getHandoutSlugs(): Promise<string[]> {
  const rows = await prisma.handout.findMany({ select: { slug: true } });
  return rows.map((row) => row.slug);
}

export async function getRelatedHandouts(
  handout: HandoutWithRelations,
  limit = 5,
): Promise<HandoutWithRelations[]> {
  const rows = await prisma.handout.findMany({
    where: { categoryId: handout.categoryId, id: { not: handout.id } },
    include: handoutInclude,
    orderBy: { reviewsCount: "desc" },
    take: limit,
  });

  return rows.map(toHandout);
}

export async function getReviewsByBook(bookId: string): Promise<Review[]> {
  const rows = await prisma.review.findMany({
    where: { bookId, status: "published" },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toReviewWithAuthor);
}

export async function getStoreStats() {
  const [booksCount, authorsCount, categoriesCount, publishersCount] =
    await Promise.all([
      prisma.book.count(),
      prisma.author.count(),
      prisma.category.count(),
      prisma.publisher.count(),
    ]);

  return {
    booksCount,
    authorsCount,
    publishersCount,
    categoriesCount,
  };
}

/* ------------------------------------------------------------------ */
/* Account — the signed-in reader                                      */
/* ------------------------------------------------------------------ */

export async function getCustomer(): Promise<Customer> {
  const row = await prisma.customer.findUniqueOrThrow({
    where: { id: await currentCustomerId() },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      _count: { select: { orders: true, wishlist: true } },
    },
  });

  const bought = await prisma.orderItem.aggregate({
    _sum: { quantity: true },
    where: { order: { customerId: row.id, status: { not: "cancelled" } } },
  });

  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    birthDate: row.birthDate?.toISOString().slice(0, 10) ?? "",
    memberSince: row.createdAt.toISOString().slice(0, 10),
    preferences: {
      newsletter: row.newsletterOptIn,
      offers: row.offersOptIn,
    },
    addresses: row.addresses.map(toAddress),
    stats: {
      orders: row._count.orders,
      wishlist: row._count.wishlist,
      booksBought: bought._sum.quantity ?? 0,
    },
  };
}

export async function getCart(): Promise<CartLineWithBook[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.cartItem.findMany({
    where: { customerId },
    include: { book: { include: bookInclude } },
  });

  return rows.map((row) => {
    const book = toBook(row.book);
    return {
      bookId: row.bookId,
      quantity: row.quantity,
      book,
      lineTotal: book.price * row.quantity,
    };
  });
}

/** Just the number the header badge shows; cheap enough to call per request. */
export async function getCartCount(): Promise<number> {
  const customerId = await optionalCustomerId();
  if (!customerId) return 0;

  const total = await prisma.cartItem.aggregate({
    _sum: { quantity: true },
    where: { customerId },
  });

  return total._sum.quantity ?? 0;
}

/** The saved book ids, for the hearts the catalogue renders statically. */
export async function getWishlistIds(): Promise<string[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.wishlistItem.findMany({
    where: { customerId },
    select: { bookId: true },
  });

  return rows.map((row) => row.bookId);
}

export async function getWishlist(): Promise<BookWithRelations[]> {
  const customerId = await optionalCustomerId();
  if (!customerId) return [];

  const rows = await prisma.wishlistItem.findMany({
    where: { customerId },
    include: { book: { include: bookInclude } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => toBook(row.book));
}

export async function getOrders(): Promise<Order[]> {
  const rows = await prisma.order.findMany({
    where: { customerId: await currentCustomerId() },
    include: { items: true, timeline: true },
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
    include: { items: true, timeline: true },
  });

  return row ? toOrder(row) : undefined;
}

/** Order lines joined with their books for detail and summary views. */
export async function getOrderItems(order: Order) {
  const rows = await prisma.orderItem.findMany({
    where: { orderId: order.id },
    include: { book: { include: bookInclude } },
  });

  return rows.map((row) => ({
    bookId: row.bookId,
    quantity: row.quantity,
    unitPrice: row.unitPrice,
    book: toBook(row.book),
    lineTotal: row.unitPrice * row.quantity,
  }));
}

/** The signed-in reader's own reviews, joined with their books. */
export async function getCustomerReviews() {
  const rows = await prisma.review.findMany({
    where: { customerId: await currentCustomerId() },
    include: {
      customer: { select: { name: true } },
      book: { include: bookInclude },
    },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    ...toReviewWithStatus(row),
    book: toBook(row.book),
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

const bookAdminSort: Record<string, Prisma.BookOrderByWithRelationInput> = {
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

const reviewAdminSort: Record<string, Prisma.ReviewOrderByWithRelationInput> = {
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
async function soldItems() {
  return prisma.orderItem.findMany({
    where: { order: { status: { not: "cancelled" } } },
    select: {
      quantity: true,
      unitPrice: true,
      bookId: true,
      book: { select: { categoryId: true } },
    },
  });
}

export async function getTopBooks() {
  const rows = await soldItems();
  const totals = new Map<string, { sold: number; revenue: number }>();

  for (const row of rows) {
    const entry = totals.get(row.bookId) ?? { sold: 0, revenue: 0 };
    entry.sold += row.quantity;
    entry.revenue += row.quantity * row.unitPrice;
    totals.set(row.bookId, entry);
  }

  const top = [...totals.entries()].sort((a, b) => b[1].sold - a[1].sold).slice(0, 5);

  const books = await prisma.book.findMany({
    where: { id: { in: top.map(([bookId]) => bookId) } },
    include: bookInclude,
  });

  return top.flatMap(([bookId, value]) => {
    const book = books.find((entry) => entry.id === bookId);
    return book
      ? [{ bookId, sold: value.sold, revenue: value.revenue, book: toBook(book) }]
      : [];
  });
}

export async function getCategoryShares() {
  const [rows, categories] = await Promise.all([soldItems(), getCategories()]);

  const totals = new Map<string, number>();
  let grandTotal = 0;

  for (const row of rows) {
    const value = row.quantity * row.unitPrice;
    totals.set(row.book.categoryId, (totals.get(row.book.categoryId) ?? 0) + value);
    grandTotal += value;
  }

  return categories
    .map((category) => ({
      categoryId: category.id,
      share: grandTotal
        ? Math.round(((totals.get(category.id) ?? 0) / grandTotal) * 100)
        : 0,
      category,
    }))
    .sort((a, b) => b.share - a.share);
}

export async function getAdminStats() {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const previousStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1),
  );

  const [thisMonth, lastMonth, customersCount, booksCount, customersBefore] =
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
      prisma.book.count(),
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
    books: { value: booksCount, change: 0 },
  };
}

export async function getLowStockBooks(limit = 5): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    include: bookInclude,
    orderBy: { stock: "asc" },
    take: limit,
  });

  return rows.map(toBook);
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
    joinedAt: row.createdAt.toISOString().slice(0, 10),
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
      { customer: { name: { contains: term, mode: "insensitive" } } },
      { customer: { phone: { contains: term } } },
    ];
  }

  const total = await prisma.order.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.order.findMany({
    where,
    include: { items: true, timeline: true, customer: true },
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
    include: { items: true, timeline: true, customer: true },
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
      { name: { contains: term, mode: "insensitive" } },
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
    include: { items: true, timeline: true },
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toOrder);
}

const reviewStatuses: ReviewStatus[] = ["pending", "published", "rejected"];

export async function getAdminReviews(query: AdminListQuery = {}) {
  const where: Prisma.ReviewWhereInput = {};

  if (query.status && reviewStatuses.includes(query.status as ReviewStatus)) {
    where.status = query.status as ReviewStatus;
  }
  if (query.q?.trim()) {
    const term = query.q.trim();
    where.OR = [
      { customer: { name: { contains: term, mode: "insensitive" } } },
      { book: { titleAr: { contains: term, mode: "insensitive" } } },
    ];
  }

  const total = await prisma.review.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.review.findMany({
    where,
    include: { customer: { select: { name: true } }, book: true },
    orderBy: adminOrderBy(reviewAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });

  const items: ReviewWithStatus[] = rows.map(toReviewWithStatus);
  return { items, total, page, pageCount };
}

export async function getReviewCounts() {
  const grouped = await prisma.review.groupBy({ by: ["status"], _count: { _all: true } });
  const byStatus = new Map(grouped.map((row) => [row.status, row._count._all]));

  return {
    all: grouped.reduce((total, row) => total + row._count._all, 0),
    pending: byStatus.get("pending") ?? 0,
    published: byStatus.get("published") ?? 0,
    rejected: byStatus.get("rejected") ?? 0,
  };
}

export type StockFilter = "all" | "inStock" | "low" | "out";

/** Catalogue listing for the admin table — searchable and stock-aware. */
export async function getAdminBooks(
  query: AdminListQuery & { stock?: StockFilter } = {},
) {
  const where: Prisma.BookWhereInput = bookWhere({ q: query.q });

  if (query.stock === "inStock") where.stock = { gt: LOW_STOCK_THRESHOLD };
  else if (query.stock === "low") where.stock = { gt: 0, lte: LOW_STOCK_THRESHOLD };
  else if (query.stock === "out") where.stock = 0;

  const total = await prisma.book.count({ where });
  const { perPage, pageCount, page, skip } = paginationOf(total, query);

  const rows = await prisma.book.findMany({
    where,
    include: bookInclude,
    orderBy: adminOrderBy(bookAdminSort, query.sort, { createdAt: "desc" }),
    skip,
    take: perPage,
  });

  return { items: rows.map(toBook), total, page, pageCount };
}

export async function getStockCounts() {
  const [all, inStock, low, out] = await Promise.all([
    prisma.book.count(),
    prisma.book.count({ where: { stock: { gt: LOW_STOCK_THRESHOLD } } }),
    prisma.book.count({ where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.book.count({ where: { stock: 0 } }),
  ]);

  return { all, inStock, low, out };
}

/** Handout listing for the admin table — searchable and stock-aware. */
export async function getAdminHandouts(
  query: AdminListQuery & { stock?: StockFilter } = {},
) {
  const where: Prisma.HandoutWhereInput = handoutWhere({ q: query.q });

  if (query.stock === "inStock") where.stock = { gt: LOW_STOCK_THRESHOLD };
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
  const [all, inStock, low, out] = await Promise.all([
    prisma.handout.count(),
    prisma.handout.count({ where: { stock: { gt: LOW_STOCK_THRESHOLD } } }),
    prisma.handout.count({ where: { stock: { gt: 0, lte: LOW_STOCK_THRESHOLD } } }),
    prisma.handout.count({ where: { stock: 0 } }),
  ]);

  return { all, inStock, low, out };
}

/* ------------------------------------------------------------------ */
/* Publishers                                                          */
/* ------------------------------------------------------------------ */

export async function getPublishers(): Promise<Publisher[]> {
  const rows = await prisma.publisher.findMany({
    include: { _count: { select: { books: true } } },
    orderBy: [{ books: { _count: "desc" } }, { nameAr: "asc" }],
  });

  return rows.map(toPublisher);
}

export async function getPublisherBySlug(slug: string): Promise<Publisher | null> {
  const row = await prisma.publisher.findUnique({
    where: { slug },
    include: { _count: { select: { books: true } } },
  });

  return row ? toPublisher(row) : null;
}

export async function getPublisherById(id: string): Promise<Publisher | null> {
  const row = await prisma.publisher.findUnique({
    where: { id },
    include: { _count: { select: { books: true } } },
  });

  return row ? toPublisher(row) : null;
}

export async function getBooksByPublisher(
  publisherId: string,
): Promise<BookWithRelations[]> {
  const rows = await prisma.book.findMany({
    where: { publisherId },
    include: bookInclude,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toBook);
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
      { name: { contains: term, mode: "insensitive" } },
      { email: { contains: term, mode: "insensitive" } },
      { subject: { contains: term, mode: "insensitive" } },
      { message: { contains: term, mode: "insensitive" } },
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
    createdAt: row.createdAt.toISOString().slice(0, 10),
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
    createdAt: row.createdAt.toISOString().slice(0, 10),
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
    expiresAt: row.expiresAt?.toISOString().slice(0, 10) ?? "",
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

  const [orders, reviews, books, orderTotal, reviewTotal, stockTotal] =
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
        ? prisma.review.findMany({
            where: { status: "pending" },
            include: {
              customer: { select: { name: true } },
              book: { select: { titleAr: true } },
            },
            orderBy: { createdAt: "desc" },
            take: NOTIFICATIONS_PER_KIND,
          })
        : [],
      wants("notifyStock")
        ? prisma.book.findMany({
            where: { stock: { lte: LOW_STOCK_THRESHOLD } },
            orderBy: { stock: "asc" },
            take: NOTIFICATIONS_PER_KIND,
          })
        : [],
      wants("notifyOrders")
        ? prisma.order.count({ where: { status: "pending" } })
        : 0,
      wants("notifyReviews")
        ? prisma.review.count({ where: { status: "pending" } })
        : 0,
      wants("notifyStock")
        ? prisma.book.count({ where: { stock: { lte: LOW_STOCK_THRESHOLD } } })
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
    ...reviews.map((review) => ({
      id: `review-${review.id}`,
      kind: "review" as const,
      label: review.book.titleAr,
      detail: review.customer.name,
      href: `/admin/reviews?status=pending`,
      at: review.createdAt.toISOString(),
    })),
    ...books.map((book) => ({
      id: `stock-${book.id}`,
      kind: "stock" as const,
      label: book.titleAr,
      detail: String(book.stock),
      href: `/admin/books/${book.id}`,
      at: book.updatedAt.toISOString(),
    })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return { items, total: orderTotal + reviewTotal + stockTotal };
}
