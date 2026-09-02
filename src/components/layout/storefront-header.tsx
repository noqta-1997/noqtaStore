import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
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
  "inline-flex size-8 items-center justify-center rounded-md text-on-surface-variant " +
  "transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface";

interface StorefrontHeaderProps {
  locale: Locale;
  dictionary: Dictionary;
  categories: Category[];
  /** Overrides the shipped copy when the settings screen has been filled in. */
  brand: { name: string; tagline: string };
}

export function StorefrontHeader({
  locale,
  dictionary,
  categories,
  brand,
}: StorefrontHeaderProps) {
  const navItems = getMainNav(locale, dictionary.nav);
  const categoryItems = categories.map((category) => ({
    href: `/${locale}/categories/${category.slug}`,
    label: category.name[locale],
  }));

  return (
    <header className="sticky top-0 z-40 border-b border-line-divider bg-card">
      <div className="bg-anchor text-on-anchor">
        <Container className="flex h-9 items-center justify-center gap-2 text-center">
          <p className="label-mono truncate">{dictionary.announcement.text}</p>
        </Container>
      </div>

      <Container className="flex h-18 items-center gap-3">
        <MobileNav
          items={navItems}
          categories={categoryItems}
          loginHref={`/${locale}/login`}
          accountHref={`/${locale}/account`}
          labels={{
            menu: dictionary.common.menu,
            close: dictionary.common.close,
            login: dictionary.common.login,
            categories: dictionary.nav.categories,
            theme: dictionary.common.theme,
            account: dictionary.common.account,
            logout: dictionary.account.nav.logout,
          }}
        />

        <Logo locale={locale} name={brand.name} tagline={brand.tagline} />

        <SearchBar
          action={`/${locale}/search`}
          label={dictionary.common.search}
          placeholder={dictionary.common.searchPlaceholder}
          className="mx-auto hidden w-full max-w-xl lg:flex"
        />

        <div className="ms-auto flex items-center gap-1 lg:ms-0">
          <Link
            href={`/${locale}/account/wishlist`}
            aria-label={dictionary.common.wishlist}
            title={dictionary.common.wishlist}
            className={cn(iconLinkStyles, "hidden sm:inline-flex")}
          >
            <Heart aria-hidden className="size-5" strokeWidth={2} />
          </Link>

          <Link
            href={`/${locale}/cart`}
            aria-label={dictionary.common.cart}
            title={dictionary.common.cart}
            className="relative inline-flex size-10 items-center justify-center rounded-md border border-line bg-card text-on-surface transition-colors hover:bg-primary-container hover:text-on-primary-container"
          >
            <ShoppingBag aria-hidden className="size-5" strokeWidth={2} />
            <CartBadge />
          </Link>

          <AccountMenu
            locale={locale}
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
            }}
          />
        </div>
      </Container>

      <Container className="pb-3 lg:hidden">
        <SearchBar
          action={`/${locale}/search`}
          label={dictionary.common.search}
          placeholder={dictionary.common.searchPlaceholder}
        />
      </Container>

      <div className="hidden border-t border-line-divider lg:block">
        <Container className="flex h-11 items-center justify-between">
          <nav aria-label={dictionary.common.menu}>
            <ul className="flex items-center gap-1">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-block rounded-md px-3 py-1 text-body-md text-on-surface-variant transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex items-center gap-1">
            <LocaleSwitcher locale={locale} />
            <ThemeToggle labels={dictionary.common.theme} className="size-9" />
          </div>
        </Container>
      </div>
    </header>
  );
}
