import { Search } from "lucide-react";

import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder: string;
  label: string;
  action: string;
  defaultValue?: string;
  /** Larger variant used on the search results page. */
  size?: "md" | "lg";
  className?: string;
}

/** Header search — a bordered well with a single orange action. */
export function SearchBar({
  placeholder,
  label,
  action,
  defaultValue,
  size = "md",
  className,
}: SearchBarProps) {
  return (
    <form
      action={action}
      role="search"
      className={cn(
        "flex items-center gap-1 rounded-md border border-line bg-surface-low p-1",
        "focus-within:elevation-sm",
        className,
      )}
    >
      <label htmlFor="site-search" className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="ms-2 size-4 shrink-0 text-on-surface"
        strokeWidth={2}
      />
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        defaultValue={defaultValue}
        className={cn(
          "w-full min-w-0 bg-transparent px-1 text-base text-on-surface placeholder:text-muted focus:outline-none",
          size === "lg" ? "h-12" : "h-9",
        )}
      />
      <button
        type="submit"
        className={cn(
          "hidden shrink-0 border border-line bg-primary-container px-4 text-label-md font-semibold text-on-primary-container transition-colors hover:brightness-105 sm:block",
          size === "lg" ? "h-12" : "h-9",
        )}
      >
        {label}
      </button>
    </form>
  );
}
