-- Lets handouts (ملازم) be bought, saved and reviewed.
--
-- Four tables shaped like cart_items, wishlist_items, order_items and reviews,
-- pointing at "handouts" instead of "books". An order keeps its book lines in
-- order_items and its handout lines here, side by side, so one order can hold
-- both. Nothing in the existing tables changes.

-- CreateTable
CREATE TABLE "handout_order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "handoutId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" INTEGER NOT NULL,

    CONSTRAINT "handout_order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handout_reviews" (
    "id" TEXT NOT NULL,
    "handoutId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" "ReviewStatus" NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handout_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "handout_wishlist_items" (
    "customerId" TEXT NOT NULL,
    "handoutId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "handout_wishlist_items_pkey" PRIMARY KEY ("customerId","handoutId")
);

-- CreateTable
CREATE TABLE "handout_cart_items" (
    "customerId" TEXT NOT NULL,
    "handoutId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handout_cart_items_pkey" PRIMARY KEY ("customerId","handoutId")
);

-- CreateIndex
CREATE INDEX "handout_order_items_orderId_idx" ON "handout_order_items"("orderId");

-- CreateIndex
CREATE INDEX "handout_order_items_handoutId_idx" ON "handout_order_items"("handoutId");

-- CreateIndex
CREATE INDEX "handout_reviews_status_idx" ON "handout_reviews"("status");

-- CreateIndex
CREATE UNIQUE INDEX "handout_reviews_handoutId_customerId_key" ON "handout_reviews"("handoutId", "customerId");

-- AddForeignKey
ALTER TABLE "handout_order_items" ADD CONSTRAINT "handout_order_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_order_items" ADD CONSTRAINT "handout_order_items_handoutId_fkey" FOREIGN KEY ("handoutId") REFERENCES "handouts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_reviews" ADD CONSTRAINT "handout_reviews_handoutId_fkey" FOREIGN KEY ("handoutId") REFERENCES "handouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_reviews" ADD CONSTRAINT "handout_reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_wishlist_items" ADD CONSTRAINT "handout_wishlist_items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_wishlist_items" ADD CONSTRAINT "handout_wishlist_items_handoutId_fkey" FOREIGN KEY ("handoutId") REFERENCES "handouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_cart_items" ADD CONSTRAINT "handout_cart_items_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_cart_items" ADD CONSTRAINT "handout_cart_items_handoutId_fkey" FOREIGN KEY ("handoutId") REFERENCES "handouts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

