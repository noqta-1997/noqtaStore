-- Removes five catalogue fields the panel stopped editing on 2026-09-05.
--
-- ISBN, cover type and weight on books and handouts, the country on authors
-- and publishers, and the publisher's founding year were taken off the admin
-- forms and tables then, but their columns stayed and the storefront kept
-- printing them. This drops them for good: 27 ISBNs, 8 hardcover flags, the
-- weights, 45 countries and 14 founding years go with the columns, and the
-- storefront no longer shows any of it. The seed fixtures in src/data were
-- the only other record of the values, and they were trimmed with it.
--
-- `slug` stays on every table: it is the public URL, not a field.

-- DropIndex
DROP INDEX "books_isbn_key";

-- DropIndex
DROP INDEX "handouts_isbn_key";

-- AlterTable
ALTER TABLE "authors" DROP COLUMN "countryAr";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "coverType",
DROP COLUMN "isbn",
DROP COLUMN "weightGrams";

-- AlterTable
ALTER TABLE "handouts" DROP COLUMN "coverType",
DROP COLUMN "isbn",
DROP COLUMN "weightGrams";

-- AlterTable
ALTER TABLE "publishers" DROP COLUMN "countryAr",
DROP COLUMN "foundedYear";

-- DropEnum
DROP TYPE "CoverType";
