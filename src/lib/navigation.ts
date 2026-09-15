import type { Dictionary } from "@/i18n/get-dictionary";

export interface NavItem {
  href: string;
  label: string;
  /** The catalogue whose category tree hangs under this link in the header. */
  tree?: "books" | "handouts";
}

/** Single source of truth for the storefront's main navigation. */
export function getMainNav(nav: Dictionary["nav"]): NavItem[] {
  return [
    { href: "/", label: nav.home },
    { href: "/books", label: nav.books, tree: "books" },
    { href: "/handouts", label: nav.handouts, tree: "handouts" },
    { href: "/categories", label: nav.categories },
    { href: "/authors", label: nav.authors },
    { href: "/publishers", label: nav.publishers },
    { href: "/offers", label: nav.offers },
    { href: "/about", label: nav.about },
  ];
}
