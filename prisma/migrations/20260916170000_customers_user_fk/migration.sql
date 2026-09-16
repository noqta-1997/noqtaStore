-- Ties a customer to the Supabase account behind it with a real key.
--
-- `customers.userId` carried `auth.users.id` as text, with nothing holding
-- the two together: an account deleted from the Supabase dashboard left a
-- customer pointing at nothing. The column becomes the uuid it always held
-- (both live values are valid and present in auth.users), and a foreign key
-- to auth.users makes the database keep it that way.
--
-- ON DELETE SET NULL rather than CASCADE: a customer's orders are the
-- store's record, not the account's, and `orders.customerId` is RESTRICT.
-- The row stays, unlinked; the next sign-in with the same email adopts it
-- (resolveCustomer in src/lib/auth.ts), so nothing is lost either way.
--
-- Hand-written rather than generated: Prisma would drop and re-add the
-- column to change its type, and it cannot declare this key, since
-- auth.users is outside its schema. Nor can it introspect past it: with the
-- key in place `migrate diff --from-config-datasource` stops with P4002,
-- and listing `auth` in the datasource would make Prisma claim all 27 of
-- Supabase's tables. So the next migrations are drafted by diffing the
-- previous schema against the edited one (`migrate diff --from-schema
-- <old> --to-schema prisma/schema.prisma --script`), which never reads the
-- database; `migrate deploy` and `migrate status` are unaffected.

-- AlterTable: the same values, as the type they are.
ALTER TABLE "customers" ALTER COLUMN "userId" TYPE UUID USING "userId"::uuid;

-- AddForeignKey
ALTER TABLE "customers" ADD CONSTRAINT "customers_userId_fkey" FOREIGN KEY ("userId") REFERENCES auth.users(id) ON DELETE SET NULL ON UPDATE CASCADE;
