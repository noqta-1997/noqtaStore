import type { Locale } from "@/i18n/config";

/**
 * The representative page set for the Fluent 2 migration baseline.
 *
 * Every distinct layout in the app appears exactly once. Slugs are real rows
 * from the seeded database, captured so the detail pages render content
 * rather than a not-found shell.
 *
 * `gated` pages redirect to /login when there is no session; they are only
 * captured when a storage state has been provided (see fixtures/auth.ts).
 */
export interface PageCase {
  /** Stable id — becomes the screenshot filename, so it must never change. */
  id: string;
  /** Path builder, locale-aware. */
  path: (locale: Locale) => string;
  /** Requires an authenticated session. */
  gated?: boolean;

  /**
   * The page derives its content from the current date, so a screenshot of
   * it expires. `getAdminStats` measures against the first of this month and
   * `getSalesSeries` walks the last twelve, so both re-bucket every month.
   * These are scanned for accessibility, which is time-invariant, and left
   * out of the visual baseline rather than re-captured every month.
   */
  volatile?: boolean;
  /** A selector that must be present before the page counts as settled. */
  ready?: string;
}

export const PAGES: PageCase[] = [
  { id: "home", path: (l) => `/${l}`, ready: "main h1" },
  { id: "catalogue", path: (l) => `/${l}/books`, ready: "main" },
  {
    id: "book-detail",
    path: (l) => `/${l}/books/al-amir-al-saghir`,
    ready: "main h1",
  },
  { id: "categories", path: (l) => `/${l}/categories`, ready: "main" },
  {
    id: "category-detail",
    path: (l) => `/${l}/categories/literature`,
    ready: "main",
  },
  { id: "authors", path: (l) => `/${l}/authors`, ready: "main" },
  {
    id: "author-detail",
    path: (l) => `/${l}/authors/naguib-mahfouz`,
    ready: "main",
  },
  { id: "publishers", path: (l) => `/${l}/publishers`, ready: "main" },
  { id: "offers", path: (l) => `/${l}/offers`, ready: "main" },
  { id: "search", path: (l) => `/${l}/search?q=1984`, ready: "main" },
  { id: "cart", path: (l) => `/${l}/cart`, ready: "main" },
  // Sign-in is a single Google button now; the page carries no form.
  { id: "login", path: (l) => `/${l}/login`, ready: "main button" },
  { id: "faq", path: (l) => `/${l}/faq`, ready: "main" },
  { id: "contact", path: (l) => `/${l}/contact`, ready: "main form" },
  {
    id: "publisher-detail",
    path: (l) => `/${l}/publishers/dar-el-shorouk`,
    ready: "main",
  },

  // A real miss inside the storefront group, so the 404 renders under the
  // site chrome rather than the bare root shell.
  {
    id: "not-found",
    path: (l) => `/${l}/books/no-such-book`,
    ready: "main",
  },

  // Behind auth — infrastructure is ready, capture is skipped without a session.
  { id: "account", path: (l) => `/${l}/account`, gated: true, ready: "main" },
  {
    id: "account-orders",
    path: (l) => `/${l}/account/orders`,
    gated: true,
    ready: "main",
  },
  {
    id: "admin-dashboard",
    path: (l) => `/${l}/admin`,
    gated: true,
    volatile: true,
  },
  { id: "admin-books", path: (l) => `/${l}/admin/books`, gated: true },
  { id: "checkout", path: (l) => `/${l}/checkout`, gated: true, ready: "main" },
  {
    id: "checkout-success",
    path: (l) => `/${l}/checkout/success`,
    gated: true,
    ready: "main",
  },

  // The account half: every list shape the reader can reach, plus the one
  // detail page. Order o1 is seeded with a timeline that is entirely in the
  // past, so the "done" marks mappers.ts recomputes against now cannot move.
  {
    id: "account-addresses",
    path: (l) => `/${l}/account/addresses`,
    gated: true,
    ready: "main",
  },
  {
    id: "account-reviews",
    path: (l) => `/${l}/account/reviews`,
    gated: true,
    ready: "main",
  },
  {
    id: "account-wishlist",
    path: (l) => `/${l}/account/wishlist`,
    gated: true,
    ready: "main",
  },
  {
    id: "account-order-detail",
    path: (l) => `/${l}/account/orders/o1`,
    gated: true,
    ready: "main",
  },

  // The admin half: the table page, the list-beside-a-form page, the long
  // form, and the report. admin-books already covers the plain table.
  { id: "admin-orders", path: (l) => `/${l}/admin/orders`, gated: true },
  { id: "admin-authors", path: (l) => `/${l}/admin/authors`, gated: true },
  { id: "admin-book-new", path: (l) => `/${l}/admin/books/new`, gated: true },
  {
    id: "admin-reports",
    path: (l) => `/${l}/admin/reports`,
    gated: true,
    volatile: true,
  },
];

export const PUBLIC_PAGES = PAGES.filter((page) => !page.gated);
export const GATED_PAGES = PAGES.filter((page) => page.gated);

export const LOCALES: Locale[] = ["ar", "en"];
