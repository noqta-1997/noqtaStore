-- What each teacher teaches: any number of subjects from the flat list
-- (20261006120000_subjects). The teacher form offers them as checkboxes;
-- the 34 teachers already in the store start with none, so the form never
-- requires one.
--
-- A teacher's rows go with the teacher (CASCADE). A subject still taught by
-- a teacher cannot be deleted (RESTRICT); deleteSubject refuses it first,
-- with the reason.

-- CreateTable
CREATE TABLE "author_subjects" (
    "authorId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,

    CONSTRAINT "author_subjects_pkey" PRIMARY KEY ("authorId","subjectId")
);

-- CreateIndex
CREATE INDEX "author_subjects_subjectId_idx" ON "author_subjects"("subjectId");

-- AddForeignKey
ALTER TABLE "author_subjects" ADD CONSTRAINT "author_subjects_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "authors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "author_subjects" ADD CONSTRAINT "author_subjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Closed to the API roles, like every table (20260918110000_lock_public_api).
ALTER TABLE "author_subjects" ENABLE ROW LEVEL SECURITY;
