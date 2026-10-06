-- Every handout names its subject, from the flat list (20261006120000_subjects).
-- Required: the store held no handouts when this ran (2026-10-07), so no row
-- needed one filled in. When the handout's teacher has subjects
-- (author_subjects), saveHandout holds the subject to one of them; a teacher
-- with none can be given any.
--
-- A subject a handout covers cannot be deleted (RESTRICT); deleteSubject
-- refuses it first, with the reason.

-- AlterTable
ALTER TABLE "handouts" ADD COLUMN     "subjectId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "handouts_subjectId_idx" ON "handouts"("subjectId");

-- AddForeignKey
ALTER TABLE "handouts" ADD CONSTRAINT "handouts_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
