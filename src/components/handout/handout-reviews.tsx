import { MessageSquareQuote } from "lucide-react";

import { HandoutReviewForm } from "@/components/handout/handout-review-form";
import { Rating } from "@/components/ui/rating";
import { Surface } from "@/components/ui/surface";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/get-dictionary";
import { formatDate, formatNumber } from "@/lib/format";
import type { HandoutReview, HandoutWithRelations } from "@/types";

interface HandoutReviewsProps {
  handout: HandoutWithRelations;
  reviews: HandoutReview[];
  locale: Locale;
  dictionary: Dictionary;
}

/** Rating summary with distribution bars, followed by the review list. */
export function HandoutReviews({ handout, reviews, locale, dictionary }: HandoutReviewsProps) {
  const t = dictionary.handoutDetails.reviewsSection;

  const distribution = [5, 4, 3, 2, 1].map((stars) => {
    const count = reviews.filter((review) => review.rating === stars).length;
    const share = reviews.length ? Math.round((count / reviews.length) * 100) : 0;
    return { stars, count, share };
  });

  return (
    <div className="space-y-8">
      <div className="grid gap-6 sm:grid-cols-12 sm:items-center">
        <Surface
          appearance="filled-alternative"
          className="space-y-2 p-6 text-center sm:col-span-4"
        >
          <p className="font-display text-5xl font-bold text-on-surface" data-numeric>
            {handout.rating.toFixed(1)}
          </p>
          <p className="text-label-md text-muted">{t.averageOf}</p>
          <Rating value={handout.rating} locale={locale} size="md" className="justify-center" />
          <p className="text-label-md text-muted">
            {t.basedOn}{" "}
            <span data-numeric>{formatNumber(handout.reviewsCount, locale)}</span>{" "}
            {dictionary.common.reviews}
          </p>
        </Surface>

        <ul className="space-y-2 sm:col-span-8">
          {distribution.map((row) => (
            <li key={row.stars} className="flex items-center gap-3">
              <span className="w-4 text-label-md text-muted" data-numeric>
                {row.stars}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-low">
                <span
                  className="block h-full rounded-full bg-gold"
                  style={{ width: `${row.share}%` }}
                />
              </span>
              <span className="w-10 text-end text-label-md text-muted" data-numeric>
                {row.share}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {reviews.length ? (
        <ul className="divide-y divide-line-divider border-t border-line-divider">
          {reviews.map((review) => (
            <li key={review.id} className="py-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="flex size-10 items-center justify-center rounded-full bg-primary-fixed text-body-md font-bold text-primary"
                  >
                    {review.authorName.slice(0, 1)}
                  </span>
                  <div>
                    <p className="text-body-md font-semibold text-on-surface">
                      {review.authorName}
                    </p>
                    <p className="text-label-md text-muted">
                      {formatDate(review.createdAt, locale)}
                    </p>
                  </div>
                </div>
                <Rating value={review.rating} locale={locale} />
              </div>

              <h3 className="mt-3 text-body-lg font-bold">
                {review.title[locale]}
              </h3>
              <p className="mt-1 text-body-md leading-relaxed text-on-surface-variant">
                {review.body[locale]}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-outline p-8 text-center">
          <MessageSquareQuote aria-hidden className="size-6 text-muted" strokeWidth={1.75} />
          <p className="text-body-md text-muted">{t.empty}</p>
        </div>
      )}

      <HandoutReviewForm
        handoutId={handout.id}
        errorMessages={dictionary.common.actionErrors}
        labels={{
          trigger: t.writeReview,
          formTitle: t.formTitle,
          ratingLabel: t.ratingLabel,
          titleLabel: t.titleLabel,
          bodyLabel: t.bodyLabel,
          submit: t.submit,
          cancel: t.cancel,
          pendingNote: t.pendingNote,
          success: dictionary.common.toast.reviewSubmitted,
          fallbackError: dictionary.common.toast.actionFailed,
        }}
      />
    </div>
  );
}
