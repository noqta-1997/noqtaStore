"use client";

import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button, buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * `error.tsx` boundaries receive no route params, so the locale comes from
 * the path and the handful of strings live here rather than the dictionary.
 */
const copy = {
  ar: {
    code: "خطأ في التطبيق",
    title: "حدث خطأ غير متوقع",
    description:
      "تعذّر عرض هذا الجزء. جرّب إعادة المحاولة، وإن استمرت المشكلة عد إلى الرئيسية.",
    retry: "إعادة المحاولة",
    home: "العودة إلى الرئيسية",
  },
  en: {
    code: "Application error",
    title: "Something went wrong",
    description:
      "This section could not be rendered. Try again, and head home if the problem persists.",
    retry: "Try again",
    home: "Back to home",
  },
} as const;

interface ErrorScreenProps {
  reset: () => void;
  /** Next passes a digest for server errors; shown for support. */
  digest?: string;
}

export function ErrorScreen({ reset, digest }: ErrorScreenProps) {
  const pathname = usePathname();
  const locale = pathname.startsWith("/en") ? "en" : "ar";
  const t = copy[locale];

  return (
    <Container className="py-16 lg:py-24">
      <div className="mx-auto max-w-lg space-y-5 rounded-md border border-line bg-card p-8 text-center elevation-md">
        <p className="label-mono text-error">{t.code}</p>
        <h1 className="text-headline-lg">{t.title}</h1>
        <p className="text-body-md text-on-surface-variant">{t.description}</p>

        {digest ? (
          <p className="border border-outline bg-surface-low px-3 py-2 font-mono text-label-sm text-muted">
            {digest}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden className="size-4" strokeWidth={2} />
            {t.retry}
          </Button>
          <Link
            href={`/${locale}`}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            <Home aria-hidden className="size-4" strokeWidth={2} />
            {t.home}
          </Link>
        </div>
      </div>
    </Container>
  );
}
