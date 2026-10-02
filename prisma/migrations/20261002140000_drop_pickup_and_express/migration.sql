-- Pickup from the shop and express delivery are gone: checkout sells standard
-- delivery only, so the two values leave the ShippingMethod enum and the
-- settings that priced or switched them leave store_settings. No order had
-- used either value (all three orders were standard when this ran).
--
-- To bring them back (the values as they stood on 2026-10-02):
--   ALTER TYPE "ShippingMethod" ADD VALUE 'express';
--   ALTER TYPE "ShippingMethod" ADD VALUE 'pickup';
--   INSERT INTO "store_settings" ("key", "value", "updatedAt") VALUES
--     ('expressCost', '10000', now()),
--     ('enablePickup', 'false', now());

-- AlterEnum
BEGIN;
CREATE TYPE "ShippingMethod_new" AS ENUM ('standard');
ALTER TABLE "orders" ALTER COLUMN "shippingMethod" TYPE "ShippingMethod_new" USING ("shippingMethod"::text::"ShippingMethod_new");
ALTER TYPE "ShippingMethod" RENAME TO "ShippingMethod_old";
ALTER TYPE "ShippingMethod_new" RENAME TO "ShippingMethod";
DROP TYPE "ShippingMethod_old";

-- Settings of the removed methods
DELETE FROM "store_settings" WHERE "key" IN ('expressCost', 'enablePickup');
COMMIT;
