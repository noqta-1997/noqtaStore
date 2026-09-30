-- The school-book catalogue goes; the store sells handouts only.
--
-- Dropped: `books`, the four tables that pointed at it (`order_items`,
-- `reviews`, `wishlist_items`, `cart_items`), the books' category tree
-- (`categories`) and `authors.subjectId`, the teacher's subject, which was a
-- branch of that tree. Every row was exported first to
-- docs/books-removal/pre-drop-export.json, with each table's columns,
-- constraints and indexes, so the tables can be written back if they are
-- ever wanted. At the time of writing every one of them but `categories` was
-- empty, and no teacher had a subject; `categories` held the 21 rows of the
-- seeded school ladder, which `handout_categories` carries on its own.
--
-- Kept on purpose: the `BookTag` enum (`handouts.tags` is typed by it), the
-- `arabic_key()` function (the handouts' and names' spelling-blind keys use
-- it) and the "Books Covers" storage bucket (the handouts' covers live in it).
--
-- The settings rows of the home sections that went with the books — the two
-- book shelves, the category tiles and the offers banner — go too, as do the
-- hero's featured-book pick (the hero now picks a handout, under its own key)
-- and the rewritten strings of fields that no longer exist.

-- DropForeignKey
ALTER TABLE "authors" DROP CONSTRAINT "authors_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "books" DROP CONSTRAINT "books_authorId_fkey";

-- DropForeignKey
ALTER TABLE "books" DROP CONSTRAINT "books_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "books" DROP CONSTRAINT "books_publisherId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_orderId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_bookId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_bookId_fkey";

-- DropForeignKey
ALTER TABLE "reviews" DROP CONSTRAINT "reviews_customerId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_customerId_fkey";

-- DropForeignKey
ALTER TABLE "wishlist_items" DROP CONSTRAINT "wishlist_items_bookId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_customerId_fkey";

-- DropForeignKey
ALTER TABLE "cart_items" DROP CONSTRAINT "cart_items_bookId_fkey";

-- DropIndex
DROP INDEX "authors_subjectId_idx";

-- AlterTable
ALTER TABLE "authors" DROP COLUMN "subjectId";

-- DropTable
DROP TABLE "categories";

-- DropTable
DROP TABLE "books";

-- DropTable
DROP TABLE "order_items";

-- DropTable
DROP TABLE "reviews";

-- DropTable
DROP TABLE "wishlist_items";

-- DropTable
DROP TABLE "cart_items";

-- Settings of the sections and fields that went with the books
DELETE FROM "store_settings"
WHERE "key" IN (
    'home.bestsellers',
    'home.newArrivals',
    'home.categories',
    'home.promo',
    'home.hero.featuredBookId',
    'home.authors.booksCount',
    'home.publishers.booksTitle',
    'home.publishers.booksSubtitle'
  )
  OR "key" LIKE 'home.bestsellers.%'
  OR "key" LIKE 'home.newArrivals.%'
  OR "key" LIKE 'home.categories.%'
  OR "key" LIKE 'home.promo.%';
