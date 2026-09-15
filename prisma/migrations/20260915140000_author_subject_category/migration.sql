-- The subject a teacher teaches is now a branch of the school-books category
-- tree rather than a typed name: the form offers the tree and stores the id,
-- so a renamed branch renames every teacher's subject with it.
--
-- SET NULL rather than RESTRICT so that a whole-table clear (the seed) never
-- trips over a teacher; the panel refuses to delete a branch that teachers
-- still point at before the database is asked.

-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "subjectId" TEXT;

-- CarryOver: a subject typed while the column was free text keeps its meaning
-- when a branch of exactly that name exists. Nothing else can be mapped.
UPDATE "authors" AS a
SET "subjectId" = c."id"
FROM "categories" AS c
WHERE a."subjectAr" IS NOT NULL AND c."nameAr" = a."subjectAr";

-- AlterTable
ALTER TABLE "authors" DROP COLUMN "subjectAr";

-- CreateIndex
CREATE INDEX "authors_subjectId_idx" ON "authors"("subjectId");

-- AddForeignKey
ALTER TABLE "authors" ADD CONSTRAINT "authors_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
