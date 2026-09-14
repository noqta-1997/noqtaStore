/**
 * What counts as a cover image, and where covers live. Shared by the picker
 * in the browser, the action on the server and `next.config.ts`, so none of
 * them can disagree about a file or a URL.
 */

/**
 * The Supabase Storage bucket, as the owner named it in the dashboard.
 * Handout covers sit in it too, under their own folder. In a URL the space is
 * `%20`, which `COVER_PUBLIC_PATH` spells out for the image allow-list.
 */
export const COVER_BUCKET = "Books Covers";

/** The path under the Supabase host that every public cover URL starts with. */
export const COVER_PUBLIC_PATH = `/storage/v1/object/public/${encodeURIComponent(COVER_BUCKET)}/`;

/**
 * What the server accepts. The picker no longer states it, because a file
 * past it is brought under it in the browser before it is sent; it is the
 * ceiling that resizing works towards, and the line the action still holds.
 */
export const MAX_COVER_BYTES = 2 * 1024 * 1024;

/**
 * The long edge a cover is brought down to in the browser before upload.
 * The largest place a cover is drawn is the product page at 24rem, which on
 * a 3× display asks for about 1150px across; 1600 on the long edge of a 2:3
 * jacket gives 1067 across, and a file of a few hundred kilobytes rather
 * than the several megabytes a phone hands over.
 */
export const MAX_COVER_EDGE = 1600;

/**
 * The picker says PNG or JPG; WebP is accepted as well because it is what a
 * phone's share sheet increasingly hands over. Keyed by MIME type because the
 * type is what the browser reports, and the file name is whatever the owner
 * happened to call it.
 */
export const COVER_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const COVER_MIME_TYPES = Object.keys(COVER_EXTENSIONS);

export type CoverProblem = "invalidImage" | "imageTooLarge";

/** Why a file cannot be a cover, or null when it can. */
export function coverProblem(file: { type: string; size: number }): CoverProblem | null {
  if (!(file.type in COVER_EXTENSIONS)) return "invalidImage";
  if (file.size > MAX_COVER_BYTES) return "imageTooLarge";

  return null;
}
