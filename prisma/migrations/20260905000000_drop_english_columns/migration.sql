-- Removes the English half of the catalogue.
--
-- The store is Arabic only: the English UI, its dictionaries and the language
-- switcher were removed, and these eleven columns were the last of it. They
-- held real content, not translations of chrome — English book titles, author
-- names and biographies, publisher and category descriptions.
--
-- 79 rows of content are destroyed here and Postgres cannot bring them back.
-- They were exported to english-content-backup.json at the repository root
-- immediately before this ran; restoring means re-adding the columns and
-- writing the values back by id.

-- AlterTable
ALTER TABLE "authors" DROP COLUMN "bioEn",
DROP COLUMN "countryEn",
DROP COLUMN "nameEn";

-- AlterTable
ALTER TABLE "books" DROP COLUMN "descriptionEn",
DROP COLUMN "languageEn",
DROP COLUMN "titleEn";

-- AlterTable
ALTER TABLE "categories" DROP COLUMN "descriptionEn",
DROP COLUMN "nameEn";

-- AlterTable
ALTER TABLE "publishers" DROP COLUMN "countryEn",
DROP COLUMN "descriptionEn",
DROP COLUMN "nameEn";

