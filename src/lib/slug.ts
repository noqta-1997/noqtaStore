/**
 * The slug a name or title gets when its row is created.
 *
 * Letters and digits of any script survive and every run of anything else
 * becomes one hyphen. The character class used to be `[a-z0-9ء-ي]`, the
 * basic Arabic block alone, which is narrower than what the panel is typed
 * in: Arabic-Indic digits vanished, so «رياضيات الصف ٣» and «… ٤» shared a
 * slug; Kurdish and Persian letters (گ ک ی ۆ ە ڤ) and the wasla alif were
 * cut out of the word, turning «گۆڤار» into «ار»; and a vowel mark split a
 * word in two. Now:
 *
 * - NFKC folds presentation forms such as «ﻻ» back into their letters;
 * - Arabic-Indic and Persian digits become 0–9, so «٣» and «3» are one slug;
 * - vowel marks, the dagger alif and the tatweel are dropped, as
 *   `arabic_key` drops them — they decorate a word, they do not change it.
 *
 * A slug is never regenerated, so rows created under the old class keep
 * the slugs they have.
 */
export function slugify(value: string, fallback: string): string {
  const slug = value
    .normalize("NFKC")
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x06f0))
    .replace(/[\p{M}ـ]/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

  return slug || fallback;
}

/**
 * A dynamic segment as a page should read it.
 *
 * Next hands the page component the raw path segment — percent-encoded when
 * the slug carries Arabic letters, as the panel's branch slugs do — while
 * `generateMetadata` for the same request gets it decoded. A page that looked
 * the raw form up found nothing and showed its not-found shell under a
 * correct title. Reading both through this makes them agree; a Latin slug
 * passes through untouched, and a malformed sequence is kept as it came.
 */
export function readSlug(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
