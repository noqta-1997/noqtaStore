import { Coins, ExternalLink, Pencil, ShoppingBag, Star } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeader } from "@/components/admin/admin-page-header";
import { Panel } from "@/components/admin/panel";
import { StatCard } from "@/components/admin/stat-card";
import { BookCover } from "@/components/book/book-cover";
import { BookSpecs } from "@/components/book/book-specs";
import { PriceTag } from "@/components/commerce/price-tag";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { Rating } from "@/components/ui/rating";
import { getBookById, getReviewsByBook, getTopBooks } from "@/data";
import { isLocale } from "@/i18n/config";
import { getAdminDictionary, getDictionary } from "@/i18n/get-dictionary";
import { formatCompactPrice, formatDate, formatNumber } from "@/lib/format";

interface AdminBookPageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({
  params,
}: AdminBookPageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const [admin, book] = await Promise.all([
    getAdminDictionary(isLocale(locale) ? locale : "ar"),
    getBookById(id),
  ]);

  return {
    title: `${book?.title[isLocale(locale) ? locale : "ar"] ?? admin.bookDetails.title} — ${admin.brand.panel}`,
  };
}

export default async function AdminBookPage({ params }: AdminBookPageProps) {
  const { locale, id } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  const [dictionary, admin, reviews, top] = await Promise.all([
    getDictionary(locale),
    getAdminDictionary(locale),
    getReviewsByBook(book.id),
    getTopBooks(),
  ]);

  const t = admin.bookDetails;
  const sales = top.find((entry) => entry.bookId === book.id);
  const sold = sales?.sold ?? Math.round(book.reviewsCount / 6);
  const revenue = sales?.revenue ?? sold * book.price;

  return (
    <>
      <AdminPageHeader
        title={book.title[locale]}
        subtitle={`${dictionary.common.by} ${book.author.name[locale]}`}
        actions={
          <>
            <Link
              href={`/${locale}/books/${book.slug}`}
              className={buttonStyles({ variant: "secondary", size: "md" })}
            >
              <ExternalLink aria-hidden className="size-4 rtl:-scale-x-100" strokeWidth={2} />
              {t.viewInStore}
            </Link>
            <Link
              href={`/${locale}/admin/books/${book.id}/edit`}
              className={buttonStyles({ size: "md" })}
            >
              <Pencil aria-hidden className="size-4" strokeWidth={2} />
              {admin.common.edit}
            </Link>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={ShoppingBag}
          label={t.stats.sold}
          value={formatNumber(sold, locale)}
        />
        <StatCard
          icon={Coins}
          label={t.stats.revenue}
          value={formatCompactPrice(revenue, locale)}
        />
        <StatCard
          icon={Star}
          label={t.stats.rating}
          value={book.rating.toFixed(1)}
        />
        <StatCard
          icon={Star}
          label={t.stats.reviews}
          value={formatNumber(book.reviewsCount, locale)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Panel title={t.overview} className="min-w-0 lg:col-span-8">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="w-32 shrink-0">
              <BookCover
                title={book.title[locale]}
                author={book.author.name[locale]}
                seed={book.slug}
                src={book.coverUrl}
                sizes="8rem"
                className="border border-line"
              />
            </div>

            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="outline">{book.category.name[locale]}</Badge>
                {book.tags.map((tag) => (
                  <Badge key={tag} tone="primary">
                    {dictionary.common.tags[tag]}
                  </Badge>
                ))}
              </div>

              <PriceTag
                price={book.price}
                compareAtPrice={book.compareAtPrice}
                locale={locale}
                size="lg"
              />
              <Rating value={book.rating} count={book.reviewsCount} locale={locale} size="md" />

              <p className="text-body-md leading-relaxed text-on-surface-variant">
                {book.description[locale]}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title={t.specs} className="min-w-0 lg:col-span-4">
          <BookSpecs book={book} locale={locale} dictionary={dictionary} />
        </Panel>
      </div>

      <Panel title={t.recentReviews} flush>
        {reviews.length ? (
          <ul className="divide-y divide-outline-variant">
            {reviews.map((review) => (
              <li key={review.id} className="space-y-1.5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-on-surface">
                    {review.authorName}
                  </span>
                  <div className="flex items-center gap-3">
                    <Rating value={review.rating} locale={locale} />
                    <span className="font-mono text-label-sm text-muted" data-numeric>
                      {formatDate(review.createdAt, locale)}
                    </span>
                  </div>
                </div>
                <p className="font-display text-base font-bold">{review.title[locale]}</p>
                <p className="text-body-md text-on-surface-variant">{review.body[locale]}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-5 text-body-md text-muted">
            {dictionary.bookDetails.reviewsSection.empty}
          </p>
        )}
      </Panel>
    </>
  );
}
