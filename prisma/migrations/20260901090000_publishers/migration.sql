-- Publishers were free text on every book. This promotes them to their own
-- table and rewires the books, keeping every existing value.

-- CreateTable
CREATE TABLE "publishers" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "countryAr" TEXT NOT NULL DEFAULT '',
    "countryEn" TEXT NOT NULL DEFAULT '',
    "descriptionAr" TEXT NOT NULL DEFAULT '',
    "descriptionEn" TEXT NOT NULL DEFAULT '',
    "foundedYear" INTEGER,
    "website" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "publishers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "publishers_slug_key" ON "publishers"("slug");

-- One row per distinct English name; the Arabic name comes along with it.
INSERT INTO "publishers" ("id", "slug", "nameAr", "nameEn", "updatedAt")
SELECT
    'pub' || substr(md5("publisherEn"), 1, 21),
    trim(both '-' from regexp_replace(lower("publisherEn"), '[^a-z0-9]+', '-', 'g')),
    min("publisherAr"),
    "publisherEn",
    now()
FROM "books"
GROUP BY "publisherEn";

-- AlterTable: link the books before the column is required.
ALTER TABLE "books" ADD COLUMN "publisherId" TEXT;

UPDATE "books" b
   SET "publisherId" = p."id"
  FROM "publishers" p
 WHERE p."nameEn" = b."publisherEn";

ALTER TABLE "books" ALTER COLUMN "publisherId" SET NOT NULL;

ALTER TABLE "books" DROP COLUMN "publisherAr",
                    DROP COLUMN "publisherEn";

-- CreateIndex
CREATE INDEX "books_publisherId_idx" ON "books"("publisherId");

-- AddForeignKey
ALTER TABLE "books" ADD CONSTRAINT "books_publisherId_fkey"
    FOREIGN KEY ("publisherId") REFERENCES "publishers"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
