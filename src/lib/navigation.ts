import type { Dictionary } from "@/i18n/get-dictionary";

export interface NavItem {
  href: string;
  label: string;
  /** Set on the catalogue link: its category tree hangs under it in the header. */
  tree?: "handouts";
}

/** Single source of truth for the storefront's main navigation. */
export function getMainNav(nav: Dictionary["nav"]): NavItem[] {
  return [
    { href: "/", label: nav.home },
    { href: "/handouts", label: nav.handouts, tree: "handouts" },
    { href: "/authors", label: nav.authors },
    { href: "/publishers", label: nav.publishers },
    { href: "/about", label: nav.about },
  ];
}
