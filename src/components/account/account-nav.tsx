"use client";

import { Heart, LogOut, MapPin, Package, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AccountNavProps {
  locale: string;
  labels: {
    profile: string;
    orders: string;
    wishlist: string;
    reviews: string;
    addresses: string;
    logout: string;
  };
}

export function AccountNav({ locale, labels }: AccountNavProps) {
  const pathname = usePathname();
  const base = `/${locale}/account`;

  const items = [
    { href: base, label: labels.profile, icon: UserRound, exact: true },
    { href: `${base}/orders`, label: labels.orders, icon: Package, exact: false },
    { href: `${base}/wishlist`, label: labels.wishlist, icon: Heart, exact: false },
    { href: `${base}/reviews`, label: labels.reviews, icon: Star, exact: false },
    { href: `${base}/addresses`, label: labels.addresses, icon: MapPin, exact: false },
  ];

  return (
    <nav aria-label={labels.profile}>
      <ul className="no-scrollbar flex overflow-x-auto lg:flex-col lg:overflow-visible">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1 lg:flex-none">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  // Fluent marks the selected item with a subtle background and
                  // a brand bar on the leading edge, not a saturated fill.
                  "relative flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2",
                  "text-body-md transition-colors duration-100 ease-fluent",
                  "before:absolute before:inset-y-1.5 before:inset-inline-start-0",
                  "before:w-0.5 before:rounded-full before:bg-primary before:content-['']",
                  active
                    ? "bg-state-selected font-semibold text-on-surface before:opacity-100"
                    : "text-on-surface-variant before:opacity-0 hover:bg-state-hover hover:text-on-surface",
                )}
              >
                <item.icon aria-hidden className="size-4 shrink-0" strokeWidth={1.75} />
                {item.label}
              </Link>
            </li>
          );
        })}

        <li className="flex-1 lg:flex-none">
          <Link
            href={`/${locale}/login`}
            className="flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-body-md text-error transition-colors duration-100 ease-fluent hover:bg-error-container"
          >
            <LogOut aria-hidden className="size-4 shrink-0 rtl:rotate-180" strokeWidth={1.75} />
            {labels.logout}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
