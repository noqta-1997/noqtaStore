import { cookies } from "next/headers";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * The code a reader applied in the cart. It rides in a cookie rather than a
 * table row: it belongs to the browsing session, survives the hop from cart
 * to checkout, and costs nothing to discard.
 */
export const COUPON_COOKIE = "noqta-coupon";

export interface AppliedCoupon {
  code: string;
  discount: number;
}

/** Percentage codes are capped at the subtotal so a total can never go negative. */
export function discountFor(
  coupon: { type: "percentage" | "fixed"; value: number },
  subtotal: number,
): number {
  const raw =
    coupon.type === "percentage"
      ? Math.round((subtotal * coupon.value) / 100)
      : coupon.value;

  return Math.min(Math.max(raw, 0), subtotal);
}

/**
 * Why a code is refused, or the discount it is worth right now. Validity is
 * re-checked on every read: a code can expire or sell out between the cart
 * and the confirmed order.
 */
export async function evaluateCoupon(
  code: string,
  subtotal: number,
): Promise<
  | { ok: true; coupon: AppliedCoupon }
  | { ok: false; error: "unknownCoupon" | "expiredCoupon" | "couponMinimum" }
> {
  const coupon = await prisma.coupon.findUnique({
    where: { code: code.trim().toUpperCase() },
  });

  if (!coupon || !coupon.active) return { ok: false, error: "unknownCoupon" };

  const exhausted =
    coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit;
  const expired = coupon.expiresAt !== null && coupon.expiresAt < new Date();

  if (exhausted || expired) return { ok: false, error: "expiredCoupon" };
  if (subtotal < coupon.minSubtotal) return { ok: false, error: "couponMinimum" };

  return {
    ok: true,
    coupon: { code: coupon.code, discount: discountFor(coupon, subtotal) },
  };
}

/**
 * Thrown inside the checkout transaction when the code has no use left, or
 * stopped being valid, by the time the order is written. The transaction
 * rolls back with it.
 */
export class CouponSpent extends Error {
  constructor(readonly code: string) {
    super(`coupon ${code} has no use left`);
    this.name = "CouponSpent";
  }
}

/**
 * Spends one use of a code, or throws CouponSpent.
 *
 * `evaluateCoupon` answered a moment ago, but the last use can go to another
 * order in between; as with the shelf, the WHERE clause is the check that
 * holds. Postgres re-evaluates it under the row lock, so of two orders
 * racing for the last use the second matches nothing. The CHECK constraint
 * on the table (usedCount <= usageLimit) is the backstop.
 */
export async function spendCoupon(tx: Prisma.TransactionClient, code: string): Promise<void> {
  const spent = await tx.coupon.updateMany({
    where: {
      code,
      active: true,
      AND: [
        { OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }] },
        { OR: [{ usageLimit: null }, { usedCount: { lt: tx.coupon.fields.usageLimit } }] },
      ],
    },
    data: { usedCount: { increment: 1 } },
  });

  if (spent.count !== 1) throw new CouponSpent(code);
}

/**
 * Gives a use back when the order that spent it falls through. A code
 * deleted since, or already at zero, is left alone: there is nothing to
 * return it to.
 */
export async function refundCouponUse(tx: Prisma.TransactionClient, code: string): Promise<void> {
  await tx.coupon.updateMany({
    where: { code, usedCount: { gt: 0 } },
    data: { usedCount: { decrement: 1 } },
  });
}

/**
 * Takes the use again when a cancelled order is brought back. Only the
 * limit is checked — the order was placed while the code was valid, and an
 * expiry since does not unmake it — and a code deleted since counts nothing.
 * The use gone to another order in between is the one refusal, CouponSpent.
 */
export async function respendCoupon(tx: Prisma.TransactionClient, code: string): Promise<void> {
  const coupon = await tx.coupon.findUnique({ where: { code }, select: { id: true } });
  if (!coupon) return;

  const spent = await tx.coupon.updateMany({
    where: {
      code,
      OR: [{ usageLimit: null }, { usedCount: { lt: tx.coupon.fields.usageLimit } }],
    },
    data: { usedCount: { increment: 1 } },
  });

  if (spent.count !== 1) throw new CouponSpent(code);
}

/**
 * The coupon currently in effect for this subtotal, or null. A code that has
 * stopped being valid simply drops out of the totals instead of erroring.
 */
export async function getAppliedCoupon(
  subtotal: number,
): Promise<AppliedCoupon | null> {
  const code = (await cookies()).get(COUPON_COOKIE)?.value;
  if (!code) return null;

  const result = await evaluateCoupon(code, subtotal);
  return result.ok ? result.coupon : null;
}
