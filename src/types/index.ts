import type { Locale } from "@/i18n/config";

/** Every user-facing string in the mock data ships in both locales. */
export type Localized = Record<Locale, string>;

export type CoverType = "hardcover" | "paperback";

export type BookTag = "bestseller" | "new" | "featured" | "award";

export interface Category {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Lucide icon name rendered by the UI layer. */
  icon: string;
  booksCount: number;
}

export interface Author {
  id: string;
  slug: string;
  name: Localized;
  country: Localized;
  bio: Localized;
  booksCount: number;
  avatarUrl?: string;
}

export interface Publisher {
  id: string;
  slug: string;
  name: Localized;
  country: Localized;
  description: Localized;
  booksCount: number;
  foundedYear?: number;
}

export interface Book {
  id: string;
  slug: string;
  title: Localized;
  authorId: string;
  categoryId: string;
  /** Whole Iraqi dinars — no minor units. */
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewsCount: number;
  stock: number;
  pages: number;
  publisherId: string;
  publishedYear: number;
  isbn: string;
  language: Localized;
  coverType: CoverType;
  weightGrams: number;
  description: Localized;
  tags: BookTag[];
  /** Optional real cover; a typographic placeholder is drawn when absent. */
  coverUrl?: string;
  createdAt: string;
}

export interface Review {
  id: string;
  bookId: string;
  authorName: string;
  rating: number;
  title: Localized;
  body: Localized;
  createdAt: string;
}

/** A book joined with its author and category, ready for the UI. */
export interface BookWithRelations extends Book {
  author: Author;
  category: Category;
  publisher: Publisher;
}

/**
 * A lecture-note booklet (ملزمة). Shaped exactly like `Book` and stored in
 * its own table; the two catalogues share only authors, categories and
 * publishers.
 */
export interface Handout {
  id: string;
  slug: string;
  title: Localized;
  authorId: string;
  categoryId: string;
  /** Whole Iraqi dinars — no minor units. */
  price: number;
  compareAtPrice?: number;
  rating: number;
  reviewsCount: number;
  stock: number;
  pages: number;
  publisherId: string;
  publishedYear: number;
  isbn: string;
  language: Localized;
  coverType: CoverType;
  weightGrams: number;
  description: Localized;
  tags: BookTag[];
  /** Optional real cover; a typographic placeholder is drawn when absent. */
  coverUrl?: string;
  createdAt: string;
}

/** A handout joined with its author, category and publisher, ready for the UI. */
export interface HandoutWithRelations extends Handout {
  author: Author;
  category: Category;
  publisher: Publisher;
}

/** `Review` for a handout; the two live in separate tables. */
export interface HandoutReview {
  id: string;
  handoutId: string;
  authorName: string;
  rating: number;
  title: Localized;
  body: Localized;
  createdAt: string;
}

export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "card" | "wallet";

export type ShippingMethod = "standard" | "express" | "pickup";

export interface Address {
  id: string;
  label: Localized;
  fullName: string;
  phone: string;
  governorate: Localized;
  city: Localized;
  line: Localized;
  isDefault: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  birthDate: string;
  memberSince: string;
  addresses: Address[];
  preferences: {
    newsletter: boolean;
    offers: boolean;
  };
  stats: {
    orders: number;
    wishlist: number;
    booksBought: number;
  };
}

export interface OrderItem {
  bookId: string;
  quantity: number;
  /** Unit price at the time of ordering. */
  unitPrice: number;
}

/** An order line for a handout — the same three fields over the other table. */
export interface HandoutOrderItem {
  handoutId: string;
  quantity: number;
  unitPrice: number;
}

export interface OrderTimelineEntry {
  status: OrderStatus;
  date: string;
  done: boolean;
}

export interface Order {
  id: string;
  reference: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  /** Handout lines; an order may hold both kinds. */
  handoutItems: HandoutOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  address: Address;
  timeline: OrderTimelineEntry[];
}

export interface CartLine {
  bookId: string;
  quantity: number;
}

/** A cart line joined with its book, ready for the UI. */
export interface CartLineWithBook extends CartLine {
  book: BookWithRelations;
  lineTotal: number;
}

export interface HandoutCartLine {
  handoutId: string;
  quantity: number;
}

/** A handout cart line joined with its handout, ready for the UI. */
export interface CartLineWithHandout extends HandoutCartLine {
  handout: HandoutWithRelations;
  lineTotal: number;
}

/* ------------------------------------------------------------------ */
/* Admin                                                               */
/* ------------------------------------------------------------------ */

export type CustomerStatus = "active" | "blocked";

export interface CustomerSummary {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: Localized;
  ordersCount: number;
  totalSpent: number;
  joinedAt: string;
  status: CustomerStatus;
}

export type ReviewStatus = "pending" | "published" | "rejected";

/** A review plus its moderation status and the book it belongs to. */
export interface ReviewWithStatus extends Review {
  status: ReviewStatus;
  /** Denormalised so tables can render without a join. */
  bookTitle: Localized;
}

/** The same record, named for where the admin tables use it. */
export type AdminReview = ReviewWithStatus;

/** A handout review plus its moderation status and the handout it belongs to. */
export interface HandoutReviewWithStatus extends HandoutReview {
  status: ReviewStatus;
  /** Denormalised so tables can render without a join. */
  handoutTitle: Localized;
}

export interface SalesPoint {
  /** ISO month, e.g. "2026-03". */
  month: string;
  revenue: number;
  orders: number;
}

export interface TopBookStat {
  bookId: string;
  sold: number;
  revenue: number;
}

export interface CategoryShare {
  categoryId: string;
  share: number;
}

export interface AdminMetric {
  value: number;
  /** Percentage change against the previous period. */
  change: number;
}

export interface AdminStats {
  revenue: AdminMetric;
  orders: AdminMetric;
  customers: AdminMetric;
  books: AdminMetric;
}

export type ContactStatus = "new" | "read";

/** A message left through the storefront contact form. */
export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: ContactStatus;
  createdAt: string;
}

export interface NewsletterSubscriber {
  email: string;
  locale: string;
  createdAt: string;
}

export type CouponType = "percentage" | "fixed";

/** A discount code as the admin screen sees it. */
export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  value: number;
  minSubtotal: number;
  active: boolean;
  /** ISO date, or "" when the code never expires. */
  expiresAt: string;
  /** Null means unlimited. */
  usageLimit: number | null;
  usedCount: number;
}

export type AdminNotificationKind = "order" | "review" | "stock";

/** One thing waiting for the store manager's attention. */
export interface AdminNotification {
  id: string;
  kind: AdminNotificationKind;
  /** The subject line: an order reference, a book title, a reviewer. */
  label: string;
  /** The supporting line, already in the reader's language. */
  detail: string;
  href: string;
  at: string;
}
