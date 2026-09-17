/**
 * The spelling-blind form of an Arabic name, as `arabic_key(text)` in the
 * database computes it (migration 20260917160000_normalized_name_keys):
 * tashkeel (U+064B–U+0652), tatweel (U+0640) and the dagger alef (U+0670)
 * dropped, the alef forms folded to a bare alef, ة to ه, ى to ي, ؤ to و and
 * ئ to ي, runs of whitespace to one space, Latin lower-cased. The two must
 * agree: the database uses its copy to refuse a second spelling of a name,
 * the panel uses this one to find a name whatever spelling was typed.
 */
export function arabicKey(text: string): string {
  return text
    .replace(/[ً-ْـٰ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Escapes a LIKE pattern's own characters, so a typed `%` matches a `%`. */
export function escapeLike(text: string): string {
  return text.replace(/[\\%_]/g, (c) => `\\${c}`);
}
