import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { HandoutQuantityStepper } from "@/components/handout/handout-quantity-stepper";
import { HandoutRemoveCartItemButton } from "@/components/handout/handout-remove-cart-item-button";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/format";
import type { CartLineWithHandout } from "@/types";

interface HandoutCartLineRowProps {
  line: CartLineWithHandout;
  locale: Locale;
  dictionary: Dictionary["common"];
}

/** One handout in the cart: cover, meta, quantity control and line total. */
export function HandoutCartLineRow({ line, locale, dictionary }: HandoutCartLineRowProps) {
  const { handout } = line;

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link
        href={`/handouts/${handout.slug}`}
        className="w-20 shrink-0 sm:w-24"
        aria-label={handout.title[locale]}
      >
        <BookCover
          title={handout.title[locale]}
          author={handout.author.name[locale]}
          seed={handout.slug}
          src={handout.coverUrl}
          sizes="6rem"
          className="rounded-lg elevation-sm"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <span className="block text-label-md text-muted">
              {handout.category.name[locale]}
            </span>
            <h3 className="text-body-lg leading-snug font-bold">
              <Link
                href={`/handouts/${handout.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {handout.title[locale]}
              </Link>
            </h3>
            <p className="truncate text-label-md text-on-surface-variant">
              {dictionary.by} {handout.author.name[locale]}
            </p>
          </div>

          <HandoutRemoveCartItemButton
            handoutId={handout.id}
            label={dictionary.remove}
            successTitle={dictionary.toast.removedFromCart}
            handoutTitle={handout.title[locale]}
            failureMessage={dictionary.toast.actionFailed}
          />
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <HandoutQuantityStepper
            handoutId={handout.id}
            defaultValue={line.quantity}
            max={Math.max(handout.stock, 1)}
            labels={{
              quantity: dictionary.quantity,
              increase: dictionary.increase,
              decrease: dictionary.decrease,
            }}
          />

          <div className="text-end">
            <PriceTag
              price={line.lineTotal}
              locale={locale}
              className="justify-end"
            />
            {line.quantity > 1 ? (
              <p className="text-label-md text-muted" data-numeric>
                {formatPrice(handout.price, locale)} × {line.quantity}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
