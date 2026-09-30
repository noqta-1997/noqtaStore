import { Heart } from "lucide-react";
import type { Metadata } from "next";

import { AddAllToCartButton } from "@/components/commerce/add-all-to-cart-button";
import { HandoutGrid } from "@/components/handout/handout-grid";
import { EmptyState } from "@/components/ui/empty-state";
import { getHandoutWishlist } from "@/data";
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

  const [dictionary, allHandouts] = await Promise.all([
    getDictionary(locale),
    getHandoutWishlist(),
  ]);
  const previewEmpty = isEmptyPreview(await searchParams);
  const handouts = previewEmpty ? [] : allHandouts;

  const t = dictionary.account.wishlist;

  if (!handouts.length) {
    return (
      <EmptyState
        icon={Heart}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/handouts`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-headline-md">{t.title}</h2>
          <p className="text-body-md text-muted">
            <span data-numeric>{formatNumber(handouts.length, locale)}</span>{" "}
            {t.handoutsCount}
          </p>
        </div>

        <AddAllToCartButton
          label={t.moveAllToCart}
          successTitle={dictionary.common.toast.addedToCart}
          failureMessage={dictionary.common.toast.actionFailed}
        />
      </header>

      <HandoutGrid
        handouts={handouts}
        locale={locale}
        dictionary={dictionary.common}
        columns="grid-cols-2 sm:grid-cols-3 xl:grid-cols-4"
        priority
      />
    </div>
  );
}
