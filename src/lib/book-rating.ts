import type { Prisma } from "@/generated/prisma/client";

/**
 * Keeps the denormalised rating on Book in step with its published reviews.
 * Called inside the transaction that changed a review so the two never drift.
 */
export async function refreshBookRating(
  tx: Prisma.TransactionClient,
  bookId: string,
) {
  const stats = await tx.review.aggregate({
    where: { bookId, status: "published" },
    _avg: { rating: true },
    _count: { _all: true },
  });

  await tx.book.update({
    where: { id: bookId },
    data: {
      rating: Math.round((stats._avg.rating ?? 0) * 10) / 10,
      reviewsCount: stats._count._all,
    },
  });
}
