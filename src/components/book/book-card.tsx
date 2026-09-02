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

/**
 * The reference's shelf card: the jacket sits on its own tinted plate, and
 * everything below it is one column of running text — title and price on the
 * first line, author and the two controls on the last.
 *
 * Nothing was removed to get there. The discount and tag badges, the
 * out-of-stock and low-stock notes, the wishlist heart and the cart button
 * are all still here; they are just placed the way the reference places them.
 */
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
        "group relative flex h-full flex-col rounded-xl border border-line-divider bg-card p-3",
        "transition-[box-shadow,border-color] duration-100 ease-fluent",
        "hover:border-line-hover hover:elevation-md focus-within:border-line-hover focus-within:elevation-md",
        className,
      )}
    >
      <div className="relative mb-3 rounded-lg bg-surface-low p-3 sm:p-4">
        <BookCover
          title={book.title[locale]}
          author={book.author.name[locale]}
          seed={book.slug}
          src={book.coverUrl}
          priority={priority}
          className="elevation-sm transition-transform duration-100 ease-fluent group-hover:-translate-y-1"
        />

        <div className="absolute start-2 top-2 flex flex-col items-start gap-1.5">
          {book.compareAtPrice ? (
            <Badge tone="primary">
              {formatDiscount(book.price, book.compareAtPrice, locale)}{" "}
              {dictionary.off}
            </Badge>
          ) : null}
          {primaryTag ? (
            <Badge tone="gold">{dictionary.tags[primaryTag]}</Badge>
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
          className="absolute end-2 top-2 z-10 opacity-0 transition-opacity duration-100 ease-fluent group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
        />
      </div>

      <span className="text-label-md text-muted">{book.category.name[locale]}</span>

      <div className="mt-1 flex items-start justify-between gap-2">
        <h3 className="text-body-lg leading-snug font-bold text-balance">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            <span className="line-clamp-2">{book.title[locale]}</span>
          </Link>
        </h3>

        <PriceTag
          price={book.price}
          compareAtPrice={book.compareAtPrice}
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
          {dictionary.by} {book.author.name[locale]}
        </p>

        <div className="flex shrink-0 items-center gap-2">
          <Rating value={book.rating} locale={locale} compact />

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
            className="relative z-10 size-9 rounded-full px-0"
          />
        </div>
      </div>
    </article>
  );
}
