"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";

export type Theme = "light" | "dark";

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  query.addEventListener("change", onChange);

  return () => {
    listeners.delete(onChange);
    query.removeEventListener("change", onChange);
  };
}

/** The <html> attribute is the source of truth; the OS is the fallback. */
function getSnapshot(): Theme {
  const attribute = document.documentElement.getAttribute("data-theme");
  if (attribute === "dark" || attribute === "light") return attribute;

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

function getServerSnapshot(): Theme {
  return "light";
}

/**
 * Shared by the toggle and by `FluentShell`, which needs the same answer to
 * pick its theme object. Two independent readers would eventually disagree.
 */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/** Writes the choice, applies it before any repaint, and wakes every reader. */
export function setTheme(next: Theme) {
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    /* storage unavailable — the choice just won't persist */
  }
  listeners.forEach((listener) => listener());
}

/**
 * The boot script in the root layout applies the stored choice before first
 * paint — when it runs at all. A `notFound()` thrown outside a Suspense
 * boundary makes Next answer with its error shell instead of the page: an
 * empty document the browser fills in from the RSC payload, and in a client
 * render an inline `<script>` is created but never executed. Every 404 page
 * therefore came up in the OS theme, whatever the reader had chosen. This is
 * the same rule run once more from the client, before that first paint, for
 * the case where the script never ran; on a normally served page the
 * attribute is already there and nothing happens.
 */
export function useStoredThemeFallback() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (root.getAttribute("data-theme")) return;

    let stored: string | null = null;
    try {
      stored = localStorage.getItem(THEME_STORAGE_KEY);
    } catch {
      return;
    }

    if (stored === "dark" || stored === "light") {
      root.setAttribute("data-theme", stored);
      listeners.forEach((listener) => listener());
    }
  }, []);
}
