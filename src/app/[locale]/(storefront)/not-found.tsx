"use client";

import { Home, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * `not-found.tsx` receives no route params, so the locale is read from the
 * path and the few strings it needs live here rather than in the dictionary.
 */
const copy = {
  ar: {
    code: "خطأ 404",
    title: "الصفحة غير موجودة",
    description:
      "الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت. يمكنك العودة إلى الرئيسية أو البحث عن كتاب.",
    home: "العودة إلى الرئيسية",
    search: "ابحث عن كتاب",
  },
  en: {
    code: "Error 404",
    title: "Page not found",
    description:
      "The link is wrong or the page has moved. Head back home or search for a book.",
    home: "Back to home",
    search: "Search for a book",
  },
} as const;

export default function StorefrontNotFound() {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const t = copy[locale];

  return (
    <Container className="py-16 lg:py-24">
      <div className="mx-auto max-w-lg space-y-5 border border-line bg-card p-8 text-center shadow-hard">
        <p className="label-mono text-primary">{t.code}</p>
        <p
          aria-hidden
          className="font-mono text-7xl font-bold text-on-surface"
          data-numeric
        >
          404
        </p>
        <h1 className="text-headline-lg">{t.title}</h1>
        <p className="text-body-md text-on-surface-variant">{t.description}</p>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Link href={`/${locale}`} className={buttonStyles({ size: "lg" })}>
            <Home aria-hidden className="size-4" strokeWidth={2} />
            {t.home}
          </Link>
          <Link
            href={`/${locale}/search`}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            <Search aria-hidden className="size-4" strokeWidth={2} />
            {t.search}
          </Link>
        </div>
      </div>
    </Container>
  );
}
