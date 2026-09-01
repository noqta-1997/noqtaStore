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
      <ul className="no-scrollbar flex gap-px overflow-x-auto bg-outline-variant lg:flex-col lg:overflow-visible">
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
                  "flex items-center gap-2.5 whitespace-nowrap px-4 py-3 text-body-md transition-colors",
                  active
                    ? "bg-primary-container font-semibold text-on-primary-container"
                    : "bg-card text-on-surface-variant hover:bg-surface-high hover:text-on-surface",
                )}
              >
                <item.icon aria-hidden className="size-4 shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            </li>
          );
        })}

        <li className="flex-1 lg:flex-none">
          <Link
            href={`/${locale}/login`}
            className="flex items-center gap-2.5 whitespace-nowrap bg-card px-4 py-3 text-body-md text-error transition-colors hover:bg-error-container hover:text-on-error-container"
          >
            <LogOut aria-hidden className="size-4 shrink-0 rtl:rotate-180" strokeWidth={2} />
            {labels.logout}
          </Link>
        </li>
      </ul>
    </nav>
  );
}
