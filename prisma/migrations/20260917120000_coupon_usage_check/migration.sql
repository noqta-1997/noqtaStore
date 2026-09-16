-- A coupon cannot be used more times than its limit.
--
-- `evaluateCoupon` refused a code once usedCount reached usageLimit, but
-- checkout then incremented usedCount unconditionally, so two orders that
-- both passed the check could both take the last use. The increment now
-- runs as `UPDATE ... WHERE usedCount < usageLimit` (spendCoupon in
-- src/lib/coupon.ts); this constraint is the backstop. No live coupon is
-- over its limit.

ALTER TABLE "coupons" ADD CONSTRAINT "coupons_usage_check" CHECK ("usageLimit" IS NULL OR "usedCount" <= "usageLimit");
