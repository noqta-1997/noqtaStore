import { cookies } from "next/headers";

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
