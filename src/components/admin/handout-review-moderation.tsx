"use client";

import { Check, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { setHandoutReviewStatus } from "@/app/actions/admin";
import { runAction } from "@/lib/action-result";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ReviewStatus } from "@/types";

interface HandoutReviewModerationProps {
  reviewId: string;
  status: ReviewStatus;
  handoutTitle: string;
  labels: {
    approve: string;
    reject: string;
    published: string;
    rejected: string;
    failure: string;
  };
}

/** `ReviewModeration` for the handout queue; publishing or rejecting recomputes the handout's rating. */
export function HandoutReviewModeration({
  reviewId,
  status,
  handoutTitle,
  labels,
}: HandoutReviewModerationProps) {
  const toast = useToast();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const moderate = async (next: ReviewStatus) => {
    setPending(true);
    const result = await runAction(setHandoutReviewStatus(reviewId, next));
    setPending(false);

    if (!result.ok) {
      toast({ title: labels.failure, tone: "error" });
      return;
    }

    toast({
      title: next === "published" ? labels.published : labels.rejected,
      description: handoutTitle,
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
        <Check aria-hidden className="size-4" strokeWidth={1.75} />
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
        <X aria-hidden className="size-4" strokeWidth={1.75} />
      </Button>
    </div>
  );
}
