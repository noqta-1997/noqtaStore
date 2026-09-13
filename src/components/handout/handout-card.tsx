import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { HandoutAddToCartButton } from "@/components/handout/handout-add-to-cart-button";
import { HandoutWishlistButton } from "@/components/handout/handout-wishlist-button";
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
 * The shelf card for a handout — `BookCard` pointed at `/handouts`, with the
 * wishlist heart and the cart button writing to the handout tables.
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

        <HandoutWishlistButton
          handoutId={handout.id}
          label={dictionary.wishlist}
          addedTitle={dictionary.toast.addedToWishlist}
          removedTitle={dictionary.toast.removedFromWishlist}
          signInMessage={dictionary.toast.signInRequired}
          handoutTitle={handout.title[locale]}
          className="absolute end-2 top-2 z-10 opacity-0 transition-opacity duration-100 ease-fluent group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
        />
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

        <div className="flex shrink-0 items-center gap-2">
          <Rating value={handout.rating} locale={locale} compact />

          <HandoutAddToCartButton
            handoutId={handout.id}
            size="sm"
            iconOnly
            disabled={isSoldOut}
            label={dictionary.addToCart}
            toastTitle={dictionary.toast.addedToCart}
            toastNote={handout.title[locale]}
            signInMessage={dictionary.toast.signInRequired}
            outOfStockMessage={dictionary.outOfStock}
            failureMessage={dictionary.toast.actionFailed}
            className="relative z-10 size-9 rounded-full px-0"
          />
        </div>
      </div>
    </article>
  );
}
