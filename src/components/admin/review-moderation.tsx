"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setReviewStatus } from "@/app/actions/admin";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ReviewStatus } from "@/types";

interface ReviewModerationProps {
  reviewId: string;
  status: ReviewStatus;
  bookTitle: string;
  labels: {
    approve: string;
    reject: string;
    published: string;
    rejected: string;
    failure: string;
  };
}

/** Publishing or rejecting also recomputes the book's rating. */
export function ReviewModeration({
  reviewId,
  status,
  bookTitle,
  labels,
}: ReviewModerationProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const moderate = async (next: ReviewStatus) => {
    setPending(true);
    const result = await setReviewStatus(reviewId, next);
    setPending(false);

    if (!result.ok) {
      toast({ title: labels.failure, tone: "error" });
      return;
    }

    toast({
      title: next === "published" ? labels.published : labels.rejected,
      description: bookTitle,
      tone: next === "published" ? "success" : "info",
    });
    router.refresh();
  };

  return (
    <div className="flex items-center justify-end gap-2">
      <Button
        size="sm"
        disabled={pending || status === "published"}
        className="px-2"
        aria-label={labels.approve}
        title={labels.approve}
        onClick={() => moderate("published")}
      >
        <Check aria-hidden className="size-4" strokeWidth={2} />
      </Button>
      <Button
        variant="secondary"
        size="sm"
        disabled={pending || status === "rejected"}
        className="px-2"
        aria-label={labels.reject}
        title={labels.reject}
        onClick={() => moderate("rejected")}
      >
        <X aria-hidden className="size-4" strokeWidth={2} />
      </Button>
    </div>
  );
}
