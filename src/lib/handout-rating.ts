import type { Prisma } from "@/generated/prisma/client";

/**
 * Keeps the denormalised rating on Handout in step with its published
 * reviews — `refreshBookRating` over the handout tables. Called inside the
 * transaction that changed a review so the two never drift.
 */
export async function refreshHandoutRating(
  tx: Prisma.TransactionClient,
  handoutId: string,
) {
  const stats = await tx.handoutReview.aggregate({
    where: { handoutId, status: "published" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await tx.handout.update({
    where: { id: handoutId },
    data: {
      rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewsCount: stats._count._all,
    },
  });
}
