import Link from "next/link";

import { BookCover } from "@/components/book/book-cover";
import { PriceTag } from "@/components/commerce/price-tag";
import { RemoveCartItemButton } from "@/components/commerce/remove-cart-item-button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatPrice } from "@/lib/format";
import type { CartLineWithBook } from "@/types";

interface CartLineRowProps {
  line: CartLineWithBook;
  locale: Locale;
  dictionary: Dictionary["common"];
}

/** One book in the cart: cover, meta, quantity control and line total. */
export function CartLineRow({ line, locale, dictionary }: CartLineRowProps) {
  const { book } = line;

  return (
    <li className="flex gap-4 p-4 sm:p-5">
      <Link
        href={`/${locale}/books/${book.slug}`}
        className="w-20 shrink-0 sm:w-24"
        aria-label={book.title[locale]}
      >
        <BookCover
          title={book.title[locale]}
          author={book.author.name[locale]}
          seed={book.slug}
          src={book.coverUrl}
          sizes="6rem"
          className="rounded-lg elevation-sm"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <span className="block text-label-md text-muted">
              {book.category.name[locale]}
            </span>
            <h3 className="text-body-lg leading-snug font-bold">
              <Link
                href={`/${locale}/books/${book.slug}`}
                className="underline-offset-4 hover:underline"
              >
                {book.title[locale]}
              </Link>
            </h3>
            <p className="truncate text-label-md text-on-surface-variant">
              {dictionary.by} {book.author.name[locale]}
            </p>
          </div>

          <RemoveCartItemButton
            bookId={book.id}
            label={dictionary.remove}
            successTitle={dictionary.toast.removedFromCart}
            bookTitle={book.title[locale]}
            failureMessage={dictionary.toast.actionFailed}
          />
        </div>

        <div className="mt-auto flex flex-wrap items-end justify-between gap-3">
          <QuantityStepper
            bookId={book.id}
            defaultValue={line.quantity}
            max={Math.max(book.stock, 1)}
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
                {formatPrice(book.price, locale)} × {line.quantity}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </li>
  );
}
