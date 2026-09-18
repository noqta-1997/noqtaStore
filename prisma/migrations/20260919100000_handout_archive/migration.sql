-- Archiving a handout instead of deleting it — the handouts' copy of
-- 20260919090000_book_archive. handout_order_items holds an ordered handout
-- with ON DELETE RESTRICT; `archivedAt` takes it off sale all the same, and
-- the storefront reads only rows where it is null.

ALTER TABLE "handouts" ADD COLUMN "archivedAt" TIMESTAMP(3);
