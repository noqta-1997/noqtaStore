import { ChevronRight } from "lucide-react";
import Link from "next/link";

import type { Locale } from "@/i18n/config";
import { formatNumber } from "@/lib/format";
import { cn, hashString } from "@/lib/utils";
import type { Author } from "@/types";

const avatarTones = [
  "bg-primary-container text-on-primary-container",
  "bg-inverse-surface text-inverse-on-surface",
  "bg-tertiary-container text-on-tertiary-container",
  "bg-secondary-container text-on-secondary-container",
] as const;

export function getAuthorInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
}

export function authorTone(slug: string) {
  return avatarTones[hashString(slug) % avatarTones.length];
}

interface AuthorCardProps {
  author: Author;
  locale: Locale;
  booksLabel: string;
  className?: string;
}

/**
 * The reference's author chip: a round portrait, the name, and a chevron —
 * laid out along the line rather than stacked. The country and the book count
 * are still here, on the second line, because they were here before.
 */
export function AuthorCard({ author, locale, booksLabel, className }: AuthorCardProps) {
  return (
    <Link
      href={`/authors/${author.slug}`}
      className={cn(
        "group flex h-full items-center gap-3 rounded-full border border-line bg-card p-2 pe-4",
        "transition-[box-shadow,border-color] duration-100 ease-fluent",
        "hover:border-line-hover hover:elevation-md focus-within:elevation-md",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-11 shrink-0 items-center justify-center rounded-full font-display text-body-lg font-bold",
          authorTone(author.slug),
        )}
      >
        {getAuthorInitials(author.name[locale])}
      </span>

      <span className="flex min-w-0 flex-col">
        <span className="truncate text-body-md font-semibold text-on-surface">
          {author.name[locale]}
        </span>
        <span className="truncate text-label-md text-muted">
          {author.country[locale]} ·{" "}
          <span data-numeric>{formatNumber(author.booksCount, locale)}</span>{" "}
          {booksLabel}
        </span>
      </span>

      <ChevronRight
        aria-hidden
        className="ms-auto size-4 shrink-0 text-muted transition-transform duration-100 ease-fluent group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5"
        strokeWidth={1.75}
      />
    </Link>
  );
}
