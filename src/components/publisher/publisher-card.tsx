import { Building2 } from "lucide-react";
import Image from "next/image";
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

interface PublisherMarkProps {
  publisher: Pick<Publisher, "slug" | "logoUrl">;
  /** The circle's size, e.g. `size-11`. */
  className?: string;
  /** The building glyph's size when there is no logo. */
  iconClassName?: string;
}

/**
 * The press's round mark: its uploaded logo, or a building on a tone picked
 * from its slug. A logo sits on a white plate in both themes — it is the
 * press's own artwork, usually dark ink drawn for paper, and would vanish on
 * the dark card.
 */
export function PublisherMark({ publisher, className, iconClassName }: PublisherMarkProps) {
  if (publisher.logoUrl) {
    return (
      <span
        aria-hidden
        className={cn(
          "relative flex shrink-0 overflow-hidden rounded-full border border-line bg-[#fff]",
          className,
        )}
      >
        <Image src={publisher.logoUrl} alt="" fill sizes="5rem" className="object-contain p-[12%]" />
      </span>
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        publisherTone(publisher.slug),
        className,
      )}
    >
      <Building2 className={iconClassName} strokeWidth={1.75} />
    </span>
  );
}

interface PublisherCardProps {
  publisher: Publisher;
  locale: Locale;
  /** The word after the count: «ملزمة». */
  countLabel: string;
  className?: string;
}

export function PublisherCard({
  publisher,
  locale,
  countLabel,
  className,
}: PublisherCardProps) {
  return (
    <Link
      href={`/publishers/${publisher.slug}`}
      className={cn(
        "group flex h-full flex-col gap-2 rounded-xl border border-line bg-card p-5",
        "transition-[box-shadow,border-color] duration-100 ease-fluent hover:border-line-hover hover:elevation-md focus-within:elevation-md",
        className,
      )}
    >
      <PublisherMark publisher={publisher} className="size-11" iconClassName="size-5" />

      <span className="text-body-lg leading-snug font-bold text-balance text-on-surface">
        {publisher.name[locale]}
      </span>

      <span className="mt-auto pt-2 text-label-md text-muted" data-numeric>
        {formatNumber(publisher.handoutsCount, locale)} {countLabel}
      </span>
    </Link>
  );
}
