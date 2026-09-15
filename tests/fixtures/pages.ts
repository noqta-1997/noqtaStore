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
  { id: "home", path: () => "/", ready: "main h1" },
  { id: "catalogue", path: () => "/books", ready: "main" },
  {
    id: "book-detail",
    path: () => "/books/al-amir-al-saghir",
    ready: "main h1",
  },
  // The handouts catalogue mirrors the books one, read from its own table.
  { id: "handouts", path: () => "/handouts", ready: "main" },
  {
    id: "handout-detail",
    path: () => "/handouts/physics-sixth-scientific",
    ready: "main h1",
  },
  { id: "categories", path: () => "/categories", ready: "main" },
  {
    id: "category-detail",
    path: () => "/categories/literature",
    ready: "main",
  },
  // A stage of the school ladder: the strip of grades above an empty
  // catalogue, and four levels of crumbs on the handouts' twin below.
  {
    id: "category-branch",
    path: () => "/categories/preparatory",
    ready: "main",
  },
  { id: "handout-categories", path: () => "/handouts/categories", ready: "main" },
  {
    id: "handout-category-detail",
    path: () => "/handouts/categories/preparatory-6",
    ready: "main",
  },
  { id: "authors", path: () => "/authors", ready: "main" },
  {
    id: "author-detail",
    path: () => "/authors/naguib-mahfouz",
    ready: "main",
  },
  { id: "publishers", path: () => "/publishers", ready: "main" },
  { id: "offers", path: () => "/offers", ready: "main" },
  { id: "search", path: () => "/search?q=1984", ready: "main" },
  { id: "cart", path: () => "/cart", ready: "main" },
  // Sign-in is a single Google button now; the page carries no form.
  { id: "login", path: () => "/login", ready: "main button" },
  { id: "faq", path: () => "/faq", ready: "main" },
  { id: "contact", path: () => "/contact", ready: "main form" },
  {
    id: "publisher-detail",
    path: () => "/publishers/dar-el-shorouk",
    ready: "main",
  },

  // A real miss inside the storefront group, so the 404 renders under the
  // site chrome rather than the bare root shell.
  {
    id: "not-found",
    path: () => "/books/no-such-book",
    ready: "main",
  },

  // Behind auth — infrastructure is ready, capture is skipped without a session.
  { id: "account", path: () => "/account", gated: true, ready: "main" },
  {
    id: "account-orders",
    path: () => "/account/orders",
    gated: true,
    ready: "main",
  },
  {
    id: "admin-dashboard",
    path: () => "/admin",
    gated: true,
    volatile: true,
  },
  { id: "admin-books", path: () => "/admin/books", gated: true },
  { id: "admin-handouts", path: () => "/admin/handouts", gated: true },
  { id: "checkout", path: () => "/checkout", gated: true, ready: "main" },
  {
    id: "checkout-success",
    path: () => "/checkout/success",
    gated: true,
    ready: "main",
  },

  // The account half: every list shape the reader can reach, plus the one
  // detail page. Order o1 is seeded with a timeline that is entirely in the
  // past, so the "done" marks mappers.ts recomputes against now cannot move.
  {
    id: "account-addresses",
    path: () => "/account/addresses",
    gated: true,
    ready: "main",
  },
  {
    id: "account-reviews",
    path: () => "/account/reviews",
    gated: true,
    ready: "main",
  },
  {
    id: "account-wishlist",
    path: () => "/account/wishlist",
    gated: true,
    ready: "main",
  },
  {
    id: "account-order-detail",
    path: () => "/account/orders/o1",
    gated: true,
    ready: "main",
  },

  // The admin half: the table page, the list-beside-a-form page, the long
  // form, and the report. admin-books already covers the plain table.
  { id: "admin-orders", path: () => "/admin/orders", gated: true },
  { id: "admin-authors", path: () => "/admin/authors", gated: true },
  // The tree as a table, indented, beside the form with its parent control.
  { id: "admin-categories", path: () => "/admin/categories", gated: true },
  { id: "admin-book-new", path: () => "/admin/books/new", gated: true },
  { id: "admin-handout-new", path: () => "/admin/handouts/new", gated: true },
  { id: "admin-handout-reviews", path: () => "/admin/handout-reviews", gated: true },
  {
    id: "admin-reports",
    path: () => "/admin/reports",
    gated: true,
    volatile: true,
  },
];

export const PUBLIC_PAGES = PAGES.filter((page) => !page.gated);
export const GATED_PAGES = PAGES.filter((page) => page.gated);

export const LOCALES: Locale[] = ["ar"];
