import { MessageSquareQuote, Pencil } from "lucide-react";
import type { Metadata } from "next";

import { BookCover } from "@/components/book/book-cover";
import { TitleLink } from "@/components/book/title-link";
import { EmptyState } from "@/components/ui/empty-state";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteOwnHandoutReview } from "@/app/actions/account";
import { IconButton } from "@/components/ui/icon-button";
import { Rating } from "@/components/ui/rating";
import { getCustomerHandoutReviews } from "@/data";
import { defaultLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber } from "@/lib/format";
import { isEmptyPreview, type SearchParamsRecord } from "@/lib/search-params";
import { cn } from "@/lib/utils";
import type { ReviewStatus } from "@/types";

interface MyReviewsPageProps {
  searchParams: Promise<SearchParamsRecord>;
}

export async function generateMetadata(): Promise<Metadata> {
  const dictionary = await getDictionary(defaultLocale);

  return { title: dictionary.account.reviews.title };
}

const statusTones: Record<ReviewStatus, string> = {
  pending: "border-line bg-primary-fixed text-on-primary-fixed",
  published: "border-line bg-success text-on-success",
  rejected: "border-line bg-error-container text-on-error-container",
};

export default async function MyReviewsPage({
  searchParams,
}: MyReviewsPageProps) {
  const locale = defaultLocale;

  const [dictionary, allHandoutReviews] = await Promise.all([
    getDictionary(locale),
    getCustomerHandoutReviews(),
  ]);
  const previewEmpty = isEmptyPreview(await searchParams);
  const handoutReviews = previewEmpty ? [] : allHandoutReviews;

  const t = dictionary.account.reviews;

  if (!handoutReviews.length) {
    return (
      <EmptyState
        icon={MessageSquareQuote}
        title={t.empty.title}
        description={t.empty.description}
        actionLabel={t.empty.action}
        actionHref={`/handouts`}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h2 className="text-headline-md">{t.title}</h2>
        <p className="text-body-md text-muted">
          <span data-numeric>{formatNumber(handoutReviews.length, locale)}</span>{" "}
          {t.itemsCount} — {t.subtitle}
        </p>
      </header>

      <ul className="space-y-4">
        {handoutReviews.map((review) => (
          <li key={review.id} className="rounded-xl border border-line bg-card p-4 sm:p-5">
            <div className="flex gap-4">
              <TitleLink
                href={`/handouts/${review.handout.slug}`}
                archived={review.handout.archived}
                className="w-16 shrink-0 sm:w-20"
                aria-label={review.handout.title[locale]}
              >
                <BookCover
                  title={review.handout.title[locale]}
                  author={review.handout.author.name[locale]}
                  seed={review.handout.slug}
                  src={review.handout.coverUrl}
                  sizes="5rem"
                  className="border border-line"
                />
              </TitleLink>

              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="label-mono block text-muted">{t.onHandout}</span>
                    <TitleLink
                      href={`/handouts/${review.handout.slug}`}
                      archived={review.handout.archived}
                      archivedNote={dictionary.common.noLongerOnSale}
                      className="block font-display text-base font-bold underline-offset-4 hover:underline"
                    >
                      {review.handout.title[locale]}
                    </TitleLink>
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
                  <span className="text-label-sm text-muted" data-numeric>
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
                    <Pencil aria-hidden className="size-4" strokeWidth={1.75} />
                  </IconButton>
                  <ConfirmDialog
                    action={deleteOwnHandoutReview.bind(null, review.id)}
                    fallbackError={dictionary.common.toast.actionFailed}
                    itemName={review.handout.title[locale]}
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
