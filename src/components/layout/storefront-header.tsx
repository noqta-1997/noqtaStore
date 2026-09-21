import { Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";

import { AccountMenu } from "@/components/layout/account-menu";
import { CatalogueMenu } from "@/components/layout/catalogue-menu";
import { Logo } from "@/components/layout/logo";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SearchBar } from "@/components/layout/search-bar";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { CartBadge } from "@/components/commerce/cart-badge";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { buildCatalogueMenu } from "@/lib/category-menu";
import { getMainNav } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import type { CategoryNode, HandoutCategoryNode } from "@/types";

const iconLinkStyles =
  "relative inline-flex size-10 items-center justify-center rounded-md text-on-surface " +
  "transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary";

const navLinkStyles =
  "inline-block rounded-md px-1 py-2 text-body-md font-medium whitespace-nowrap text-on-surface-variant " +
  "transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface";

interface StorefrontHeaderProps {
  locale: Locale;
  dictionary: Dictionary;
  /** The top-level branches of the books' tree, each with what hangs under it. */
  categories: CategoryNode[];
  /** The same for the handouts' own tree. */
  handoutCategories: HandoutCategoryNode[];
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
 *
 * The row has no width to spare — Arabic fills it — and the browser's way
 * of coping was to fold the longest labels onto two lines, which a header
 * screenshot barely shows. The links are `whitespace-nowrap`, so that can
 * never happen again; what yields instead is the tagline under the
 * wordmark, the one element whose length the settings screen leaves free,
 * and `Logo` keeps it out of the row wherever the links are on it.
 *
 * The two catalogue items carry their category trees: on a desktop each is a
 * menu that cascades through the stages and grades, and in the phone drawer
 * the trees are listed after the main links. Both are built here, once, as
 * plain data.
 */
export function StorefrontHeader({
  locale,
  dictionary,
  categories,
  handoutCategories,
  brand,
}: StorefrontHeaderProps) {
  const navItems = getMainNav(dictionary.nav);
  const menus = {
    books: buildCatalogueMenu(categories, locale, (slug) => `/categories/${slug}`, {
      label: dictionary.nav.books,
      href: "/books",
      allLabel: dictionary.books.title,
      othersLabel: dictionary.nav.otherBranches,
    }),
    handouts: buildCatalogueMenu(
      handoutCategories,
      locale,
      (slug) => `/handouts/categories/${slug}`,
      {
        label: dictionary.nav.handouts,
        href: "/handouts",
        allLabel: dictionary.handouts.title,
        othersLabel: dictionary.nav.otherBranches,
      },
    ),
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line-divider bg-surface/95 backdrop-blur">
      <Container className="flex h-18 items-center gap-3 lg:gap-2">
        <MobileNav
          items={navItems}
          trees={[
            { title: dictionary.nav.bookTree, menu: menus.books },
            { title: dictionary.nav.handoutTree, menu: menus.handouts },
          ]}
          loginHref={`/login`}
          accountHref={`/account`}
          adminHref={`/admin`}
          labels={{
            menu: dictionary.common.menu,
            close: dictionary.common.close,
            login: dictionary.common.login,
            wholeBranch: dictionary.nav.wholeBranch,
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
          <ul className="flex items-center gap-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.tree ? (
                  <CatalogueMenu
                    menu={menus[item.tree]}
                    wholeLabel={dictionary.nav.wholeBranch}
                    linkClassName={navLinkStyles}
                  />
                ) : (
                  <Link href={item.href} className={navLinkStyles}>
                    {item.label}
                  </Link>
                )}
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
            className="hidden w-36 xl:flex"
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
