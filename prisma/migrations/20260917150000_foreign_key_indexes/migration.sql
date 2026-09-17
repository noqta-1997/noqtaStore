-- An index under every foreign key.
--
-- Six referencing columns had none: reviews.customerId and
-- handout_reviews.customerId sit second in their unique index (bookId or
-- handoutId leads), and bookId/handoutId sit second in the composite keys of
-- the cart and wishlist tables (customerId leads). A btree serves only a
-- prefix, so "my reviews" scanned the whole reviews table for one customer,
-- and deleting a title made the cascade scan every cart and wishlist for its
-- rows. The other 23 foreign keys were covered already. Declared in
-- schema.prisma as @@index; this is what `migrate diff` produced for them.

-- CreateIndex
CREATE INDEX "reviews_customerId_idx" ON "reviews"("customerId");

-- CreateIndex
CREATE INDEX "wishlist_items_bookId_idx" ON "wishlist_items"("bookId");

-- CreateIndex
CREATE INDEX "cart_items_bookId_idx" ON "cart_items"("bookId");

-- CreateIndex
CREATE INDEX "handout_reviews_customerId_idx" ON "handout_reviews"("customerId");

-- CreateIndex
CREATE INDEX "handout_wishlist_items_handoutId_idx" ON "handout_wishlist_items"("handoutId");

-- CreateIndex
CREATE INDEX "handout_cart_items_handoutId_idx" ON "handout_cart_items"("handoutId");
