"use client";

import { LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonStyles } from "@/components/ui/button";

/**
 * `not-found.tsx` receives no route params, so the locale comes from the
 * path and the few strings it needs live here rather than the dictionary.
 */
const copy = {
  ar: {
    code: "خطأ 404",
    title: "الصفحة غير موجودة في اللوحة",
    description: "تحقّق من الرابط أو عد إلى لوحة المعلومات.",
    action: "لوحة المعلومات",
  },
  en: {
    code: "Error 404",
    title: "Page not found in the panel",
    description: "Check the link or head back to the dashboard.",
    action: "Dashboard",
  },
} as const;

export default function AdminNotFound() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const t = copy[locale];

  return (
    <div className="mx-auto max-w-lg space-y-5 border border-line bg-card p-8 text-center shadow-hard">
      <p className="label-mono text-primary">{t.code}</p>
      <p aria-hidden className="font-mono text-6xl font-bold text-on-surface" data-numeric>
        404
      </p>
      <h1 className="text-headline-md">{t.title}</h1>
      <p className="text-body-md text-on-surface-variant">{t.description}</p>

      <Link href={`/${locale}/admin`} className={buttonStyles({ size: "lg" })}>
        <LayoutDashboard aria-hidden className="size-4" strokeWidth={2} />
        {t.action}
      </Link>
    </div>
  );
}
