-- A picture for a subject, uploaded from its edit page into the covers
-- bucket (under subjects/). Optional: a subject without one keeps the
-- picture its `icon` names from public/images/Icons, and removing the upload
-- falls back to it.

-- AlterTable
ALTER TABLE "subjects" ADD COLUMN     "imageUrl" TEXT;
