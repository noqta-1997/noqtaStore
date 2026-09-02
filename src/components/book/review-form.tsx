"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { submitReview } from "@/app/actions/account";
import { ActionForm } from "@/components/ui/action-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface ReviewFormLabels {
  trigger: string;
  formTitle: string;
  ratingLabel: string;
  titleLabel: string;
  bodyLabel: string;
  submit: string;
  cancel: string;
  pendingNote: string;
  success: string;
  fallbackError: string;
}

interface ReviewFormProps {
  bookId: string;
  labels: ReviewFormLabels;
  errorMessages: Record<string, string>;
}

const stars = [1, 2, 3, 4, 5];

/** Collapsed until asked for, so the review list stays the focus. */
export function ReviewForm({ bookId, labels, errorMessages }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);

  if (!open) {
    return (
      <Button variant="secondary" type="button" onClick={() => setOpen(true)}>
        {labels.trigger}
      </Button>
    );
  }

  return (
    <ActionForm
      className="space-y-4 rounded-md border border-line bg-surface-low p-5"
      action={submitReview}
      successTitle={labels.success}
      errorMessages={errorMessages}
      fallbackError={labels.fallbackError}
      resetOnSuccess
    >
      <input type="hidden" name="bookId" value={bookId} />
      <input type="hidden" name="rating" value={rating} />

      <h3 className="text-headline-md">{labels.formTitle}</h3>

      <fieldset>
        <legend className="mb-2 text-label-md text-on-surface">
          {labels.ratingLabel}
        </legend>
        <div className="flex gap-1">
          {stars.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setRating(value)}
              aria-label={String(value)}
              aria-pressed={rating === value}
              className={cn(
                "flex size-9 items-center justify-center border transition-colors",
                value <= rating
                  ? "border-line bg-primary-container text-on-primary-container"
                  : "border-line-divider text-muted hover:border-line",
              )}
            >
              <Star
                aria-hidden
                className="size-4"
                strokeWidth={2}
                fill={value <= rating ? "currentColor" : "none"}
              />
            </button>
          ))}
        </div>
      </fieldset>

      <Field label={labels.titleLabel} htmlFor="review-title">
        <Input id="review-title" name="title" required maxLength={120} />
      </Field>
      <Field label={labels.bodyLabel} htmlFor="review-body">
        <Textarea id="review-body" name="body" rows={4} required maxLength={1200} />
      </Field>

      <p className="text-label-sm text-muted">{labels.pendingNote}</p>

      <div className="flex flex-wrap gap-2">
        <Button type="submit">{labels.submit}</Button>
        <Button variant="subtle" type="button" onClick={() => setOpen(false)}>
          {labels.cancel}
        </Button>
      </div>
    </ActionForm>
  );
}
