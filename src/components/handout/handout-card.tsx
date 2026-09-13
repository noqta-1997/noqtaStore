import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { HandoutWithRelations } from "@/types";

const LOW_STOCK_THRESHOLD = 12;

interface HandoutCardProps {
  handout: HandoutWithRelations;
  locale: Locale;
  dictionary: Dictionary["common"];
  priority?: boolean;
  className?: string;
}

/**
 * The shelf card for a handout — `BookCard` pointed at `/handouts`.
 *
 * The wishlist heart and the cart button are the one thing missing: both
 * write rows that reference the books table, so they return once the cart
 * and wishlist know about handouts. Everything else on the book card is here.
 */
export function HandoutCard({
  handout,
  locale,
  dictionary,
  priority = false,
  className,
}: HandoutCardProps) {
  const href = `/handouts/${handout.slug}`;
  const isSoldOut = handout.stock === 0;
  const isLowStock = !isSoldOut && handout.stock <= LOW_STOCK_THRESHOLD;
  const primaryTag = handout.tags[0];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col rounded-xl border border-line-divider bg-card p-3",
        "transition-[box-shadow,border-color] duration-100 ease-fluent",
        "hover:border-line-hover hover:elevation-md focus-within:border-line-hover focus-within:elevation-md",
        className,
      )}
    >
      <div className="relative mb-3 rounded-lg bg-surface-low p-3 sm:p-4">
        <BookCover
          title={handout.title[locale]}
          author={handout.author.name[locale]}
          seed={handout.slug}
          src={handout.coverUrl}
          priority={priority}
          className="elevation-sm transition-transform duration-100 ease-fluent group-hover:-translate-y-1"
        />

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          {handout.compareAtPrice ? (
            <Badge tone="tint">
              {formatDiscount(handout.price, handout.compareAtPrice, locale)}{" "}
              {dictionary.off}
            </Badge>
          ) : null}
          {primaryTag ? (
            <Badge tone="muted">{dictionary.tags[primaryTag]}</Badge>
          ) : null}
          {isSoldOut ? <Badge tone="muted">{dictionary.outOfStock}</Badge> : null}
        </div>
      </div>

      <span className="text-label-md text-muted">{handout.category.name[locale]}</span>

      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="text-body-lg leading-snug font-bold text-balance">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            <span className="line-clamp-2">{handout.title[locale]}</span>
          </Link>
        </h3>

        <PriceTag
          price={handout.price}
          compareAtPrice={handout.compareAtPrice}
          locale={locale}
          size="sm"
          className="shrink-0 flex-col items-end gap-0"
        />
      </div>

      {isLowStock ? (
        <p className="mt-1 text-label-md text-warning">{dictionary.lowStock}</p>
      ) : null}

      <div className="mt-auto flex items-center justify-between gap-2 pt-3">
        <p className="min-w-0 truncate text-body-md text-muted">
          {dictionary.by} {handout.author.name[locale]}
        </p>

        <Rating value={handout.rating} locale={locale} compact />
      </div>
    </article>
  );
}
