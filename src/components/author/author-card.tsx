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

export function AuthorCard({ author, locale, booksLabel, className }: AuthorCardProps) {
  return (
    <Link
      href={`/${locale}/authors/${author.slug}`}
      className={cn(
        "group flex h-full flex-col items-center gap-2 border border-line bg-card p-4 text-center",
        "transition-all duration-150 hover:-translate-y-1 hover:shadow-hard",
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-14 items-center justify-center border border-line font-display text-lg font-extrabold",
          authorTone(author.slug),
        )}
      >
        {getAuthorInitials(author.name[locale])}
      </span>

      <span className="font-display text-sm leading-snug font-bold text-balance text-on-surface">
        {author.name[locale]}
      </span>
      <span className="label-mono text-muted">{author.country[locale]}</span>
      <span className="mt-auto pt-2 font-mono text-xs text-muted" data-numeric>
        {formatNumber(author.booksCount, locale)} {booksLabel}
      </span>
    </Link>
  );
}
