-- A name is the same name however the hamza is drawn.
--
-- The unique keys on nameAr (20260916160000_unique_catalogue_names) compare
-- bytes, and Arabic has several ways to write one word: «أحمد» and «احمد»,
-- «مكتبة» and «مكتبه», «مصطفى» and «مصطفي», with or without tashkeel or a
-- stretched tatweel. Each spelling slipped past the key as a new row. The
-- key is now taken over `arabic_key(nameAr)`: tashkeel, tatweel and the
-- dagger alef dropped, the alef forms folded to a bare alef, ة to ه, ى to ي,
-- ؤ to و and ئ to ي, runs of whitespace to one space, Latin lower-cased.
-- The stored name is untouched — it is what the reader sees — only the
-- comparison changes. The plain keys stay; Prisma declares them and they
-- cost nothing. Prisma cannot declare an expression index, so these live
-- only here, NULLS NOT DISTINCT on the trees for the same reason as before.
-- No two rows collide under the new key today.

-- The bracket expression below holds the characters themselves, which most
-- editors draw as nothing: U+064B–U+0652 (the tashkeel), U+0640 (tatweel)
-- and U+0670 (the dagger alef).
CREATE FUNCTION public.arabic_key(name text) RETURNS text
LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
RETURN lower(btrim(regexp_replace(
  translate(
    regexp_replace(name, '[ً-ْـٰ]', '', 'g'),
    'أإآٱةىؤئ', 'ااااهيوي'),
  '[[:space:]]+', ' ', 'g')));

-- CreateIndex
CREATE UNIQUE INDEX "authors_nameAr_normalized_key" ON "authors" (public.arabic_key("nameAr"));

-- CreateIndex
CREATE UNIQUE INDEX "publishers_nameAr_normalized_key" ON "publishers" (public.arabic_key("nameAr"));

-- CreateIndex
CREATE UNIQUE INDEX "categories_parentId_nameAr_normalized_key" ON "categories" ("parentId", public.arabic_key("nameAr")) NULLS NOT DISTINCT;

-- CreateIndex
CREATE UNIQUE INDEX "handout_categories_parentId_nameAr_normalized_key" ON "handout_categories" ("parentId", public.arabic_key("nameAr")) NULLS NOT DISTINCT;
