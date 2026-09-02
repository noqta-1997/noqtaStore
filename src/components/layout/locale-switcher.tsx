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
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-body-md text-on-surface-variant transition-colors duration-100 ease-fluent hover:bg-state-hover hover:text-on-surface"
    >
      <Globe aria-hidden className="size-4" strokeWidth={1.75} />
      {localeNames[target]}
    </Link>
  );
}
