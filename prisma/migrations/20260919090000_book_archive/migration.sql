-- Archiving a book instead of deleting it.
--
-- A book that appears in an order cannot be deleted: order_items holds it
-- with ON DELETE RESTRICT, and it should, since the order is the record of
-- the sale. `archivedAt` gives the panel a way to take such a title off sale
-- anyway. The storefront reads only rows where it is null; the panel and
-- order history still see every row. No index: the column filters a table
-- of a few hundred rows, always alongside a condition that already has one.

ALTER TABLE "books" ADD COLUMN "archivedAt" TIMESTAMP(3);
