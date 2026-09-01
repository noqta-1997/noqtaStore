import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";

export interface NavItem {
  href: string;
  label: string;
}

/** Single source of truth for the storefront's main navigation. */
export function getMainNav(locale: Locale, nav: Dictionary["nav"]): NavItem[] {
  return [
    { href: `/${locale}`, label: nav.home },
    { href: `/${locale}/books`, label: nav.books },
    { href: `/${locale}/categories`, label: nav.categories },
    { href: `/${locale}/authors`, label: nav.authors },
    { href: `/${locale}/publishers`, label: nav.publishers },
    { href: `/${locale}/offers`, label: nav.offers },
    { href: `/${locale}/about`, label: nav.about },
  ];
}
