-- Free shipping above a threshold is gone: every standard delivery is charged
-- the standard cost. The settings screen no longer offers the field, so the
-- row it wrote is dropped with it. No order placed before this migration had
-- been shipped free, so nothing in `orders` needs reconciling.
--
-- To bring the row back (the value as it stood on 2026-10-02):
--   INSERT INTO "store_settings" ("key", "value", "updatedAt")
--   VALUES ('freeThreshold', '50000', now());

DELETE FROM "store_settings" WHERE "key" = 'freeThreshold';
