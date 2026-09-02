import { Building2 } from "lucide-react";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { cn, hashString } from "@/lib/utils";
import type { Publisher } from "@/types";

const markTones = [
  "bg-primary-container text-on-primary-container",
  "bg-inverse-surface text-inverse-on-surface",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-container",
] as const;

export function publisherTone(slug: string) {
  return markTones[hashString(slug) % markTones.length];
}

interface PublisherCardProps {
  publisher: Publisher;
  locale: Locale;
  booksLabel: string;
  className?: string;
}

export function PublisherCard({
  publisher,
  locale,
  booksLabel,
  className,
}: PublisherCardProps) {
  return (
    <Link
      href={`/${locale}/publishers/${publisher.slug}`}
      className={cn(
        "group flex h-full flex-col gap-2 rounded-xl border border-line bg-card p-5",
        "transition-[box-shadow,border-color] duration-100 ease-fluent hover:border-line-hover hover:elevation-md focus-within:elevation-md",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 items-center justify-center rounded-full",
          publisherTone(publisher.slug),
        )}
      >
        <Building2 className="size-5" strokeWidth={1.75} />
      </span>

      <span className="text-body-lg leading-snug font-bold text-balance text-on-surface">
        {publisher.name[locale]}
      </span>

      {publisher.country[locale] ? (
        <span className="text-label-md text-muted">{publisher.country[locale]}</span>
      ) : null}

      <span className="mt-auto pt-2 text-label-md text-muted" data-numeric>
        {formatNumber(publisher.booksCount, locale)} {booksLabel}
      </span>
    </Link>
  );
}
