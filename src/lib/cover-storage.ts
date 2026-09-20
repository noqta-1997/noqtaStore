import "server-only";

import { randomUUID } from "node:crypto";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import {
  COVER_BUCKET,
  COVER_EXTENSIONS,
  COVER_MIME_TYPES,
  MAX_COVER_BYTES,
  coverProblem,
  type CoverProblem,
} from "@/lib/cover-image";

/*
 * Cover images live in one public Supabase Storage bucket, written from the
 * server with the service-role key: the browser never talks to Storage and
 * the key never leaves the server. The first upload in a process checks the
 * bucket — creates it if it is missing, makes it public if it is not — so a
 * fresh project needs nothing set up by hand beyond the keys already in
 * `.env.local`, and a cover can never land somewhere the storefront cannot
 * show it.
 */

export type CoverImage =
  | { ok: true; file: File | null }
  | { ok: false; error: CoverProblem };

/**
 * Reads the optional `coverImage` part of a form. A file input left empty is
 * still submitted, as a zero-byte file with no name, and that means "keep
 * the cover as it is" rather than "clear it".
 */
export function readCoverImage(form: FormData, name = "coverImage"): CoverImage {
  const value = form.get(name);
  if (value === null || typeof value === "string" || value.size === 0) {
    return { ok: true, file: null };
  }

  const problem = coverProblem(value);
  return problem ? { ok: false, error: problem } : { ok: true, file: value };
}

/**
 * The server has no service-role key, so no upload can even be attempted.
 * Its own class so the action can tell "this server is not set up for
 * covers" — a fixed fact about the deployment — from an upload that failed
 * and may succeed on a retry.
 */
export class StorageNotConfiguredError extends Error {
  constructor(variable: string) {
    super(`${variable} is missing — set it in .env.local, or in the host's environment`);
    this.name = "StorageNotConfiguredError";
  }
}

let client: SupabaseClient | undefined;

function storage() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url) throw new StorageNotConfiguredError("NEXT_PUBLIC_SUPABASE_URL");
    if (!key) throw new StorageNotConfiguredError("SUPABASE_SERVICE_ROLE_KEY");

    // A service-role client holds no user session, so there is nothing to
    // persist or refresh; both would only try to reach `localStorage`.
    client = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }

  return client.storage;
}

let bucketReady: Promise<void> | undefined;

/** Checks the bucket once per process, before the first upload. */
function ensureBucket() {
  bucketReady ??= (async () => {
    const { data: bucket, error } = await storage().getBucket(COVER_BUCKET);

    if (error) {
      const created = await storage().createBucket(COVER_BUCKET, {
        public: true,
        fileSizeLimit: MAX_COVER_BYTES,
        allowedMimeTypes: COVER_MIME_TYPES,
      });
      // Two saves can race to create it; the one that loses finds it there.
      if (created.error && created.error.status !== 409) throw created.error;
      return;
    }

    // A private bucket takes the upload and then refuses to serve it. Only
    // the visibility is corrected; the limits stay whatever was set.
    if (!bucket.public) {
      const updated = await storage().updateBucket(COVER_BUCKET, {
        public: true,
        fileSizeLimit: bucket.file_size_limit,
        allowedMimeTypes: bucket.allowed_mime_types,
      });
      if (updated.error) throw updated.error;
    }
  })().catch((error: unknown) => {
    bucketReady = undefined;
    throw error;
  });

  return bucketReady;
}

/**
 * Stores a cover and returns its public URL.
 *
 * Every upload gets a fresh key rather than overwriting the row's old one:
 * `next/image` caches an optimised copy by URL for hours, so a replacement
 * written under the same key would keep serving the cover it replaced.
 * Because a key never changes hands, the object can be cached for a year.
 */
export async function storeCover(
  folder: "books" | "handouts",
  file: File,
): Promise<string> {
  await ensureBucket();

  const path = `${folder}/${randomUUID()}.${COVER_EXTENSIONS[file.type]}`;
  const { error } = await storage()
    .from(COVER_BUCKET)
    .upload(path, file, { contentType: file.type, cacheControl: "31536000" });
  if (error) throw error;

  return storage().from(COVER_BUCKET).getPublicUrl(path).data.publicUrl;
}

/**
 * Deletes a cover this module stored. Best effort: a file left behind costs
 * storage and nothing else, whereas failing a save over it would cost the
 * edit — and on a server without the key, failing a delete or an archive
 * over it would cost those. A URL from anywhere else — a seeded cover on
 * another host — is left alone, since it is not ours to remove.
 */
export async function discardCover(url: string | null | undefined): Promise<void> {
  if (!url) return;

  try {
    // Built the way the stored URL was built, encoding included.
    const prefix = storage().from(COVER_BUCKET).getPublicUrl("").data.publicUrl;
    if (!url.startsWith(prefix)) return;

    await storage()
      .from(COVER_BUCKET)
      .remove([decodeURIComponent(url.slice(prefix.length))]);
  } catch {
    /* orphaned file — harmless */
  }
}
