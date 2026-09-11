import { ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminNav } from "@/components/admin/admin-nav";
import { LogoMark } from "@/components/layout/logo-mark";
import { AdminNotifications } from "@/components/admin/admin-notifications";
import { AdminSignOut } from "@/components/admin/admin-sign-out";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { getAdminNotifications, getStoreSettings } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { requireAdmin } from "@/lib/auth";

/**
 * The admin panel is fully separate from the storefront: its own sidebar,
 * top bar and density. Nothing here is shared with the customer chrome.
 */
export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const locale = defaultLocale;

  // Authorisation lives here, not in the proxy: Prisma cannot run at the edge.
  const manager = await requireAdmin();

  const [dictionary, admin, notifications, settings] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getAdminNotifications(),
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
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:rounded-md focus:bg-primary-container focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-on-primary-container"
      >
        {dictionary.common.skipToContent}
      </a>

      {/* Icon rail on tablets, full sidebar from lg up */}
      <aside className="sticky top-0 hidden h-dvh w-16 shrink-0 flex-col overflow-y-auto border-e border-line-divider bg-card md:flex lg:w-70">
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-line-divider px-3 lg:px-4">
          <LogoMark size={36} />
          <span className="hidden min-w-0 flex-col leading-none lg:flex">
            <span className="font-display text-lg font-bold text-primary">
              {admin.brand.name}
            </span>
            <span className="mt-1 text-label-md text-muted">{admin.brand.panel}</span>
          </span>
        </div>

        <AdminNav labels={admin.nav} iconsOnly />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-line-divider bg-card">
          <div className="flex h-16 items-center gap-2 px-4 sm:px-6">
            <AdminMobileNav
              labels={admin.nav}
              panelLabel={admin.brand.panel}
              menuLabel={dictionary.common.menu}
              closeLabel={dictionary.common.close}
            />

            <form
              action={`/admin/books`}
              className="hidden h-10 min-w-0 max-w-md flex-1 items-center rounded-full border border-line bg-card ps-4 sm:flex"
            >
              <Search aria-hidden className="size-4 shrink-0 text-muted" strokeWidth={1.75} />
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
                href={"/"}
                className="hidden items-center gap-2 rounded-md px-3 py-2 text-label-md text-on-surface transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-primary lg:inline-flex"
              >
                <ExternalLink aria-hidden className="size-4 rtl:-scale-x-100" strokeWidth={1.75} />
                {admin.topbar.viewStore}
              </Link>

              <ThemeToggle labels={dictionary.common.theme} className="size-9" />

              <AdminNotifications
                items={notifications.items}
                total={notifications.total}
                anyEnabled={anyNotificationsEnabled}
                settingsHref={`/admin/settings?tab=account`}
                labels={{
                  trigger: admin.topbar.notifications,
                  ...admin.topbar.bell,
                }}
              />

              <span className="ms-2 flex items-center gap-2 border-s border-line-divider ps-3">
                <span
                  aria-hidden
                  className="flex size-9 items-center justify-center rounded-full bg-primary-container font-display text-body-md font-bold text-on-primary-container"
                >
                  {manager.name.slice(0, 1)}
                </span>
                <span className="hidden flex-col leading-tight sm:flex">
                  <span className="max-w-32 truncate text-label-md font-semibold text-on-surface">
                    {manager.name}
                  </span>
                  <span className="text-label-md text-muted">{admin.topbar.role}</span>
                </span>

                <AdminSignOut label={admin.topbar.signOut} />
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
