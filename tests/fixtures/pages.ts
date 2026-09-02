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
  { id: "login", path: (l) => `/${l}/login`, ready: "main form" },
  { id: "faq", path: (l) => `/${l}/faq`, ready: "main" },

  // Behind auth — infrastructure is ready, capture is skipped without a session.
  { id: "account", path: (l) => `/${l}/account`, gated: true, ready: "main" },
  {
    id: "account-orders",
    path: (l) => `/${l}/account/orders`,
    gated: true,
    ready: "main",
  },
  { id: "admin-dashboard", path: (l) => `/${l}/admin`, gated: true },
  { id: "admin-books", path: (l) => `/${l}/admin/books`, gated: true },
];

export const PUBLIC_PAGES = PAGES.filter((page) => !page.gated);
export const GATED_PAGES = PAGES.filter((page) => page.gated);

export const LOCALES: Locale[] = ["ar", "en"];
