-- Money and ratings stay in range, and an order's total is its arithmetic.
--
-- The quantity checks (20260917080000) covered copies; these cover dinars
-- and stars. Every one of them restates a rule the application already
-- follows — checkout computes `total` from the other three amounts and
-- caps the discount at the subtotal, reviews are validated to 1–5, the
-- coupon form refuses a zero value or a percentage over 100 — so no live
-- row and no seed fixture violates any of them. What they add is that the
-- rule now holds for every writer, including the next script.
--
-- Prisma cannot declare a CHECK; the inventory (appendix B) lists them
-- from pg_constraint.

-- Catalogue: a price is never negative, a denormalised rating stays on the
-- five-star scale, and a review count cannot go below zero.
ALTER TABLE "books" ADD CONSTRAINT "books_price_check" CHECK ("price" >= 0);
ALTER TABLE "books" ADD CONSTRAINT "books_compareAtPrice_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0);
ALTER TABLE "books" ADD CONSTRAINT "books_rating_check" CHECK ("rating" >= 0 AND "rating" <= 5);
ALTER TABLE "books" ADD CONSTRAINT "books_reviewsCount_check" CHECK ("reviewsCount" >= 0);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_price_check" CHECK ("price" >= 0);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_compareAtPrice_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" >= 0);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_rating_check" CHECK ("rating" >= 0 AND "rating" <= 5);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_reviewsCount_check" CHECK ("reviewsCount" >= 0);

-- Order lines: the price captured at the time of the order.
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_unitPrice_check" CHECK ("unitPrice" >= 0);
ALTER TABLE "handout_order_items" ADD CONSTRAINT "handout_order_items_unitPrice_check" CHECK ("unitPrice" >= 0);

-- Orders: no negative amount, a discount never larger than what it
-- discounts, and the total is exactly the sum — so it cannot be negative
-- either.
ALTER TABLE "orders" ADD CONSTRAINT "orders_amounts_check" CHECK ("subtotal" >= 0 AND "shippingCost" >= 0 AND "discount" >= 0 AND "discount" <= "subtotal");
ALTER TABLE "orders" ADD CONSTRAINT "orders_total_check" CHECK ("total" = "subtotal" + "shippingCost" - "discount");

-- Reviews: one to five stars.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);
ALTER TABLE "handout_reviews" ADD CONSTRAINT "handout_reviews_rating_check" CHECK ("rating" >= 1 AND "rating" <= 5);

-- Coupons: the rules saveCoupon applies, held by the table.
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_value_check" CHECK ("value" > 0 AND ("type" <> 'percentage' OR "value" <= 100));
ALTER TABLE "coupons" ADD CONSTRAINT "coupons_limits_check" CHECK ("minSubtotal" >= 0 AND ("usageLimit" IS NULL OR "usageLimit" > 0) AND "usedCount" >= 0);
