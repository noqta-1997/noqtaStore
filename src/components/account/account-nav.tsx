"use client";

import { Heart, LogOut, MapPin, Package, Star, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

interface AccountNavProps {
  labels: {
    profile: string;
    orders: string;
    wishlist: string;
    reviews: string;
    addresses: string;
    logout: string;
  };
}

export function AccountNav({ labels }: AccountNavProps) {
  const pathname = usePathname();
  const base = `/account`;

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
                  // The selected item is marked by its background and its
                  // weight, the same way the admin rail marks its own. The
                  // brand bar that used to sit on the leading edge — a
                  // `before:` pseudo-element — is gone from both.
                  "flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2",
                  "text-body-md transition-colors duration-100 ease-fluent",
                  active
                    ? "bg-state-selected font-semibold text-on-surface"
                    : "text-on-surface-variant hover:bg-state-hover hover:text-on-surface",
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
            href={`/login`}
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
