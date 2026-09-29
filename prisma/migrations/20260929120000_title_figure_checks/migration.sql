-- A title's figures stay in range: the discount is a discount, and the page
-- count and publication year printed on its page are real numbers.
--
-- Each restates a rule saveBook and saveHandout already apply (commits
-- 30e6f96 and 05b3e02) — the struck-through price above the price, at least
-- one page, a year of 1 or later — and no live row or seed fixture breaks
-- one. What they add is that the rule holds for every writer, including the
-- next script, as the money checks of 20260917100000 do for amounts.
--
-- The year's upper bound (next year) stays in the application: it moves
-- with the clock, and a CHECK must give the same answer on every row it has
-- ever accepted. The existing `…_compareAtPrice_check` (>= 0) is kept; the
-- new one implies it, since the price is never negative, but dropping a
-- check buys nothing.
--
-- Prisma cannot declare a CHECK; the inventory (appendix B) lists them
-- from pg_constraint.

ALTER TABLE "books" ADD CONSTRAINT "books_compareAtPrice_above_price_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" > "price");
ALTER TABLE "books" ADD CONSTRAINT "books_pages_check" CHECK ("pages" >= 1);
ALTER TABLE "books" ADD CONSTRAINT "books_publishedYear_check" CHECK ("publishedYear" >= 1);

ALTER TABLE "handouts" ADD CONSTRAINT "handouts_compareAtPrice_above_price_check" CHECK ("compareAtPrice" IS NULL OR "compareAtPrice" > "price");
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_pages_check" CHECK ("pages" >= 1);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_publishedYear_check" CHECK ("publishedYear" >= 1);
