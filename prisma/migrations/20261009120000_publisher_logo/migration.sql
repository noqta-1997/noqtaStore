-- A logo for a press, uploaded from the panel into the covers bucket (under
-- publishers/). Optional: a press without one keeps its plain coloured mark,
-- and removing the upload falls back to it.

-- AlterTable
ALTER TABLE "publishers" ADD COLUMN     "logoUrl" TEXT;
