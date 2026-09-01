"use client";

import { Globe } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { localeNames, locales, type Locale } from "@/i18n/config";

interface LocaleSwitcherProps {
  locale: Locale;
}

/** Swaps the first path segment, keeping the reader where they are. */
export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const target = locales.find((item) => item !== locale) ?? locale;
  const segments = pathname.split("/");
  segments[1] = target;

  return (
    <Link
      href={segments.join("/") || `/${target}`}
      lang={target}
      className="inline-flex items-center gap-1.5 border border-transparent px-2 py-1.5 text-label-md text-on-surface transition-colors hover:border-line hover:bg-surface-high"
    >
      <Globe aria-hidden className="size-4" strokeWidth={2} />
      {localeNames[target]}
    </Link>
  );
}
