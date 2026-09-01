"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  FolderTree,
  LayoutDashboard,
  Mail,
  Package,
  PenLine,
  Settings,
  Star,
  TicketPercent,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

export interface AdminNavLabels {
  sectionMain: string;
  sectionCatalogue: string;
  sectionSales: string;
  sectionSystem: string;
  dashboard: string;
  books: string;
  categories: string;
  authors: string;
  publishers: string;
  orders: string;
  customers: string;
  reviews: string;
  messages: string;
  coupons: string;
  reports: string;
  settings: string;
}

interface AdminNavProps {
  locale: string;
  labels: AdminNavLabels;
  /** Hides the labels so the nav collapses to an icon rail. */
  iconsOnly?: boolean;
  onNavigate?: () => void;
}

interface NavEntry {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
}

export function AdminNav({ locale, labels, iconsOnly = false, onNavigate }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;

  const sections: { title: string; items: NavEntry[] }[] = [
    {
      title: labels.sectionMain,
      items: [
        { href: base, label: labels.dashboard, icon: LayoutDashboard, exact: true },
      ],
    },
    {
      title: labels.sectionCatalogue,
      items: [
        { href: `${base}/books`, label: labels.books, icon: BookOpen },
        { href: `${base}/categories`, label: labels.categories, icon: FolderTree },
        { href: `${base}/authors`, label: labels.authors, icon: PenLine },
        { href: `${base}/publishers`, label: labels.publishers, icon: Building2 },
      ],
    },
    {
      title: labels.sectionSales,
      items: [
        { href: `${base}/orders`, label: labels.orders, icon: Package },
        { href: `${base}/customers`, label: labels.customers, icon: Users },
        { href: `${base}/reviews`, label: labels.reviews, icon: Star },
        { href: `${base}/messages`, label: labels.messages, icon: Mail },
        { href: `${base}/coupons`, label: labels.coupons, icon: TicketPercent },
      ],
    },
    {
      title: labels.sectionSystem,
      items: [
        { href: `${base}/reports`, label: labels.reports, icon: BarChart3 },
        { href: `${base}/settings`, label: labels.settings, icon: Settings },
      ],
    },
  ];

  return (
    <nav className="space-y-6 py-4">
      {sections.map((section) => (
        <div key={section.title}>
          <p
            className={cn(
              "label-mono mb-2 px-4 text-muted",
              iconsOnly && "lg:block hidden",
            )}
          >
            {iconsOnly ? <span className="lg:hidden">·</span> : null}
            <span className={cn(iconsOnly && "hidden lg:inline")}>{section.title}</span>
          </p>

          <ul className="space-y-0.5 px-2">
            {section.items.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={item.label}
                    className={cn(
                      "flex items-center gap-3 border px-3 py-2.5 text-body-md transition-colors",
                      iconsOnly && "lg:justify-start justify-center",
                      active
                        ? "border-line bg-primary-container font-semibold text-on-primary-container"
                        : "border-transparent text-on-surface-variant hover:border-line hover:bg-surface-high hover:text-on-surface",
                    )}
                  >
                    <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={2} />
                    <span className={cn(iconsOnly && "hidden lg:inline")}>
                      {item.label}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
