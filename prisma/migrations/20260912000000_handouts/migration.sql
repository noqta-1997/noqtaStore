-- Adds the lecture-note catalogue (ملازم).
--
-- A second table shaped exactly like "books": the two catalogues are browsed
-- and managed apart, so they are stored apart. They share the author, category
-- and publisher lookups. Cart, wishlist, orders and reviews still point at
-- "books" only; wiring them to handouts is a later change.

-- CreateTable
CREATE TABLE "handouts" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "compareAtPrice" INTEGER,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "pages" INTEGER NOT NULL,
    "publishedYear" INTEGER NOT NULL,
    "isbn" TEXT NOT NULL,
    "languageAr" TEXT NOT NULL DEFAULT 'العربية',
    "coverType" "CoverType" NOT NULL DEFAULT 'paperback',
    "weightGrams" INTEGER NOT NULL,
    "coverUrl" TEXT,
    "tags" "BookTag"[] DEFAULT ARRAY[]::"BookTag"[],
    "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reviewsCount" INTEGER NOT NULL DEFAULT 0,
    "authorId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "publisherId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handouts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "handouts_slug_key" ON "handouts"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "handouts_isbn_key" ON "handouts"("isbn");

-- CreateIndex
CREATE INDEX "handouts_categoryId_idx" ON "handouts"("categoryId");

-- CreateIndex
CREATE INDEX "handouts_authorId_idx" ON "handouts"("authorId");

-- CreateIndex
CREATE INDEX "handouts_publisherId_idx" ON "handouts"("publisherId");

-- CreateIndex
CREATE INDEX "handouts_createdAt_idx" ON "handouts"("createdAt");

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_publisherId_fkey" FOREIGN KEY ("publisherId") REFERENCES "publishers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

