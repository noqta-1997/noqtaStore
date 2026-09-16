-- A shelf count cannot go below zero, and a line cannot hold no copies.
--
-- Nothing in the database said so: `stock` accepted -1, and checkout read
-- the count, compared it in JavaScript and then decremented, so two orders
-- for the last copy could both pass the comparison. The decrement now runs
-- as `UPDATE ... WHERE stock >= quantity` (src/lib/shelf.ts) and these
-- constraints are the backstop for every other path — the admin form, a
-- status change that puts a cancelled order back on the books, a script.
--
-- No row violates them today: no negative stock, no zero-quantity line.
-- Prisma cannot declare a CHECK; the schema notes them on `stock`.

-- Books and handouts: the shelf.
ALTER TABLE "books" ADD CONSTRAINT "books_stock_check" CHECK ("stock" >= 0);
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_stock_check" CHECK ("stock" >= 0);

-- Cart lines: a row is at least one copy; none means no row.
ALTER TABLE "cart_items" ADD CONSTRAINT "cart_items_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "handout_cart_items" ADD CONSTRAINT "handout_cart_items_quantity_check" CHECK ("quantity" > 0);

-- Order lines: the same, and these are the sales record.
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_check" CHECK ("quantity" > 0);
ALTER TABLE "handout_order_items" ADD CONSTRAINT "handout_order_items_quantity_check" CHECK ("quantity" > 0);
