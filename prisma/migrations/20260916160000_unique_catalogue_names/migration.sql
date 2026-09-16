-- Makes a catalogue name unique, which the slug never did.
--
-- Publishers, teachers and both category trees were unique on `slug` only.
-- The seeded slugs are Latin (`dar-el-shorouk`) and a name typed into the
-- panel becomes an Arabic slug (`دار-الشروق`), so re-entering an existing
-- name never collided: it made a second row, and did on 2026-09-16. The
-- name is now the key. Nothing in the tables violates it — no two
-- publishers or teachers share a name, and the branches that do («العلمي»,
-- «الأدبي») sit under different parents.
--
-- A branch's name is unique among its siblings, and NULLS NOT DISTINCT
-- extends that to the top-level branches, whose parent is null: without it
-- Postgres treats every null as a different value and two roots could still
-- share a name. Prisma declares the same index as @@unique([parentId,
-- nameAr]); the null handling lives only here.

-- CreateIndex
CREATE UNIQUE INDEX "authors_nameAr_key" ON "authors"("nameAr");

-- CreateIndex
CREATE UNIQUE INDEX "categories_parentId_nameAr_key" ON "categories"("parentId", "nameAr") NULLS NOT DISTINCT;

-- CreateIndex
CREATE UNIQUE INDEX "handout_categories_parentId_nameAr_key" ON "handout_categories"("parentId", "nameAr") NULLS NOT DISTINCT;

-- CreateIndex
CREATE UNIQUE INDEX "publishers_nameAr_key" ON "publishers"("nameAr");
