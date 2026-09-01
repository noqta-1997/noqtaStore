import Link from "next/link";

import { defaultLocale, localeDirection } from "@/i18n/config";

import "@/app/globals.css";

/**
 * The root layout is a pass-through for the `[locale]` segment, so this
 * boundary — hit only by paths with no locale — renders its own document.
 */
export default function RootNotFound() {
  return (
    <html lang={defaultLocale} dir={localeDirection[defaultLocale]}>
      <body className="flex min-h-dvh items-center justify-center bg-surface p-6">
        <div className="max-w-md space-y-4 border border-line bg-card p-8 text-center">
          <p className="font-mono text-5xl font-bold text-on-surface">404</p>
          <h1 className="font-display text-2xl font-bold">الصفحة غير موجودة</h1>
          <p className="text-on-surface-variant">
            الرابط الذي فتحته غير صحيح أو أن الصفحة نُقلت.
          </p>
          <Link
            href={`/${defaultLocale}`}
            className="inline-flex h-11 items-center justify-center border border-line bg-primary-container px-5 font-semibold text-on-primary-container"
          >
            العودة إلى الرئيسية
          </Link>
        </div>
      </body>
    </html>
  );
}
