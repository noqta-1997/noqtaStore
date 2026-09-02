import type { InputHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type InputSize = "sm" | "md" | "lg";

/**
 * Fluent's `outline` appearance, kept as a bare `<input>`.
 *
 * Eight of nine form primitives here are consumed by Server Components that
 * submit through `FormData`, so none of them may become a client component.
 * That rules out Fluent's React inputs and keeps this a styled native element.
 */
const sizes: Record<InputSize, string> = {
  sm: "h-6 text-label-md",
  md: "h-8 text-body-md",
  lg: "h-10 text-body-lg",
};

/**
 * The bottom stroke is Fluent's field signature: a darker resting rule that
 * turns into a 2px accent bar on focus. It is drawn with an inset shadow
 * rather than a border so focus does not shift the layout by a pixel, and it
 * replaces the global focus ring — at 6.48:1 it carries the indication on its
 * own, which is how Fluent treats fields.
 */
export const fieldStyles =
  "w-full rounded-md border border-line border-b-line-strong bg-card px-2.5 " +
  "text-on-surface placeholder:text-muted " +
  "transition-colors duration-100 ease-fluent " +
  "hover:border-line-hover hover:border-b-line-strong " +
  "focus:border-b-accent-stroke focus:outline-none " +
  "focus:shadow-[inset_0_-2px_0_0_var(--colorCompoundBrandStroke)] " +
  "focus-visible:outline-none " +
  "aria-invalid:border-error aria-invalid:border-b-error " +
  "disabled:cursor-not-allowed disabled:border-state-disabled-line " +
  "disabled:bg-state-disabled-bg disabled:text-state-disabled-fg";

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: InputSize;
}

export function Input({ className, type = "text", size = "md", ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(fieldStyles, sizes[size], className)}
      {...props}
    />
  );
}
