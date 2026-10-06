import type { Locale } from "@/i18n/config";

/** Every user-facing string in the mock data ships in both locales. */
export type Localized = Record<Locale, string>;

export type BookTag = "bestseller" | "new" | "featured" | "award";

/**
 * A branch of the handouts' tree: a stage, a grade under it, a branch under
 * that, or any level added later. `parentId` is what makes it a tree.
 */
export interface HandoutCategory {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Lucide icon name rendered by the UI layer. */
  icon: string;
  /** The branch this one hangs under; null for a top-level branch. */
  parentId: string | null;
  /** Position among siblings — the grades read in school order. */
  sortOrder: number;
  /** Handouts filed here and under every branch below. */
  handoutsCount: number;
}

/** A handout category with its place in the tree. */
export interface HandoutCategoryNode extends HandoutCategory {
  /** 0 for a top-level branch. */
  depth: number;
  children: HandoutCategoryNode[];
}

/**
 * What a category control needs of a branch. The depth is what lets a flat
 * select read as a tree.
 */
export interface CategoryOption {
  id: string;
  slug: string;
  name: Localized;
  depth: number;
}

export interface Author {
  id: string;
  slug: string;
  name: Localized;
  bio: Localized;
  /** Handouts by this teacher on the shelf. */
  handoutsCount: number;
  avatarUrl?: string;
  /** What the teacher teaches, by name; absent where the read did not load it. */
  subjects?: Subject[];
}

export interface Publisher {
  id: string;
  slug: string;
  name: Localized;
  description: Localized;
  /** Handouts from this press on the shelf. */
  handoutsCount: number;
}

/** A school subject — one flat list, shared by every grade. */
export interface Subject {
  id: string;
  slug: string;
  name: Localized;
  /** A picture name `CategoryIcon` draws. */
  icon: string;
}

/** A lecture-note booklet (ملزمة) — what the store sells. */
export interface Handout {
  id: string;
  slug: string;
  title: Localized;
  authorId: string;
  subjectId: string;
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
  language: Localized;
  description: Localized;
  tags: BookTag[];
  /** Optional real cover; a typographic placeholder is drawn when absent. */
  coverUrl?: string;
  /** Taken off sale by the panel; the storefront never lists it. */
  archived?: boolean;
  createdAt: string;
}

/** A handout joined with its author, category and publisher, ready for the UI. */
export interface HandoutWithRelations extends Handout {
  author: Author;
  category: HandoutCategory;
  publisher: Publisher;
}

/** A reader's review of a handout. */
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

export type ShippingMethod = "standard";

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
  /** Set from the panel. A blocked account browses, but neither orders nor reviews. */
  status: CustomerStatus;
  addresses: Address[];
  stats: {
    orders: number;
    wishlist: number;
    /** Copies across every non-cancelled order. */
    copiesBought: number;
  };
}

/** An order line: one handout, how many, and at what price. */
export interface HandoutOrderItem {
  /** Null once the handout is deleted. */
  handoutId: string | null;
  quantity: number;
  /** Unit price at the time of ordering. */
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
  handoutItems: HandoutOrderItem[];
  subtotal: number;
  shippingCost: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  address: Address;
  notes: string | null;
  timeline: OrderTimelineEntry[];
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
  titles: AdminMetric;
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
  /** The subject line: an order reference, a handout title, a reviewer. */
  label: string;
  /** The supporting line, already in the reader's language. */
  detail: string;
  href: string;
  at: string;
}

/** What a picker draws beside an entry's name. */
export type PickPicture =
  /** A handout: its cover, or the typographic placeholder when it has none. */
  | { kind: "jacket"; src?: string }
  /** An author: initials in the tone their card uses. */
  | { kind: "portrait" }
  /** A publisher: the building mark in the tone its card uses. */
  | { kind: "mark" };

/**
 * A catalogue entry cut down to what a picker in the panel shows: enough to
 * recognise it in a list and draw its picture, and nothing a form does not
 * need to carry to the browser.
 */
export interface PickOption {
  id: string;
  label: string;
  sublabel?: string;
  /** Stable key for the placeholder's colour or the portrait's tone. */
  seed: string;
  picture: PickPicture;
}
