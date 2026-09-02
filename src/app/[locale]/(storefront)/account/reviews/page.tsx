import { MessageSquareQuote, Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BookCover } from "@/components/book/book-cover";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOwnReview } from "@/app/actions/account";
import { IconButton } from "@/components/ui/icon-button";
import { Rating } from "@/components/ui/rating";
import { getCustomerReviews } from "@/data";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types";

interface MyReviewsPageProps {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata({
  params,
}: MyReviewsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dictionary = await getDictionary(isLocale(locale) ? locale : "ar");

  return { title: dictionary.account.reviews.title };
}

const statusTones: Record<ReviewStatus, string> = {
  pending: "border-line bg-primary-fixed text-on-primary-fixed",
  published: "border-line bg-success text-on-success",
  rejected: "border-line bg-error-container text-on-error-container",
};

export default async function MyReviewsPage({
  params,
  searchParams,
}: MyReviewsPageProps) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  const [dictionary, allReviews] = await Promise.all([
    getDictionary(locale),
    getCustomerReviews(),
  ]);
  const reviews = isEmptyPreview(await searchParams) ? [] : allReviews;

  const t = dictionary.account.reviews;

  if (!reviews.length) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/${locale}/books`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md">{t.title}</h2>
        <p className="text-body-md text-muted">
          <span data-numeric>{formatNumber(reviews.length, locale)}</span>{" "}
          {t.itemsCount} — {t.subtitle}
        </p>
      </header>

      <ul className="space-y-4">
        {reviews.map((review) => (
          <li key={review.id} className="rounded-md border border-line bg-card p-4 sm:p-5">
            <div className="flex gap-4">
              <Link
                href={`/${locale}/books/${review.book.slug}`}
                className="w-16 shrink-0 sm:w-20"
                aria-label={review.book.title[locale]}
              >
                <BookCover
                  title={review.book.title[locale]}
                  author={review.book.author.name[locale]}
                  seed={review.book.slug}
                  src={review.book.coverUrl}
                  sizes="5rem"
                  className="border border-line"
                />
              </Link>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="label-mono block text-muted">{t.onBook}</span>
                    <Link
                      href={`/${locale}/books/${review.book.slug}`}
                      className="block font-display text-base font-bold underline-offset-4 hover:underline"
                    >
                      {review.book.title[locale]}
                    </Link>
                  </div>

                  <span
                    className={cn(
                      "label-mono inline-flex border px-2 py-1",
                      statusTones[review.status],
                    )}
                  >
                    {t.statuses[review.status]}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Rating value={review.rating} locale={locale} />
                  <span className="font-mono text-label-sm text-muted" data-numeric>
                    {formatDate(review.createdAt, locale)}
                  </span>
                </div>

                <div>
                  <p className="font-display text-base font-bold text-on-surface">
                    {review.title[locale]}
                  </p>
                  <p className="text-body-md leading-relaxed text-on-surface-variant">
                    {review.body[locale]}
                  </p>
                </div>

                <div className="flex items-center gap-1 border-t border-line-divider pt-3">
                  <IconButton variant="subtle" label={dictionary.common.edit}>
                    <Pencil aria-hidden className="size-4" strokeWidth={2} />
                  </IconButton>
                  <ConfirmDialog
                    action={deleteOwnReview.bind(null, review.id)}
                    fallbackError={dictionary.common.toast.actionFailed}
                    itemName={review.book.title[locale]}
                    labels={{
                      title: dictionary.common.confirm.deleteTitle,
                      description: dictionary.common.confirm.deleteDescription,
                      confirm: dictionary.common.confirm.confirm,
                      cancel: dictionary.common.confirm.cancel,
                      done: dictionary.common.toast.deleted,
                      trigger: dictionary.common.remove,
                    }}
                  />
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
