-- The handouts' tree holds stages, grades and branches only; subjects are
-- their own list now (20261006120000_subjects). Agreed with the owner on
-- 2026-10-06. No handout was filed under any row this touches.
--
-- 1. The two subjects the panel had added as branches under السادس العلمي
--    leave the tree.
-- 2. The vocational track was one top-level branch of its own,
--    «المراحل المهنية», with three grades under it. It becomes a third
--    branch, «المهني», under each preparatory grade beside العلمي and
--    الأدبي — the shape src/data/school-tree.ts seeds.
-- 3. الأدبي under الخامس takes الأدبي's icon, as under الرابع and السادس.
--
-- The rows are matched by id, so on a database seeded after this migration
-- (prisma/seed.ts, which writes the new shape itself) every statement here
-- finds nothing to do; the inserts are joined to their parents for the same
-- reason.

DELETE FROM "handout_categories"
WHERE "id" IN ('cmuwt9jnm00001ktqf9ta1ngv', 'cmuwta15k00011ktqxf7mekdi');

DELETE FROM "handout_categories" WHERE "parentId" = 'cmuwhqk5r000104ihbkefvrd6';
DELETE FROM "handout_categories" WHERE "id" = 'cmuwhqk5r000104ihbkefvrd6';

INSERT INTO "handout_categories" ("id", "slug", "nameAr", "descriptionAr", "icon", "parentId", "sortOrder", "updatedAt")
SELECT v."id", v."slug", v."nameAr", v."descriptionAr", v."icon", v."parentId", 3, now()
FROM (VALUES
  ('hc-preparatory-4-vocational', 'preparatory-4-vocational', 'المهني', 'ملازم الفرع المهني من الصف الرابع الإعدادي', 'Wrench', 'hc-preparatory-4'),
  ('hc-preparatory-5-vocational', 'preparatory-5-vocational', 'المهني', 'ملازم الفرع المهني من الصف الخامس الإعدادي', 'Wrench', 'hc-preparatory-5'),
  ('hc-preparatory-6-vocational', 'preparatory-6-vocational', 'المهني', 'ملازم الفرع المهني من الصف السادس الإعدادي', 'Wrench', 'hc-preparatory-6')
) AS v("id", "slug", "nameAr", "descriptionAr", "icon", "parentId")
JOIN "handout_categories" p ON p."id" = v."parentId";

UPDATE "handout_categories" SET "icon" = 'Feather', "updatedAt" = now()
WHERE "id" = 'cmuwhnvsz000c04l8wscgzkbn';

UPDATE "handout_categories"
SET "descriptionAr" = 'الصفوف الرابع والخامس والسادس الإعدادي بفروعها العلمي والأدبي والمهني', "updatedAt" = now()
WHERE "id" = 'hc-preparatory';
