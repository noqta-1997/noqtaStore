-- Turns the flat category list into two trees.
--
-- "categories" gains a parent pointer and a sibling order, so a stage can hold
-- its grades and a grade its branches, to any depth. The handouts get a table
-- of their own with the same shape: the two catalogues are filed apart, and a
-- branch added to one does not appear in the other.
--
-- The handouts that exist keep the category they had: the rows they point at
-- are copied into "handout_categories" under the same ids before the foreign
-- key moves, so no product is re-filed by this migration.
--
-- The parent keys are NO ACTION rather than RESTRICT so that one DELETE can
-- clear a whole tree (the seed does): Postgres checks NO ACTION at the end of
-- the statement, RESTRICT row by row. The panel refuses to delete a branch
-- that still has children before either is reached.

-- DropForeignKey
ALTER TABLE "handouts" DROP CONSTRAINT "handouts_categoryId_fkey";

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "parentId" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "handout_categories" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "parentId" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "handout_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "handout_categories_slug_key" ON "handout_categories"("slug");

-- CreateIndex
CREATE INDEX "handout_categories_parentId_idx" ON "handout_categories"("parentId");

-- CreateIndex
CREATE INDEX "categories_parentId_idx" ON "categories"("parentId");

-- CarryOver: every category a handout is filed under, so the new foreign key
-- has a row to point at. A fresh database has no handouts and copies nothing.
INSERT INTO "handout_categories" ("id", "slug", "nameAr", "descriptionAr", "icon", "createdAt", "updatedAt")
SELECT "id", "slug", "nameAr", "descriptionAr", "icon", "createdAt", "updatedAt"
FROM "categories"
WHERE "id" IN (SELECT DISTINCT "categoryId" FROM "handouts");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handout_categories" ADD CONSTRAINT "handout_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "handout_categories"("id") ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "handout_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
