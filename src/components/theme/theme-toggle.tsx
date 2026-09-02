"use client";

import { Moon, Sun } from "lucide-react";

import { IconButton } from "@/components/ui/icon-button";
import { setTheme, useTheme } from "@/components/theme/use-theme";
import { THEME_STORAGE_KEY } from "@/lib/theme";

export { THEME_STORAGE_KEY };

interface ThemeToggleProps {
  labels: { toggle: string; light: string; dark: string };
  className?: string;
}

/**
 * Flips `data-theme` on <html> and remembers the choice. The inline script in
 * the layout applies it before first paint; `FluentShell` reads the same store
 * so the islands switch with everything else.
 */
export function ThemeToggle({ labels, className }: ThemeToggleProps) {
  const theme = useTheme();
  const label = theme === "dark" ? labels.light : labels.dark;

  return (
    <IconButton
      variant="subtle"
      label={label}
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className={className}
    >
      {theme === "dark" ? (
        <Sun aria-hidden className="size-5" strokeWidth={2} />
      ) : (
        <Moon aria-hidden className="size-5" strokeWidth={2} />
      )}
    </IconButton>
  );
}
