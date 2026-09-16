import type { Prisma } from "@/generated/prisma/client";

/**
 * Thrown inside a transaction when a title cannot cover the copies asked of
 * it. The transaction rolls back with it; the caller reports `outOfStock`.
 */
export class ShortStock extends Error {
  constructor(
    readonly kind: "book" | "handout",
    readonly id: string,
  ) {
    super(`not enough copies of ${kind} ${id} on the shelf`);
    this.name = "ShortStock";
  }
}

/**
 * Takes copies off a title's shelf, or throws ShortStock.
 *
 * The WHERE clause is the check. Reading the stock first and comparing it in
 * JavaScript lets two orders for the last copy both pass and both decrement;
 * here Postgres re-evaluates `stock >= quantity` under the row lock, so the
 * second order matches nothing and the count never crosses zero. The CHECK
 * constraint on `stock` (migration 20260917080000_quantity_checks) is the
 * backstop for any path that does not come through here.
 */
export async function takeFromShelf(
  tx: Prisma.TransactionClient,
  kind: "book" | "handout",
  id: string,
  quantity: number,
): Promise<void> {
  const where = { id, stock: { gte: quantity } };
  const data = { stock: { decrement: quantity } };

  const taken =
    kind === "book"
      ? await tx.book.updateMany({ where, data })
      : await tx.handout.updateMany({ where, data });

  if (taken.count !== 1) throw new ShortStock(kind, id);
}
