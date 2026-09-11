"use client";

import { Home, RotateCcw } from "lucide-react";
import Link from "next/link";

import { Button, buttonStyles } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

/**
 * `error.tsx` boundaries are client components with no route params, so they
 * cannot load the dictionary; the handful of strings live here instead. They
 * used to come in two languages picked by sniffing the path for `/en` — the
 * English half went with the English site.
 */
const t = {
  code: "خطأ في التطبيق",
  title: "حدث خطأ غير متوقع",
  description:
    "تعذّر عرض هذا الجزء. جرّب إعادة المحاولة، وإن استمرت المشكلة عد إلى الرئيسية.",
  retry: "إعادة المحاولة",
  home: "العودة إلى الرئيسية",
} as const;

interface ErrorScreenProps {
  reset: () => void;
  /** Next passes a digest for server errors; shown for support. */
  digest?: string;
}

export function ErrorScreen({ reset, digest }: ErrorScreenProps) {
  return (
    <Container className="py-16 lg:py-24">
      <div className="mx-auto max-w-lg space-y-5 rounded-2xl border border-line bg-card p-8 text-center elevation-md">
        <p className="label-mono text-error">{t.code}</p>
        <h1 className="text-headline-lg">{t.title}</h1>
        <p className="text-body-md text-on-surface-variant">{t.description}</p>

        {digest ? (
          <p className="rounded-md border border-outline bg-surface-low px-3 py-2 text-label-md text-muted">
            {digest}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={reset}>
            <RotateCcw aria-hidden className="size-4" strokeWidth={1.75} />
            {t.retry}
          </Button>
          <Link
            href={"/"}
            className={buttonStyles({ variant: "secondary", size: "lg" })}
          >
            <Home aria-hidden className="size-4" strokeWidth={1.75} />
            {t.home}
          </Link>
        </div>
      </div>
    </Container>
  );
}
