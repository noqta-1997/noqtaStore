import { Heart } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { BookGrid } from "@/components/book/book-grid";
import { AddAllToCartButton } from "@/components/commerce/add-all-to-cart-button";
import { EmptyState } from "@/components/ui/empty-state";
import { getWishlist } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatNumber } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";

interface WishlistPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: WishlistPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.account.wishlist.title };
}

export default async function WishlistPage({
  params,
  searchParams,
}: WishlistPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, allBooks] = await Promise.all([
    getDictionary(locale),
    getWishlist(),
  ]);
  const books = isEmptyPreview(await searchParams) ? [] : allBooks;

  const t = dictionary.account.wishlist;

  if (!books.length) {
    return (
      <EmptyState
        icon={Heart}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/${locale}/books`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-headline-md">{t.title}</h2>
          <p className="text-body-md text-muted">
            <span data-numeric>{formatNumber(books.length, locale)}</span>{" "}
            {t.itemsCount}
          </p>
        </div>

        <AddAllToCartButton
          label={t.moveAllToCart}
          successTitle={dictionary.common.toast.addedToCart}
          failureMessage={dictionary.common.toast.actionFailed}
        />
      </header>

      <BookGrid
        books={books}
        locale={locale}
        dictionary={dictionary.common}
        columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
        priority
      />
    </div>
  );
}
