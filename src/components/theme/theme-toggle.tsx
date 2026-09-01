"use client";

import { Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";

import { THEME_STORAGE_KEY } from "@/lib/theme";
import { cn } from "@/lib/utils";

export { THEME_STORAGE_KEY };

type Theme = "light" | "dark";

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

interface ThemeToggleProps {
  labels: { toggle: string; light: string; dark: string };
  className?: string;
}

/**
 * Flips `data-theme` on <html> and remembers the choice.
 * The inline script in the layout applies it before first paint.
 */
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable — the choice just won't persist */
    }
    listeners.forEach((listener) => listener());
  };

  const label = theme === "dark" ? labels.light : labels.dark;

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center border border-transparent",
        "text-on-surface transition-colors hover:border-line hover:bg-surface-high",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun aria-hidden className="size-5" strokeWidth={2} />
      ) : (
        <Moon aria-hidden className="size-5" strokeWidth={2} />
      )}
    </button>
  );
}
