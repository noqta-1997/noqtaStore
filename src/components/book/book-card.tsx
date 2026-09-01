import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { PriceTag } from "@/components/commerce/price-tag";
import { WishlistButton } from "@/components/commerce/wishlist-button";
import { Badge } from "@/components/ui/badge";
import { Rating } from "@/components/ui/rating";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDiscount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { BookWithRelations } from "@/types";

const LOW_STOCK_THRESHOLD = 12;

interface BookCardProps {
  book: BookWithRelations;
  locale: Locale;
  dictionary: Dictionary["common"];
  priority?: boolean;
  className?: string;
}

export function BookCard({
  book,
  locale,
  dictionary,
  priority = false,
  className,
}: BookCardProps) {
  const href = `/${locale}/books/${book.slug}`;
  const isSoldOut = book.stock === 0;
  const isLowStock = !isSoldOut && book.stock <= LOW_STOCK_THRESHOLD;
  const primaryTag = book.tags[0];

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col border border-line bg-card",
        "transition-all duration-150 hover:-translate-y-1 hover:shadow-hard",
        "focus-within:-translate-y-1 focus-within:shadow-hard",
        className,
      )}
    >
      <div className="relative border-b border-line">
        <BookCover
          title={book.title[locale]}
          author={book.author.name[locale]}
          seed={book.slug}
          src={book.coverUrl}
          priority={priority}
        />

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          {book.compareAtPrice ? (
            <Badge tone="primary">
              {formatDiscount(book.price, book.compareAtPrice, locale)}{" "}
              {dictionary.off}
            </Badge>
          ) : null}
          {primaryTag ? (
            <Badge tone="ink">{dictionary.tags[primaryTag]}</Badge>
          ) : null}
          {isSoldOut ? <Badge tone="muted">{dictionary.outOfStock}</Badge> : null}
        </div>

        <WishlistButton
          bookId={book.id}
          locale={locale}
          label={dictionary.wishlist}
          addedTitle={dictionary.toast.addedToWishlist}
          removedTitle={dictionary.toast.removedFromWishlist}
          signInMessage={dictionary.toast.signInRequired}
          bookTitle={book.title[locale]}
          className="absolute end-2 top-2 z-10 opacity-0 transition-opacity duration-150 group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
        />
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="label-mono text-muted">
          {book.category.name[locale]}
        </span>

        <h3 className="font-display text-base leading-snug font-bold text-balance">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            <span className="line-clamp-2">{book.title[locale]}</span>
          </Link>
        </h3>

        <p className="truncate text-sm text-on-surface-variant">
          {dictionary.by} {book.author.name[locale]}
        </p>

        <Rating
          value={book.rating}
          count={book.reviewsCount}
          locale={locale}
          className="mt-0.5"
        />

        <div className="mt-auto flex items-end justify-between gap-2 border-t border-outline-variant pt-3">
          <div className="min-w-0">
            <PriceTag
              price={book.price}
              compareAtPrice={book.compareAtPrice}
              locale={locale}
            />
            {isLowStock ? (
              <p className="mt-0.5 font-mono text-[0.625rem] text-warning">
                {dictionary.lowStock}
              </p>
            ) : null}
          </div>

          <AddToCartButton
            bookId={book.id}
            locale={locale}
            size="sm"
            iconOnly
            disabled={isSoldOut}
            label={dictionary.addToCart}
            toastTitle={dictionary.toast.addedToCart}
            toastNote={book.title[locale]}
            signInMessage={dictionary.toast.signInRequired}
            outOfStockMessage={dictionary.outOfStock}
            failureMessage={dictionary.toast.actionFailed}
            className="relative z-10 size-10 shrink-0"
          />
        </div>
      </div>
    </article>
  );
}
