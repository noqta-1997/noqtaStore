-- The panel calls authors teachers, and a teacher has a subject. The column is
-- nullable rather than defaulted to "" so that a teacher with no subject on
-- record reads as NULL, not as an empty name; the rows that exist get NULL.

-- AlterTable
ALTER TABLE "authors" ADD COLUMN     "subjectAr" TEXT;
