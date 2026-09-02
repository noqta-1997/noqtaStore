"use client";

import { useSyncExternalStore } from "react";

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
