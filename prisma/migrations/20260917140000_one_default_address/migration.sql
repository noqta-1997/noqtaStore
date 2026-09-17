-- A customer has at most one default address.
--
-- `isDefault` was a flag with nothing behind it. Setting a default clears
-- the customer's others and then sets the one, in a transaction — but two
-- of those racing for the same customer both clear and both set, and the
-- customer ends up with two defaults, which the addresses page and the
-- checkout prefill both assume cannot happen. This partial unique index
-- makes it impossible: the second writer is refused and runs again from
-- the top (src/lib/addresses.ts), so the last one wins. Prisma cannot
-- declare a partial index, so it lives only here.
--
-- Should any customer already hold two, the newest keeps the flag; today
-- none does.

UPDATE "addresses" AS a SET "isDefault" = false
WHERE a."isDefault" AND EXISTS (
  SELECT 1 FROM "addresses" AS b
  WHERE b."customerId" = a."customerId" AND b."isDefault"
    AND (b."updatedAt" > a."updatedAt" OR (b."updatedAt" = a."updatedAt" AND b."id" > a."id"))
);

-- CreateIndex
CREATE UNIQUE INDEX "addresses_one_default_per_customer" ON "addresses"("customerId") WHERE "isDefault";
