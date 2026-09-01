import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAdminNotifications, getStoreSettings } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { requireAdmin } from "@/lib/auth";

/**
 * The admin panel is fully separate from the storefront: its own sidebar,
 * top bar and density. Nothing here is shared with the customer chrome.
 */
export default async function AdminLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  // Authorisation lives here, not in the proxy: Prisma cannot run at the edge.
  const manager = await requireAdmin(locale);

  const [dictionary, admin, notifications, settings] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAdminNotifications(locale),
    getStoreSettings(),
  ]);

  const anyNotificationsEnabled = [
    "notifyOrders",
    "notifyReviews",
    "notifyStock",
  ].some((key) => settings[key] !== "false");

  return (
    <div className="flex min-h-dvh bg-surface">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:border focus:border-line focus:bg-primary-container focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary-container"
      >
        {dictionary.common.skipToContent}
      </a>

      {/* Icon rail on tablets, full sidebar from lg up */}
      <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col overflow-y-auto border-e-2 border-line bg-card md:flex lg:w-70">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b-2 border-line px-3 lg:px-4">
          <span className="flex size-9 shrink-0 items-center justify-center border border-line bg-primary-container">
            <span className="size-2.5 rounded-full bg-on-primary-container" />
          </span>
          <span className="hidden min-w-0 flex-col leading-none lg:flex">
            <span className="font-display text-lg font-extrabold text-on-surface">
              {admin.brand.name}
            </span>
            <span className="label-mono mt-1 text-muted">{admin.brand.panel}</span>
          </span>
        </div>

        <AdminNav locale={locale} labels={admin.nav} iconsOnly />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b-2 border-line bg-card">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <AdminMobileNav
              locale={locale}
              labels={admin.nav}
              panelLabel={admin.brand.panel}
              menuLabel={dictionary.common.menu}
              closeLabel={dictionary.common.close}
            />

            <form
              action={`/${locale}/admin/books`}
              className="hidden h-10 min-w-0 max-w-md flex-1 items-center border border-line bg-surface-low ps-3 sm:flex"
            >
              <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={2} />
              <label htmlFor="admin-search" className="sr-only">
                {admin.topbar.search}
              </label>
              <input
                id="admin-search"
                name="q"
                type="search"
                placeholder={admin.topbar.search}
                className="h-full w-full min-w-0 bg-transparent px-2 text-sm text-on-surface placeholder:text-muted focus:outline-none"
              />
            </form>

            <div className="ms-auto flex items-center gap-1">
              <Link
                href={`/${locale}`}
                className="hidden items-center gap-2 border border-transparent px-3 py-2 text-label-md text-on-surface transition-colors hover:border-line hover:bg-surface-high lg:inline-flex"
              >
                <ExternalLink aria-hidden className="size-4 rtl:-scale-x-100" strokeWidth={2} />
                {admin.topbar.viewStore}
              </Link>

              <LocaleSwitcher locale={locale} />
              <ThemeToggle labels={dictionary.common.theme} className="size-9" />

              <AdminNotifications
                items={notifications.items}
                total={notifications.total}
                anyEnabled={anyNotificationsEnabled}
                settingsHref={`/${locale}/admin/settings?tab=account`}
                labels={{
                  trigger: admin.topbar.notifications,
                  ...admin.topbar.bell,
                }}
              />

              <span className="ms-2 flex items-center gap-2 border-s border-outline-variant ps-3">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center border border-line bg-inverse-surface font-display text-sm font-bold text-inverse-on-surface"
                >
                  {manager.name.slice(0, 1)}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-32 truncate text-label-md font-semibold text-on-surface">
                    {manager.name}
                  </span>
                  <span className="label-mono text-muted">{admin.topbar.role}</span>
                </span>

                <AdminSignOut locale={locale} label={admin.topbar.signOut} />
              </span>
            </div>
          </div>
        </header>

        <main id="admin-main" className="min-w-0 flex-1 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
