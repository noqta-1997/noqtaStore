-- The school subjects as one flat list beside the handouts' tree. A subject
-- is the same row whatever grade it is taught in, so «الرياضيات» is named
-- once here instead of a branch under every grade. Teachers and handouts
-- point at it in later migrations.
--
-- The rows below are the list the owner gave on 2026-10-06 (primary,
-- intermediate and preparatory subjects in one list), with the literary
-- branch's subjects added. Each one with a picture in public/images/Icons
-- uses it; the rest use «الكتاب» until a picture is added.

-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "nameAr" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subjects_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "subjects_slug_key" ON "subjects"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_nameAr_key" ON "subjects"("nameAr");

-- The spelling-blind key, as on publishers (20260917160000_normalized_name_keys).
CREATE UNIQUE INDEX "subjects_nameAr_normalized_key" ON "subjects" (public.arabic_key("nameAr"));

-- Closed to the API roles, like every table (20260918110000_lock_public_api).
ALTER TABLE "subjects" ENABLE ROW LEVEL SECURITY;

INSERT INTO "subjects" ("id", "slug", "nameAr", "icon", "updatedAt") VALUES
  ('s-islamic', 'islamic-education', 'التربية الإسلامية', 'التربية الاسلامية', now()),
  ('s-arabic', 'arabic', 'اللغة العربية', 'اللغة العربية', now()),
  ('s-english', 'english', 'اللغة الإنكليزية', 'اللغة الانكليزية', now()),
  ('s-kurdish', 'kurdish', 'اللغة الكردية', 'الكتاب', now()),
  ('s-math', 'mathematics', 'الرياضيات', 'الرياضيات', now()),
  ('s-science', 'science', 'العلوم', 'الكتاب', now()),
  ('s-biology', 'biology', 'الأحياء', 'الاحياء', now()),
  ('s-chemistry', 'chemistry', 'الكيمياء', 'الكيمياء', now()),
  ('s-physics', 'physics', 'الفيزياء', 'الفيزياء', now()),
  ('s-computer', 'computer', 'الحاسوب', 'الكتاب', now()),
  ('s-history', 'history', 'التاريخ', 'الكتاب', now()),
  ('s-geography', 'geography', 'الجغرافية', 'الكتاب', now()),
  ('s-economics', 'economics', 'الاقتصاد', 'الكتاب', now()),
  ('s-sociology', 'sociology', 'علم الاجتماع', 'الكتاب', now()),
  ('s-philosophy', 'philosophy-psychology', 'الفلسفة وعلم النفس', 'الكتاب', now());
