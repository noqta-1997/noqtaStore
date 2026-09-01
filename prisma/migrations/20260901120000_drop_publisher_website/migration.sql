-- Publisher websites are not shown anywhere, so the column goes rather than
-- sitting unused and inviting a wrong URL later.
ALTER TABLE "publishers" DROP COLUMN "website";
