import type { Dictionary } from "@/i18n/get-dictionary";

export interface NavItem {
  href: string;
  label: string;
}

/** Single source of truth for the storefront's main navigation. */
export function getMainNav(nav: Dictionary["nav"]): NavItem[] {
  return [
    { href: "/", label: nav.home },
    { href: "/books", label: nav.books },
    { href: "/handouts", label: nav.handouts },
    { href: "/categories", label: nav.categories },
    { href: "/authors", label: nav.authors },
    { href: "/publishers", label: nav.publishers },
    { href: "/offers", label: nav.offers },
    { href: "/about", label: nav.about },
  ];
}
