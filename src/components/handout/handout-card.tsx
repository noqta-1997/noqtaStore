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
 * The shelf card for a handout: the jacket, title and price, with the
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
        "group relative flex h-full w-full flex-col rounded-2xl border border-line-divider bg-card p-1.5 elevation-sm",
        "transition-[box-shadow,border-color] duration-100 ease-fluent",
        "hover:border-line-hover hover:elevation-md focus-within:border-line-hover focus-within:elevation-md",
        className,
      )}
    >
      <div className="relative isolate flex aspect-[3/5] flex-1 flex-col justify-end overflow-hidden rounded-xl bg-anchor p-3 text-on-anchor sm:p-4">
        <BookCover
          title={handout.title[locale]}
          author={handout.author.name[locale]}
          seed={handout.slug}
          src={handout.coverUrl}
          priority={priority}
          compact
          className="absolute inset-0 -z-10 aspect-auto h-full rounded-none transition-transform duration-300 ease-fluent group-hover:scale-105"
        />

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 -z-10 h-[85%] bg-linear-to-t from-anchor from-45% via-anchor/85 via-65% to-transparent"
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

        <h3 className="text-body-lg leading-snug font-bold text-balance text-on-anchor sm:text-headline-md">
          <Link href={href} className="after:absolute after:inset-0 after:content-['']">
            <span className="line-clamp-2">{handout.title[locale]}</span>
          </Link>
        </h3>

        <p className="mt-1 line-clamp-2 text-label-md text-on-anchor-variant sm:text-body-md">
          {dictionary.by} {handout.author.name[locale]} · {handout.subject.name[locale]} ·{" "}
          {handout.category.name[locale]}
        </p>

        <div className="mt-3 flex items-center justify-between gap-1 text-center sm:mt-4">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <Rating
              value={handout.rating}
              locale={locale}
              compact
              className="[&>span]:text-body-md [&>span]:font-bold [&>span]:text-on-anchor"
            />
            <span className="text-label-md text-on-anchor-variant">{dictionary.reviews}</span>
          </div>

          <span aria-hidden className="h-8 w-px shrink-0 bg-on-anchor-variant/50" />

          <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5">
            <PriceTag
              price={handout.price}
              compareAtPrice={handout.compareAtPrice}
              locale={locale}
              size="sm"
              className="flex-nowrap justify-center gap-1 whitespace-nowrap [&>span:first-child]:text-on-anchor [&>span+span]:text-on-anchor-variant"
            />
            <span className="text-label-md text-on-anchor-variant">
              {isSoldOut
                ? dictionary.outOfStock
                : isLowStock
                  ? dictionary.lowStock
                  : dictionary.inStock}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 sm:mt-4">
          <HandoutAddToCartButton
            handoutId={handout.id}
            size="lg"
            disabled={isSoldOut}
            label={dictionary.addToCart}
            toastTitle={dictionary.toast.addedToCart}
            toastNote={handout.title[locale]}
            signInMessage={dictionary.toast.signInRequired}
            outOfStockMessage={dictionary.outOfStock}
            failureMessage={dictionary.toast.actionFailed}
            className="relative z-10 h-10 min-w-0 flex-1 gap-1.5 rounded-full bg-on-anchor px-2 text-label-md whitespace-nowrap text-anchor max-sm:gap-0 max-sm:text-[0px] elevation-none hover:bg-on-anchor/90 hover:elevation-none active:bg-on-anchor/80"
          />

          <HandoutWishlistButton
            handoutId={handout.id}
            label={dictionary.wishlist}
            addedTitle={dictionary.toast.addedToWishlist}
            removedTitle={dictionary.toast.removedFromWishlist}
            signInMessage={dictionary.toast.signInRequired}
            handoutTitle={handout.title[locale]}
            className="relative z-10 size-10 border-on-anchor-variant/40 bg-on-anchor/15 text-on-anchor backdrop-blur-md hover:bg-on-anchor/25 hover:text-on-anchor aria-pressed:bg-primary-container aria-pressed:text-on-primary-container"
          />
        </div>
      </div>
    </article>
  );
}
