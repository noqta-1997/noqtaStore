import { Search } from "lucide-react";
import Form from "next/form";

import { cn } from "@/lib/utils";

interface SearchBarProps {
  placeholder: string;
  label: string;
  action: string;
  /**
   * The field's id, which the label points at. The header draws this form
   * twice — a pill in the row on wide screens and a full field under it on
   * narrow ones — and the search page draws it a third time, so each caller
   * names its own: with one shared id every label pointed at the first
   * field in the document, a hidden one.
   */
  id?: string;
  defaultValue?: string;
  /** Larger variant used on the search results page. */
  size?: "md" | "lg";
  /**
   * Header variant: a pill with the magnifier as the only affordance. The
   * submit button is dropped because the form still submits on Enter — the
   * action, the field name and the method are untouched.
   */
  compact?: boolean;
  className?: string;
}

/**
 * Header search — a rounded well with a single warm action.
 *
 * It is `next/form`, not a `<form>`: submitting one walks the router to the
 * results page, with the query folded into the URL exactly as a GET would,
 * so the header stays put and the results page's skeleton shows while the
 * search runs. A plain form was a document load — the store rebuilt from
 * the top for every query typed into its own header.
 */
export function SearchBar({
  placeholder,
  label,
  action,
  id = "site-search",
  defaultValue,
  size = "md",
  compact = false,
  className,
}: SearchBarProps) {
  return (
    <Form
      action={action}
      role="search"
      className={cn(
        "flex items-center gap-1 rounded-full border border-line bg-card ps-3 pe-1",
        "transition-shadow duration-100 ease-fluent focus-within:elevation-sm",
        compact ? "py-0.5" : "p-1 ps-3",
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <Search
        aria-hidden
        className="size-4 shrink-0 text-muted"
        strokeWidth={1.75}
      />
      <input
        id={id}
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        defaultValue={defaultValue}
        className={cn(
          "w-full min-w-0 bg-transparent px-1 text-body-md text-ellipsis text-on-surface placeholder:text-muted focus:outline-none",
          size === "lg" ? "h-12" : compact ? "h-9" : "h-10",
        )}
      />
      {compact ? null : (
        <button
          type="submit"
          className={cn(
            "hidden shrink-0 rounded-full bg-primary-container px-5 text-label-md font-semibold text-on-primary-container",
            "transition-colors duration-100 ease-fluent hover:bg-primary-container-hover sm:block",
            size === "lg" ? "h-12" : "h-9",
          )}
        >
          {label}
        </button>
      )}
    </Form>
  );
}
