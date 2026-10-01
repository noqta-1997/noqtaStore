-- The marketing opt-ins on the profile page are gone: the panel never drove
-- anything — no mailing, no admin view — so the two flags only recorded a
-- choice nobody read. The values as they stood are kept in
-- docs/preferences-removal/backup.json. The newsletter signup on the home
-- page is a separate list (newsletter_subscribers) and stays.

-- AlterTable
ALTER TABLE "customers" DROP COLUMN "newsletterOptIn",
DROP COLUMN "offersOptIn";
