"use client";

import {
  BarChart3,
  BookOpen,
  Building2,
  FolderTree,
  LayoutDashboard,
  Mail,
  NotebookText,
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
  handouts: string;
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

export function AdminNav({ labels, iconsOnly = false, onNavigate }: AdminNavProps) {
  const pathname = usePathname();
  const base = `/admin`;

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
        { href: `${base}/handouts`, label: labels.handouts, icon: NotebookText },
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
                      // The selected item is marked by its background and its
                      // weight. There was also a brand bar on the leading edge,
                      // drawn as a `before:` pseudo-element — a second marker
                      // saying what the fill already said, and in RTL it landed
                      // hard against the right rule of the rail.
                      "flex items-center gap-3 rounded-md px-3 py-2 text-body-md",
                      "transition-colors duration-100 ease-fluent",
                      iconsOnly && "lg:justify-start justify-center",
                      active
                        ? "bg-state-selected font-semibold text-on-surface"
                        : "text-on-surface-variant hover:bg-state-hover hover:text-on-surface",
                    )}
                  >
                    <item.icon aria-hidden className="size-4.5 shrink-0" strokeWidth={1.75} />
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
