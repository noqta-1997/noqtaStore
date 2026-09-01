"use client";

import { usePathname } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";

/**
 * Which books the reader has saved, shared by every heart on the page.
 *
 * The catalogue is statically rendered, so the server cannot bake this in
 * without making every page dynamic. One fetch per navigation, shared by all
 * the buttons through this store, keeps the pages static and the hearts true.
 */
let saved: ReadonlySet<string> | null = null;
let loadedPath: string | null = null;

const listeners = new Set<() => void>();

/** Stable across renders so useSyncExternalStore does not loop. */
const EMPTY: ReadonlySet<string> = new Set();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

function getSnapshot() {
  return saved;
}

/** The server renders the heart in its unknown state, same as first paint. */
function getServerSnapshot(): ReadonlySet<string> | null {
  return null;
}

async function load(path: string) {
  // Claim the path before awaiting so the other hearts mounting in the same
  // commit skip their own request.
  if (loadedPath === path && saved !== null) return;
  loadedPath = path;

  try {
    const response = await fetch("/api/wishlist/ids", { cache: "no-store" });
    if (!response.ok) return;

    const data: { ids?: unknown } = await response.json();
    saved = new Set(Array.isArray(data.ids) ? (data.ids as string[]) : []);
    emit();
  } catch {
    // Offline or navigating away — the hearts keep whatever they knew.
    loadedPath = null;
  }
}

/** Applies a toggle locally so every heart for that book updates at once. */
export function setWishlistSaved(bookId: string, next: boolean) {
  const updated = new Set(saved ?? EMPTY);

  if (next) {
    updated.add(bookId);
  } else {
    updated.delete(bookId);
  }

  saved = updated;
  emit();
}

/** Null until the first answer arrives — the caller decides what to show. */
export function useWishlistIds(): ReadonlySet<string> | null {
  const pathname = usePathname();
  const ids = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    void load(pathname);
  }, [pathname]);

  return ids;
}
