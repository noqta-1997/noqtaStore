import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { BookGrid } from "@/components/book/book-grid";
import { AddAllToCartButton } from "@/components/commerce/add-all-to-cart-button";
import { HandoutGrid } from "@/components/handout/handout-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { getHandoutWishlist, getWishlist } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface WishlistPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.wishlist.title };
}

export default async function WishlistPage({
  searchParams,
}: WishlistPageProps) {
  const locale = defaultLocale;

  const [dictionary, allBooks, allHandouts] = await Promise.all([
    getDictionary(locale),
    getWishlist(),
    getHandoutWishlist(),
  ]);
  const previewEmpty = isEmptyPreview(await searchParams);
  const books = previewEmpty ? [] : allBooks;
  const handouts = previewEmpty ? [] : allHandouts;

  const t = dictionary.account.wishlist;

  if (!books.length && !handouts.length) {
    return (
      <EmptyState
        icon={Heart}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/books`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-headline-md">{t.title}</h2>
          <p className="text-body-md text-muted">
            {books.length ? (
              <>
                <span data-numeric>{formatNumber(books.length, locale)}</span>{" "}
                {t.itemsCount}
              </>
            ) : null}
            {books.length && handouts.length ? " · " : null}
            {handouts.length ? (
              <>
                <span data-numeric>{formatNumber(handouts.length, locale)}</span>{" "}
                {t.handoutsCount}
              </>
            ) : null}
          </p>
        </div>

        <AddAllToCartButton
          label={t.moveAllToCart}
          successTitle={dictionary.common.toast.addedToCart}
          failureMessage={dictionary.common.toast.actionFailed}
        />
      </header>

      {books.length ? (
        <BookGrid
          books={books}
          locale={locale}
          dictionary={dictionary.common}
          columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
          priority
        />
      ) : null}

      {handouts.length ? (
        <section className="space-y-4">
          <h3 className="text-headline-md">{t.handoutsTitle}</h3>
          <HandoutGrid
            handouts={handouts}
            locale={locale}
            dictionary={dictionary.common}
            columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
            priority={!books.length}
          />
        </section>
      ) : null}
    </div>
  );
}
