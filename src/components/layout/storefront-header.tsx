import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CartBadge } from "@/components/commerce/cart-badge";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { getMainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const iconLinkStyles =
  "relative inline-flex size-10 items-center justify-center rounded-md text-on-surface " +
  "transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary";

interface StorefrontHeaderProps {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  /** Overrides the shipped copy when the settings screen has been filled in. */
  brand: { name: string; tagline: string };
}

/**
 * One row instead of three.
 *
 * The reference puts the wordmark, the links and the reader's own controls on
 * a single line, so the separate navigation rail below the search field is
 * gone and its occupant, the theme toggle, moved into the action cluster. The
 * language switch that used to sit beside it went with the English site. The
 * theme toggle stays the last `button[aria-label]` in the header: that is how
 * the functional suite finds it, and it is the only control here the suite
 * drives.
 */
export function StorefrontHeader({
  locale,
  dictionary,
  categories,
  brand,
}: StorefrontHeaderProps) {
  const navItems = getMainNav(dictionary.nav);
  const categoryItems = categories.map((category) => ({
    href: `/categories/${category.slug}`,
    label: category.name[locale],
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-line-divider bg-surface/95 backdrop-blur">
      <div className="bg-anchor text-on-anchor">
        <Container className="flex h-9 items-center justify-center gap-2 text-center">
          <p className="label-mono truncate">{dictionary.announcement.text}</p>
        </Container>
      </div>

      <Container className="flex h-18 items-center gap-3">
        <MobileNav
          items={navItems}
          categories={categoryItems}
          loginHref={`/login`}
          accountHref={`/account`}
          adminHref={`/admin`}
          labels={{
            menu: dictionary.common.menu,
            close: dictionary.common.close,
            login: dictionary.common.login,
            categories: dictionary.nav.categories,
            theme: dictionary.common.theme,
            account: dictionary.common.account,
            logout: dictionary.account.nav.logout,
            adminPanel: dictionary.account.nav.adminPanel,
          }}
        />

        <Logo name={brand.name} tagline={brand.tagline} />

        <nav
          aria-label={dictionary.common.menu}
          className="mx-auto hidden lg:block"
        >
          <ul className="flex items-center gap-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-block rounded-md px-2 py-2 text-body-md font-medium text-on-surface-variant transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ms-auto flex items-center gap-0.5 lg:ms-0 lg:gap-1">
          <SearchBar
            action={`/search`}
            label={dictionary.common.search}
            placeholder={dictionary.common.searchPlaceholder}
            compact
            className="hidden w-48 xl:flex"
          />

          <Link
            href={`/account/wishlist`}
            aria-label={dictionary.common.wishlist}
            title={dictionary.common.wishlist}
            className={cn(iconLinkStyles, "hidden sm:inline-flex")}
          >
            <Heart aria-hidden className="size-5" strokeWidth={1.75} />
          </Link>

          <Link
            href={`/cart`}
            aria-label={dictionary.common.cart}
            title={dictionary.common.cart}
            className={iconLinkStyles}
          >
            <ShoppingBag aria-hidden className="size-5" strokeWidth={1.75} />
            <CartBadge />
          </Link>

          <AccountMenu
            labels={{
              login: dictionary.common.login,
              account: dictionary.common.account,
              profile: dictionary.account.nav.profile,
              orders: dictionary.account.nav.orders,
              wishlist: dictionary.account.nav.wishlist,
              addresses: dictionary.account.nav.addresses,
              reviews: dictionary.account.nav.reviews,
              logout: dictionary.account.nav.logout,
              signedInAs: dictionary.auth.signedInAs,
              adminPanel: dictionary.account.nav.adminPanel,
            }}
          />

          <ThemeToggle
            labels={dictionary.common.theme}
            className="hidden size-10 lg:inline-flex"
          />
        </div>
      </Container>

      <Container className="pb-3 xl:hidden">
        <SearchBar
          action={`/search`}
          label={dictionary.common.search}
          placeholder={dictionary.common.searchPlaceholder}
        />
      </Container>
    </header>
  );
}
