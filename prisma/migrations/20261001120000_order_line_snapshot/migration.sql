-- An order line keeps the handout's title and teacher as they read when the
-- order was placed, beside the price it already keeps. The order pages read
-- these copies, so renaming a handout or its teacher later no longer rewrites
-- what a customer bought.
--
-- The columns are added empty, filled from each line's handout and teacher as
-- they read now — the nearest there is to the moment of ordering for lines
-- written before this migration — and only then made required.

-- AlterTable
ALTER TABLE "handout_order_items" ADD COLUMN     "authorNameAr" TEXT,
ADD COLUMN     "titleAr" TEXT;

-- Backfill
UPDATE "handout_order_items" AS "item"
SET "titleAr" = "handout"."titleAr",
    "authorNameAr" = "author"."nameAr"
FROM "handouts" AS "handout"
JOIN "authors" AS "author" ON "author"."id" = "handout"."authorId"
WHERE "handout"."id" = "item"."handoutId";

-- AlterTable
ALTER TABLE "handout_order_items" ALTER COLUMN "authorNameAr" SET NOT NULL,
ALTER COLUMN "titleAr" SET NOT NULL;
